"use node";

import OpenAI from "openai";

export interface TradingAnalysis {
  action: "open_long" | "open_short" | "close_position" | "hold";
  confidence: number;
  reasoning: string;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  positionSize?: number;
  riskLevel: "low" | "medium" | "high";
}

export interface MarketData {
  symbol: string;
  currentPrice: number;
  volume24h?: number;
  priceChange24h?: number;
  high24h?: number;
  low24h?: number;
  chartType?: "time" | "range";
  chartInterval?: string;
  // Perpetual futures specific data
  markPrice?: number;
  indexPrice?: number;
  fundingRate?: number;
  nextFundingTime?: number;
  openInterest?: number;
  longShortRatio?: number;
  currentPosition?: {
    side: "long" | "short";
    size: number;
    entryPrice: number;
    unrealizedPnl: number;
    liquidationPrice?: number;
  };
}

export interface AIModelResponse {
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  reasoning: string;
}

export class DeepSeekService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
    });
  }

  async analyzeMarket(
    marketData: MarketData,
    balance: number,
    riskSettings: {
      takeProfitPercent: number;
      stopLossPercent: number;
      maxPositionSize?: number;
      leverage?: number;
      allowAILeverage?: boolean;
    }
  ): Promise<TradingAnalysis> {
    const chartTypeContext = marketData.chartType === "range" 
      ? `RANGE CHART ANALYSIS: This is a Range chart (not time-based). Range charts display price bars based on fixed price movements rather than time intervals. This means:
- Each bar represents a specific price range movement (e.g., 1R = $1 movement, 10R = $10 movement)
- Eliminates time-based noise and consolidation periods
- Provides clearer trend identification and support/resistance levels
- Better for identifying true price action and momentum
- More reliable for breakout and reversal patterns
When analyzing Range charts, focus on:
1. Price momentum and directional strength
2. Clear support/resistance levels
3. Breakout patterns are more significant
4. Trend continuation signals are more reliable`
      : `TIME-BASED CHART ANALYSIS: Standard time-interval chart (${marketData.chartInterval}). Each bar represents a fixed time period.`;

    const leverageContext = riskSettings.allowAILeverage 
      ? `LEVERAGE ENABLED: You can recommend leverage up to ${riskSettings.leverage}x for this trade. Consider:
- Higher leverage increases both potential profit and risk
- Use lower leverage (1-3x) for uncertain market conditions
- Use moderate leverage (3-10x) for clear trends with good risk/reward
- Use higher leverage (10x+) only for very high confidence setups with tight stop losses
- Always account for liquidation risk when recommending leverage`
      : `LEVERAGE DISABLED: User has set leverage to ${riskSettings.leverage}x. Do not recommend changing leverage.`;

    // Funding rate context
    const fundingContext = marketData.fundingRate !== undefined
      ? `
=== FUNDING RATE DATA ===
Current Funding Rate: ${(marketData.fundingRate * 100).toFixed(4)}% (${marketData.fundingRate > 0 ? 'Longs pay shorts' : 'Shorts pay longs'})
Next Funding: ${marketData.nextFundingTime ? new Date(marketData.nextFundingTime).toLocaleString() : 'N/A'}
Funding Impact: ${Math.abs(marketData.fundingRate) > 0.01 ? '⚠️ HIGH - Consider funding costs' : '✅ Normal'}
${marketData.fundingRate > 0.05 ? '🔴 EXTREME POSITIVE FUNDING - Bearish signal (many longs)' : ''}
${marketData.fundingRate < -0.05 ? '🔴 EXTREME NEGATIVE FUNDING - Bullish signal (many shorts)' : ''}
`
      : '';

    // Open interest context
    const openInterestContext = marketData.openInterest !== undefined
      ? `
=== OPEN INTEREST & MARKET STRUCTURE ===
Open Interest: ${marketData.openInterest.toLocaleString()} contracts
Long/Short Ratio: ${marketData.longShortRatio?.toFixed(2) || 'N/A'}
Market Sentiment: ${marketData.longShortRatio && marketData.longShortRatio > 1.2 ? '⚠️ Crowded longs' : marketData.longShortRatio && marketData.longShortRatio < 0.8 ? '⚠️ Crowded shorts' : '✅ Balanced'}
`
      : '';

    // Price discrepancy context
    const priceContext = marketData.markPrice && marketData.indexPrice
      ? `
=== PRICE ANALYSIS ===
Last Price: $${marketData.currentPrice}
Mark Price: $${marketData.markPrice} (used for liquidations)
Index Price: $${marketData.indexPrice} (spot reference)
Price Discrepancy: ${((marketData.markPrice - marketData.indexPrice) / marketData.indexPrice * 100).toFixed(3)}%
${Math.abs((marketData.markPrice - marketData.indexPrice) / marketData.indexPrice) > 0.005 ? '⚠️ Significant price discrepancy detected' : ''}
`
      : '';

    const systemPrompt = `You are an expert cryptocurrency PERPETUAL FUTURES trading analyst specializing in derivatives trading and technical analysis.

TRADING CONTEXT: PERPETUAL FUTURES (NOT SPOT)
- You are trading perpetual swap contracts on Hyperliquid DEX
- These are leveraged derivative contracts that never expire
- Funding rates apply every 8 hours (can be positive or negative)
- Liquidation occurs when margin ratio falls below maintenance margin
- Mark price (not last price) is used for liquidation calculations
- Open interest and long/short ratios affect market sentiment

${chartTypeContext}

${leverageContext}

PERPETUAL FUTURES RISK FACTORS:
1. **Liquidation Risk**: Calculate safe liquidation distance based on leverage
   - 5x leverage: ~20% move against position triggers liquidation
   - 10x leverage: ~10% move against position triggers liquidation
   - 20x leverage: ~5% move against position triggers liquidation
   - 40x leverage: ~2.5% move against position triggers liquidation

2. **Funding Rates**: Consider funding rate impact on position profitability
   - Positive funding: Longs pay shorts (bearish signal if high)
   - Negative funding: Shorts pay longs (bullish signal if high)
   - High funding rates can erode profits over time
   - Extreme funding rates (>0.05% or <-0.05%) indicate crowded positions

3. **Position Sizing for Derivatives**:
   - Never risk more than 2-5% of account balance per trade
   - Account for leverage amplification of both gains AND losses
   - Consider volatility when sizing positions

4. **Market Structure for Perpetuals**:
   - Check for liquidation cascades (rapid price moves)
   - Monitor open interest changes (increasing = new positions, decreasing = closing)
   - Be aware of funding rate arbitrage opportunities
   - Long/Short ratio imbalances can signal potential reversals

Your analysis must consider:
1. Current market conditions and price action
2. Chart type characteristics (Range vs Time-based)
3. Perpetual futures-specific risk management
4. Liquidation price safety margin (minimum 15-20% buffer recommended)
5. Position sizing based on account balance and leverage multiplier
6. Stop loss placement to avoid liquidation
7. Take profit levels considering funding rate costs
8. Market sentiment from derivatives data (funding, OI, long/short ratio)
9. Mark price vs Index price discrepancies

Respond ONLY with valid JSON matching this exact structure:
{
  "action": "open_long" | "open_short" | "close_position" | "hold",
  "confidence": 0.0 to 1.0,
  "reasoning": "detailed explanation including perpetual futures context, liquidation risk, funding considerations, chart analysis, and leverage rationale",
  "entryPrice": number (if opening position),
  "stopLoss": number (if opening position),
  "takeProfit": number (if opening position),
  "positionSize": number (if opening position, in USD),
  "riskLevel": "low" | "medium" | "high",
  "liquidationPrice": number (if opening position),
  "estimatedFundingCost": number (estimated 24h funding cost in USD),
  "riskRewardRatio": number
}`;

    const liquidationDistance = riskSettings.leverage ? (100 / riskSettings.leverage).toFixed(2) : "N/A";
    const maxPositionValue = (balance * (riskSettings.leverage || 1)).toFixed(2);
    const recommendedRisk = (balance * 0.02).toFixed(2); // 2% risk per trade

    const userPrompt = `Analyze this PERPETUAL FUTURES trading opportunity on Hyperliquid DEX:

=== MARKET DATA ===
Symbol: ${marketData.symbol} PERPETUAL
Chart Type: ${marketData.chartType === "range" ? "RANGE CHART" : "TIME-BASED CHART"}
Chart Interval: ${marketData.chartInterval || "N/A"}
Current Price: ${marketData.currentPrice}
24h Change: ${marketData.priceChange24h?.toFixed(2)}%
24h High: ${marketData.high24h}
24h Low: ${marketData.low24h}
24h Volume: ${marketData.volume24h?.toLocaleString()}

${priceContext}

${fundingContext}

${openInterestContext}

=== ACCOUNT & RISK PARAMETERS ===
Account Balance: ${balance}
Leverage: ${riskSettings.leverage}x ${riskSettings.allowAILeverage ? '(AI can adjust within limits)' : '(FIXED - do not change)'}
Max Position Value: ${maxPositionValue} (Balance × Leverage)
Recommended Risk Per Trade: ${recommendedRisk} (2% of balance)
Liquidation Distance: ~${liquidationDistance}% move against position

Risk Settings:
- Take Profit Target: ${riskSettings.takeProfitPercent}%
- Stop Loss: ${riskSettings.stopLossPercent}%
- Max Position Size: ${riskSettings.maxPositionSize || balance * 0.1}

=== LIQUIDATION SAFETY ===
At ${riskSettings.leverage}x leverage:
- Liquidation occurs at ~${liquidationDistance}% price move against you
- CRITICAL: Your stop loss MUST be tighter than liquidation distance
- Recommended: Stop loss at ${Math.min(parseFloat(liquidationDistance) * 0.6, riskSettings.stopLossPercent).toFixed(1)}% or less for safety buffer

${marketData.currentPosition ? `
=== CURRENT OPEN POSITION ===
- Side: ${marketData.currentPosition.side.toUpperCase()}
- Size: ${marketData.currentPosition.size}
- Entry Price: ${marketData.currentPosition.entryPrice}
- Current Price: ${marketData.currentPrice}
- Unrealized PnL: ${marketData.currentPosition.unrealizedPnl}
- Liquidation Price: ${marketData.currentPosition.liquidationPrice || 'N/A'}
- Position Status: ${marketData.currentPosition.unrealizedPnl > 0 ? 'IN PROFIT ✅' : 'IN LOSS ⚠️'}
` : "No current position - Fresh analysis for new trade"}

${marketData.chartType === "range" ? "⚠️ RANGE CHART ANALYSIS: Focus on price momentum, clear breakouts, and strong directional moves. Range charts filter out time-based noise and show pure price action." : ""}

=== YOUR TASK ===
Provide a comprehensive perpetual futures trading recommendation considering:
1. Technical analysis of price action and chart patterns
2. Liquidation risk at current leverage (${riskSettings.leverage}x)
3. Funding rate impact on position profitability
4. Market sentiment from derivatives data (OI, long/short ratio)
5. Proper position sizing (max 2-5% account risk)
6. Stop loss placement with safety buffer from liquidation
7. Take profit targets based on risk/reward ratio (minimum 1:2)
8. Mark price vs Index price discrepancies
9. Market volatility and recent price action

Remember: This is LEVERAGED DERIVATIVES trading - losses are amplified ${riskSettings.leverage || 1}x. Prioritize capital preservation.`;

    try {
      const response = await this.client.chat.completions.create({
        model: "deepseek/deepseek-chat-v3.1:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from DeepSeek");
      }

      const analysis: TradingAnalysis = JSON.parse(content);
      
      // Validate the response
      if (!analysis.action || !analysis.reasoning || analysis.confidence === undefined) {
        throw new Error("Invalid response format from DeepSeek");
      }

      return analysis;
    } catch (error) {
      console.error("DeepSeek analysis error:", error);
      throw error;
    }
  }

  async shouldAdjustStopLoss(
    currentPosition: {
      side: "long" | "short";
      entryPrice: number;
      currentPrice: number;
      stopLoss: number;
      unrealizedPnl: number;
    },
    useTrailingStop: boolean
  ): Promise<{ shouldAdjust: boolean; newStopLoss?: number; reasoning: string }> {
    if (!useTrailingStop) {
      return { shouldAdjust: false, reasoning: "Trailing stop not enabled" };
    }

    const systemPrompt = `You are a risk management expert. Analyze if a stop loss should be adjusted based on current position performance.

Respond ONLY with valid JSON:
{
  "shouldAdjust": boolean,
  "newStopLoss": number (if shouldAdjust is true),
  "reasoning": "explanation"
}`;

    const userPrompt = `Current Position:
Side: ${currentPosition.side}
Entry Price: $${currentPosition.entryPrice}
Current Price: $${currentPosition.currentPrice}
Current Stop Loss: $${currentPosition.stopLoss}
Unrealized PnL: $${currentPosition.unrealizedPnl}

Should we adjust the stop loss to lock in profits or reduce risk?`;

    try {
      const response = await this.client.chat.completions.create({
        model: "deepseek/deepseek-chat-v3.1:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from DeepSeek");
      }

      return JSON.parse(content);
    } catch (error) {
      console.error("Stop loss adjustment analysis error:", error);
      return { shouldAdjust: false, reasoning: "Error analyzing position" };
    }
  }
}
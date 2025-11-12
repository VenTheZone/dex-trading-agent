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
  currentPosition?: {
    side: "long" | "short";
    size: number;
    entryPrice: number;
    unrealizedPnl: number;
  };
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

    const systemPrompt = `You are an expert cryptocurrency trading analyst specializing in technical analysis.

${chartTypeContext}

Your analysis must consider:
1. Current market conditions and price action
2. Chart type characteristics (Range vs Time-based)
3. Risk management principles
4. Position sizing based on account balance
5. Stop loss and take profit levels

Respond ONLY with valid JSON matching this exact structure:
{
  "action": "open_long" | "open_short" | "close_position" | "hold",
  "confidence": 0.0 to 1.0,
  "reasoning": "detailed explanation including chart type analysis",
  "entryPrice": number (if opening position),
  "stopLoss": number (if opening position),
  "takeProfit": number (if opening position),
  "positionSize": number (if opening position, in USD),
  "riskLevel": "low" | "medium" | "high"
}`;

    const userPrompt = `Analyze this trading opportunity:

Symbol: ${marketData.symbol}
Chart Type: ${marketData.chartType === "range" ? "RANGE CHART" : "TIME-BASED CHART"}
Chart Interval: ${marketData.chartInterval || "N/A"}
Current Price: $${marketData.currentPrice}
24h Change: ${marketData.priceChange24h?.toFixed(2)}%
24h High: $${marketData.high24h}
24h Low: $${marketData.low24h}
24h Volume: $${marketData.volume24h?.toLocaleString()}

Account Balance: $${balance}
Risk Settings:
- Take Profit: ${riskSettings.takeProfitPercent}%
- Stop Loss: ${riskSettings.stopLossPercent}%
- Max Position Size: ${riskSettings.maxPositionSize || balance * 0.1}

${marketData.currentPosition ? `
Current Position:
- Side: ${marketData.currentPosition.side}
- Size: ${marketData.currentPosition.size}
- Entry: $${marketData.currentPosition.entryPrice}
- Unrealized PnL: $${marketData.currentPosition.unrealizedPnl}
` : "No current position"}

${marketData.chartType === "range" ? "IMPORTANT: This is a Range chart. Focus on price momentum, clear breakouts, and strong directional moves. Range charts filter out time-based noise." : ""}

Provide your trading recommendation.`;

    try {
      const response = await this.client.chat.completions.create({
        model: "deepseek/deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000,
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
        model: "deepseek/deepseek-chat",
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
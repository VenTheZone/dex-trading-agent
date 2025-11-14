# OpenRouter AI API - AI Model Integration

## Overview

The DeX Trading Agent uses **OpenRouter** as an AI gateway to access multiple large language models for market analysis and trading decisions. This document details the complete AI integration architecture, model selection, prompt engineering, response parsing, and cost optimization strategies.

**OpenRouter Base URL:** `https://openrouter.ai/api/v1`

**Supported Models:**
- **DeepSeek V3.1** (`deepseek/deepseek-chat-v3-0324:free`) - Free tier
- **Qwen3 Max** (`qwen/qwen3-max`) - Paid tier

**Last Updated:** November 15, 2025  
**Maintained By:** VenTheZone

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Model Selection](#model-selection)
3. [DeepSeekService Class](#deepseekservice-class)
4. [Market Analysis Workflow](#market-analysis-workflow)
5. [Prompt Engineering](#prompt-engineering)
6. [Response Parsing](#response-parsing)
7. [Multi-Chart Analysis](#multi-chart-analysis)
8. [Cost Optimization](#cost-optimization)
9. [Error Handling](#error-handling)
10. [Integration Patterns](#integration-patterns)
11. [Best Practices](#best-practices)

---

## 1. Architecture Overview

### AI Integration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │  TradingControls │────────▶│  use-trading.ts  │            │
│  │  (AI Settings)   │         │  (AI Analysis)   │            │
│  └──────────────────┘         └──────────────────┘            │
│           │                            │                        │
│           │ API Key                    │ runAIAnalysis()       │
│           │ Model Selection            │ runMultiChartAI()     │
│           ▼                            ▼                        │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │           python-api-client.ts                          │  │
│  │  • analyzeMarket()                                      │  │
│  │  • analyzeMultiChart()                                  │  │
│  └─────────────────────────────────────────────────────────┘  │
│           │                            │                        │
└───────────┼────────────────────────────┼────────────────────────┘
            │                            │
            │ HTTP POST                  │ HTTP POST
            │ /api/ai/analyze            │ /api/ai/analyze-multi-chart
            ▼                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Python FastAPI)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              AI Service (deepseek.ts)                   │  │
│  │  • DeepSeekService class                                │  │
│  │  • analyzeMarket()                                      │  │
│  │  • shouldAdjustStopLoss()                               │  │
│  └─────────────────────────────────────────────────────────┘  │
│           │                            │                        │
│           │ OpenAI SDK                 │ API Request            │
│           ▼                            ▼                        │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │           OpenRouter API Gateway                        │  │
│  │  Base URL: https://openrouter.ai/api/v1                │  │
│  └─────────────────────────────────────────────────────────┘  │
│           │                            │                        │
└───────────┼────────────────────────────┼────────────────────────┘
            │                            │
            │ Model Routing              │ Model Routing
            ▼                            ▼
┌─────────────────────┐        ┌─────────────────────┐
│   DeepSeek V3.1     │        │    Qwen3 Max        │
│   (Free Tier)       │        │   (Paid Tier)       │
│                     │        │                     │
│ • Fast responses    │        │ • Higher accuracy   │
│ • No cost           │        │ • Better reasoning  │
│ • Rate limited      │        │ • Cost per token    │
└─────────────────────┘        └─────────────────────┘
```

### Key Components

1. **Frontend AI Controls** (`TradingControls.tsx`)
   - Model selection (DeepSeek/Qwen)
   - Custom prompt templates
   - Auto-trading toggle
   - Cost warnings

2. **Trading Hook** (`use-trading.ts`)
   - AI analysis orchestration
   - Multi-chart coordination
   - Trade execution based on AI
   - Error handling

3. **API Client** (`python-api-client.ts`)
   - HTTP requests to backend
   - Request/response typing
   - Error propagation

4. **Backend Service** (`deepseek.ts`)
   - OpenRouter integration
   - Prompt construction
   - Response validation
   - Model management

---

## 2. Model Selection

### Available Models

#### DeepSeek V3.1 (Free Tier)

**Model ID:** `deepseek/deepseek-chat-v3-0324:free`

**Characteristics:**
- ✅ **Free:** No API costs
- ✅ **Fast:** 2-5 second response time
- ✅ **Capable:** Good for technical analysis
- ⚠️ **Rate Limited:** 10 requests/minute
- ⚠️ **Context:** 32K tokens max

**Best For:**
- Demo mode testing
- Frequent analysis (auto-trading)
- Budget-conscious users
- Learning and experimentation

**Cost:** $0.00 per request

---

#### Qwen3 Max (Paid Tier)

**Model ID:** `qwen/qwen3-max`

**Characteristics:**
- ✅ **Accurate:** Superior reasoning
- ✅ **Detailed:** More comprehensive analysis
- ✅ **Reliable:** Better consistency
- ⚠️ **Paid:** ~$0.02-0.05 per analysis
- ⚠️ **Slower:** 3-7 second response time

**Best For:**
- Live trading with real funds
- High-stakes decisions
- Complex market conditions
- Professional traders

**Cost:** ~$0.02-0.05 per request (varies by token usage)

---

### Model Selection Logic

**Frontend Selection:**

```typescript
// TradingControls.tsx
const [aiModel, setAiModel] = useState<'deepseek/deepseek-chat-v3-0324:free' | 'qwen/qwen3-max'>('deepseek/deepseek-chat-v3-0324:free');

// Cost warning for Qwen
{aiModel === 'qwen/qwen3-max' && (
  <Alert>
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      Qwen3 Max is a paid model (~$0.02-0.05 per analysis). 
      Costs will be charged to your OpenRouter account.
    </AlertDescription>
  </Alert>
)}
```

**Backend Usage:**

```typescript
// deepseek.ts
const response = await this.client.chat.completions.create({
  model: aiModel, // Passed from frontend
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ],
  response_format: { type: "json_object" },
  temperature: 0.7,
  max_tokens: 1500,
});
```

---

## 3. DeepSeekService Class

### Class Structure

**Location:** `src/lib/deepseek.ts`

**Purpose:** Encapsulates all AI analysis logic using OpenRouter API

```typescript
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
    riskSettings: RiskSettings
  ): Promise<TradingAnalysis> {
    // Market analysis implementation
  }

  async shouldAdjustStopLoss(
    currentPosition: Position,
    useTrailingStop: boolean
  ): Promise<StopLossAdjustment> {
    // Stop loss adjustment logic
  }
}
```

### Type Definitions

**TradingAnalysis Interface:**

```typescript
export interface TradingAnalysis {
  action: "open_long" | "open_short" | "close_position" | "hold";
  confidence: number; // 0-100
  reasoning: string;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  positionSize?: number;
  riskLevel: "low" | "medium" | "high";
  liquidationPrice?: number;
  estimatedFundingCost?: number;
  riskRewardRatio?: number;
}
```

**MarketData Interface:**

```typescript
export interface MarketData {
  symbol: string;
  currentPrice: number;
  volume24h?: number;
  priceChange24h?: number;
  high24h?: number;
  low24h?: number;
  chartType?: "time" | "range";
  chartInterval?: string;
  // Perpetual futures specific
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
```

---

## 4. Market Analysis Workflow

### Single Chart Analysis

**Endpoint:** `POST /api/ai/analyze`

**Flow:**

```
1. Frontend calls runAIAnalysis(symbol, currentPrice)
   ↓
2. Validate OpenRouter API key
   ↓
3. Construct market data context
   ↓
4. Send to Python backend via pythonApi.analyzeMarket()
   ↓
5. Backend constructs system + user prompts
   ↓
6. Call OpenRouter API with selected model
   ↓
7. Parse JSON response
   ↓
8. Validate response structure
   ↓
9. Return TradingAnalysis to frontend
   ↓
10. Log analysis result
```

**Frontend Implementation:**

```typescript
// use-trading.ts
const runAIAnalysis = async (symbol: string, currentPrice: number) => {
  const keys = storage.getApiKeys();
  const openRouterKey = keys?.openRouter || '';
  
  // Validate API key
  if (!openRouterKey.startsWith('sk-or-v1-')) {
    throw new Error('Invalid OpenRouter API key format');
  }
  
  const chartData = `
    === MARKET DATA ===
    Symbol: ${symbol}
    Current Price: ${currentPrice.toLocaleString()}
    Chart Type: ${chartType}
    Timeframe: ${chartInterval}
    
    === TRADING PARAMETERS ===
    Account Balance: ${balance.toLocaleString()}
    Leverage: ${settings.leverage}x
    Take Profit Target: ${settings.takeProfitPercent}%
    Stop Loss: ${settings.stopLossPercent}%
  `;
  
  const analysis = await pythonApi.analyzeMarket({
    apiKey: openRouterKey,
    symbol,
    chartData,
    userBalance: balance,
    settings: {
      takeProfitPercent: settings.takeProfitPercent,
      stopLossPercent: settings.stopLossPercent,
      useAdvancedStrategy: settings.useAdvancedStrategy,
    },
    isDemoMode: storage.isDemoMode(),
    aiModel,
    customPrompt,
  });
  
  return analysis;
};
```

---

### Multi-Chart Analysis

**Endpoint:** `POST /api/ai/analyze-multi-chart`

**Purpose:** Analyze multiple trading pairs simultaneously and select the best opportunity

**Flow:**

```
1. Frontend calls runMultiChartAIAnalysis(charts[])
   ↓
2. Validate OpenRouter API key
   ↓
3. Filter charts by allowedCoins setting
   ↓
4. Fetch current prices for all symbols
   ↓
5. Construct multi-chart context
   ↓
6. Send to Python backend via pythonApi.analyzeMultiChart()
   ↓
7. Backend constructs comparative analysis prompt
   ↓
8. Call OpenRouter API with selected model
   ↓
9. AI selects best trading opportunity
   ↓
10. Parse JSON response with recommendedSymbol
   ↓
11. Return TradingAnalysis to frontend
   ↓
12. Execute trade on recommended symbol
```

**Frontend Implementation:**

```typescript
// use-trading.ts
const runMultiChartAIAnalysis = async (
  charts: Array<{ symbol: string; currentPrice: number }>
) => {
  const { setAiThinking, setAiThoughts } = useTradingStore.getState();
  
  setAiThinking(true);
  setAiThoughts('🔍 Initializing AI analysis...');
  
  const allowedCoins = settings.allowedCoins || [];
  const filteredCharts = charts.filter(chart => 
    allowedCoins.includes(chart.symbol)
  );
  
  const multiChartData = filteredCharts.map(chart => ({
    symbol: chart.symbol,
    currentPrice: chart.currentPrice,
    chartType: chartType,
    chartInterval: chartInterval,
    technicalContext: `Price: ${chart.currentPrice.toLocaleString()}`,
  }));
  
  const analysis = await pythonApi.analyzeMultiChart({
    apiKey: openRouterKey,
    charts: multiChartData,
    userBalance: balance,
    settings: {
      takeProfitPercent: settings.takeProfitPercent,
      stopLossPercent: settings.stopLossPercent,
      useAdvancedStrategy: settings.useAdvancedStrategy,
      leverage: settings.leverage,
      allowAILeverage: settings.allowAILeverage,
    },
    isDemoMode,
    aiModel,
    customPrompt,
  });
  
  setAiThoughts(`✅ AI Analysis Complete!
    
📊 Recommendation: ${analysis.action.toUpperCase()}
🎯 Confidence: ${analysis.confidence}%
💰 Symbol: ${analysis.recommendedSymbol}

💭 Reasoning:
${analysis.reasoning}`);
  
  return analysis;
};
```

---

## 5. Prompt Engineering

### System Prompt Structure

**Purpose:** Define AI's role, context, and output format

**Key Components:**

1. **Role Definition**
   - Expert cryptocurrency perpetual futures analyst
   - Specialization in derivatives trading
   - Technical analysis expertise

2. **Trading Context**
   - Perpetual futures (not spot)
   - Leveraged derivative contracts
   - Funding rates every 8 hours
   - Liquidation mechanics

3. **Chart Type Context**
   - Range chart vs time-based analysis
   - Price action interpretation
   - Noise filtering

4. **Leverage Context**
   - AI leverage adjustment permissions
   - Liquidation risk calculations
   - Safe leverage recommendations

5. **Risk Factors**
   - Liquidation risk formulas
   - Funding rate impact
   - Position sizing guidelines
   - Market structure analysis

6. **Output Format**
   - JSON response structure
   - Required fields
   - Validation rules

**Example System Prompt:**

```typescript
const systemPrompt = `You are an expert cryptocurrency PERPETUAL FUTURES trading analyst specializing in derivatives trading and technical analysis.

TRADING CONTEXT: PERPETUAL FUTURES (NOT SPOT)
- You are trading perpetual swap contracts on Hyperliquid DEX
- These are leveraged derivative contracts that never expire
- Funding rates apply every 8 hours (can be positive or negative)
- Liquidation occurs when margin ratio falls below maintenance margin
- Mark price (not last price) is used for liquidation calculations

${chartTypeContext}

${leverageContext}

PERPETUAL FUTURES RISK FACTORS:
1. **Liquidation Risk**: Calculate safe liquidation distance based on leverage
   - 5x leverage: ~20% move against position triggers liquidation
   - 10x leverage: ~10% move against position triggers liquidation
   - 20x leverage: ~5% move against position triggers liquidation

2. **Funding Rates**: Consider funding rate impact on position profitability
   - Positive funding: Longs pay shorts (bearish signal if high)
   - Negative funding: Shorts pay longs (bullish signal if high)
   - Extreme funding rates (>0.05%) indicate crowded positions

3. **Position Sizing for Derivatives**:
   - Never risk more than 2-5% of account balance per trade
   - Account for leverage amplification of both gains AND losses

Respond ONLY with valid JSON matching this exact structure:
{
  "action": "open_long" | "open_short" | "close_position" | "hold",
  "confidence": 0.0 to 1.0,
  "reasoning": "detailed explanation",
  "entryPrice": number,
  "stopLoss": number,
  "takeProfit": number,
  "positionSize": number,
  "riskLevel": "low" | "medium" | "high",
  "liquidationPrice": number,
  "estimatedFundingCost": number,
  "riskRewardRatio": number
}`;
```

---

### User Prompt Structure

**Purpose:** Provide specific market data and analysis request

**Components:**

1. **Market Data Section**
   - Symbol and price information
   - 24h statistics (high, low, volume, change)
   - Chart type and interval

2. **Price Context**
   - Last price vs mark price vs index price
   - Price discrepancy warnings

3. **Funding Rate Data**
   - Current funding rate
   - Next funding time
   - Funding impact assessment
   - Extreme funding warnings

4. **Open Interest & Market Structure**
   - Open interest volume
   - Long/short ratio
   - Market sentiment indicators

5. **Account & Risk Parameters**
   - Account balance
   - Leverage settings
   - Max position value
   - Recommended risk per trade
   - Liquidation distance

6. **Current Position (if exists)**
   - Position side and size
   - Entry price and current price
   - Unrealized PnL
   - Liquidation price

7. **Task Instructions**
   - Analysis requirements
   - Risk considerations
   - Output expectations

**Example User Prompt:**

```typescript
const userPrompt = `Analyze this PERPETUAL FUTURES trading opportunity on Hyperliquid DEX:

=== MARKET DATA ===
Symbol: ${marketData.symbol} PERPETUAL
Chart Type: ${marketData.chartType === "range" ? "RANGE CHART" : "TIME-BASED CHART"}
Current Price: ${marketData.currentPrice}
24h Change: ${marketData.priceChange24h?.toFixed(2)}%
24h High: ${marketData.high24h}
24h Low: ${marketData.low24h}

=== FUNDING RATE DATA ===
Current Funding Rate: ${(marketData.fundingRate * 100).toFixed(4)}%
Next Funding: ${new Date(marketData.nextFundingTime).toLocaleString()}
${marketData.fundingRate > 0.05 ? '🔴 EXTREME POSITIVE FUNDING - Bearish signal' : ''}

=== ACCOUNT & RISK PARAMETERS ===
Account Balance: ${balance}
Leverage: ${riskSettings.leverage}x
Max Position Value: ${balance * riskSettings.leverage}
Liquidation Distance: ~${(100 / riskSettings.leverage).toFixed(2)}%

=== YOUR TASK ===
Provide a comprehensive perpetual futures trading recommendation considering:
1. Technical analysis of price action
2. Liquidation risk at current leverage
3. Funding rate impact
4. Market sentiment from derivatives data
5. Proper position sizing (max 2-5% account risk)
6. Stop loss placement with safety buffer
7. Take profit targets (minimum 1:2 risk/reward)`;
```

---

### Custom Prompt Templates

**Feature:** Users can customize AI analysis prompts

**Location:** `TradingControls.tsx` → Custom Prompt Template section

**Default Template:**

```
You are analyzing {symbol} perpetual futures on Hyperliquid.

Current market conditions:
- Price: {currentPrice}
- 24h Change: {priceChange24h}%
- Funding Rate: {fundingRate}%

Account settings:
- Balance: {balance}
- Leverage: {leverage}x
- Risk per trade: {riskPercent}%

Provide a trading recommendation with:
1. Action (open_long/open_short/close/hold)
2. Confidence level (0-100)
3. Entry price, stop loss, take profit
4. Position size
5. Detailed reasoning

Consider:
- Liquidation risk
- Funding rate costs
- Market sentiment
- Risk/reward ratio (minimum 1:2)
```

**Usage:**

```typescript
// TradingControls.tsx
const [customPrompt, setCustomPrompt] = useState(DEFAULT_PROMPT);

// Sanitize multiline text
const sanitizeMultilineText = (text: string) => {
  return text
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim();
};

// Apply custom prompt
const handleApplySettings = () => {
  useTradingStore.setState({
    customPrompt: sanitizeMultilineText(customPrompt),
  });
};
```

---

## 6. Response Parsing

### JSON Response Format

**Expected Structure:**

```json
{
  "action": "open_long",
  "confidence": 85,
  "reasoning": "Strong bullish momentum with RSI oversold and funding rate negative...",
  "entryPrice": 45000.0,
  "stopLoss": 44000.0,
  "takeProfit": 47000.0,
  "positionSize": 0.1,
  "riskLevel": "medium",
  "liquidationPrice": 36000.0,
  "estimatedFundingCost": 5.0,
  "riskRewardRatio": 2.0
}
```

### Validation Logic

**Backend Validation:**

```typescript
// deepseek.ts
const content = response.choices[0]?.message?.content;
if (!content) {
  throw new Error("No response from AI model");
}

const analysis: TradingAnalysis = JSON.parse(content);

// Validate required fields
if (!analysis.action || !analysis.reasoning || analysis.confidence === undefined) {
  throw new Error("Invalid response format from AI model");
}

// Validate action type
const validActions = ["open_long", "open_short", "close_position", "hold"];
if (!validActions.includes(analysis.action)) {
  throw new Error(`Invalid action: ${analysis.action}`);
}

// Validate confidence range
if (analysis.confidence < 0 || analysis.confidence > 100) {
  throw new Error(`Invalid confidence: ${analysis.confidence}`);
}

return analysis;
```

### Error Recovery

**Handling Invalid Responses:**

1. **JSON Parse Errors:**
   - Log raw response
   - Return error to frontend
   - Suggest model switch

2. **Missing Fields:**
   - Validate all required fields
   - Provide default values where safe
   - Log incomplete response

3. **Invalid Values:**
   - Range validation (confidence 0-100)
   - Enum validation (action types)
   - Numeric validation (prices, sizes)

---

## 7. Multi-Chart Analysis

### Comparative Analysis Prompt

**Purpose:** AI compares multiple trading pairs and selects the best opportunity

**System Prompt Addition:**

```typescript
const multiChartSystemPrompt = `${baseSystemPrompt}

MULTI-CHART ANALYSIS:
You are analyzing MULTIPLE trading pairs simultaneously. Your task is to:
1. Compare all provided charts
2. Identify the BEST trading opportunity
3. Recommend ONE symbol to trade
4. Explain why this symbol is superior to others

Selection Criteria:
- Strongest technical setup
- Best risk/reward ratio
- Clearest trend direction
- Lowest liquidation risk
- Most favorable funding rate
- Highest confidence level

Response Format:
{
  "recommendedSymbol": "BTC" | "ETH" | "SOL" | etc,
  "action": "open_long" | "open_short" | "hold",
  "confidence": 0-100,
  "reasoning": "Comparative analysis explaining why this symbol is best",
  "marketContext": "Overall market conditions across all analyzed pairs",
  ...
}`;
```

**User Prompt for Multi-Chart:**

```typescript
const multiChartUserPrompt = `Analyze these ${charts.length} PERPETUAL FUTURES trading pairs and select the BEST opportunity:

${charts.map((chart, i) => `
=== CHART ${i + 1}: ${chart.symbol} ===
Current Price: ${chart.currentPrice}
Chart Type: ${chart.chartType}
Timeframe: ${chart.chartInterval}
Technical Context: ${chart.technicalContext}
Mark Price: ${chart.markPrice}
Funding Rate: ${chart.fundingRate}%
Open Interest: ${chart.openInterest}
Long/Short Ratio: ${chart.longShortRatio}
`).join('\n')}

=== ACCOUNT PARAMETERS ===
Balance: ${balance}
Leverage: ${settings.leverage}x
Allowed Coins: ${settings.allowedCoins.join(', ')}

=== YOUR TASK ===
1. Analyze ALL ${charts.length} charts
2. Compare technical setups, risk/reward, and market conditions
3. Select the SINGLE BEST trading opportunity
4. Provide detailed reasoning for your selection
5. Explain why other symbols were not chosen

Remember: You must recommend ONE symbol from the allowed list.`;
```

---

## 8. Cost Optimization

### Token Usage Strategies

**1. Prompt Optimization:**
- Remove unnecessary whitespace
- Use abbreviations where clear
- Limit historical data to relevant timeframes
- Compress technical indicators

**2. Response Limits:**
```typescript
max_tokens: 1500, // Limit response length
```

**3. Model Selection:**
- Use DeepSeek (free) for frequent analysis
- Use Qwen3 Max only for critical decisions
- Switch models based on trading mode

**4. Caching:**
- Cache market data for 5 seconds
- Reuse analysis for similar conditions
- Avoid redundant API calls

### Cost Tracking

**Frontend Warning:**

```typescript
// TradingControls.tsx
{aiModel === 'qwen/qwen3-max' && (
  <Alert variant="warning">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Paid Model Selected</AlertTitle>
    <AlertDescription>
      Qwen3 Max costs approximately $0.02-0.05 per analysis.
      With auto-trading enabled, this could result in $1-3/hour in API costs.
      Consider using DeepSeek (free) for frequent analysis.
    </AlertDescription>
  </Alert>
)}
```

**Backend Logging:**

```typescript
// Log token usage
console.log(`AI Analysis: ${response.usage?.total_tokens} tokens used`);
console.log(`Estimated cost: $${(response.usage?.total_tokens * 0.00002).toFixed(4)}`);
```

---

## 9. Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid API key format` | Key doesn't start with `sk-or-v1-` | Check API key in Settings |
| `Rate limit exceeded` | Too many requests (free tier) | Wait 60 seconds or upgrade |
| `Model not found` | Invalid model ID | Use `deepseek/deepseek-chat-v3-0324:free` or `qwen/qwen3-max` |
| `Insufficient credits` | OpenRouter account balance low | Add credits to OpenRouter account |
| `Timeout` | AI response took too long | Retry or switch to faster model |
| `Invalid JSON response` | AI returned malformed JSON | Log response and retry |
| `Missing required fields` | AI didn't include all fields | Validate and use defaults |

### Error Recovery Flow

```typescript
// use-trading.ts
try {
  const analysis = await runAIAnalysis(symbol, currentPrice);
  return analysis;
} catch (error: any) {
  // Log error
  await pythonApi.createTradingLog({
    action: "ai_error",
    symbol,
    reason: `AI Analysis Error: ${error.message}`,
    details: `Model: ${aiModel}, Demo: ${storage.isDemoMode()}`,
  });
  
  // User feedback
  toast.error(`❌ AI Analysis failed: ${error.message}`, {
    description: "Check your API key and try again",
  });
  
  // Pause auto-trading on repeated errors
  if (isAutoTrading && errorCount > 3) {
    setAutoTrading(false);
    toast.warning("Auto-trading paused due to repeated AI errors");
  }
  
  throw error;
}
```

---

## 10. Integration Patterns

### Demo Mode Integration

**Behavior:**
- Requires valid OpenRouter API key for AI analysis
- Uses real AI models (DeepSeek free tier or paid Qwen)
- Simulates trades with paper trading engine
- No real funds at risk

**Implementation:**

```typescript
// use-trading.ts
const isDemoMode = storage.isDemoMode();
const keys = storage.getApiKeys();
const openRouterKey = keys?.openRouter || '';

if (isDemoMode && (!openRouterKey || openRouterKey === 'DEMO_MODE')) {
  toast.info('[DEMO] AI analysis skipped - No OpenRouter API key', {
    description: 'Add your OpenRouter key in Settings to enable AI analysis',
  });
  return null;
}

// Proceed with real AI analysis
const analysis = await pythonApi.analyzeMarket({
  apiKey: openRouterKey,
  isDemoMode: true,
  // ... other params
});
```

---

### Auto-Trading Integration

**60-Second Loop:**

```typescript
// use-trading.ts
useEffect(() => {
  if (!isAutoTrading) return;
  
  const runAutoTrading = async () => {
    // Fetch market data for allowed coins
    const chartData = await Promise.all(
      allowedCoins.map(symbol => pythonApi.fetchPrice(symbol))
    );
    
    // Run multi-chart AI analysis
    const analysis = await runMultiChartAIAnalysis(chartData);
    
    // Execute trade based on AI recommendation
    if (analysis.action === "open_long" || analysis.action === "open_short") {
      await executeTrade(
        analysis.recommendedSymbol,
        analysis.action,
        analysis.side,
        analysis.entryPrice,
        analysis.positionSize,
        analysis.stopLoss,
        analysis.takeProfit,
        analysis.reasoning,
        true // Skip confirmation
      );
    }
  };
  
  // Run immediately, then every 60 seconds
  runAutoTrading();
  const interval = setInterval(runAutoTrading, 60 * 1000);
  
  return () => clearInterval(interval);
}, [isAutoTrading, allowedCoins]);
```

---

## 11. Best Practices

### API Key Management

✅ **DO:**
- Store API keys in localStorage (frontend only)
- Validate key format before API calls
- Provide clear setup instructions
- Show cost warnings for paid models

❌ **DON'T:**
- Send API keys to backend (pass in request body)
- Hardcode API keys in code
- Share API keys publicly
- Use production keys in demo mode

---

### Prompt Engineering

✅ **DO:**
- Provide comprehensive market context
- Include perpetual futures-specific data
- Specify exact JSON output format
- Use clear, structured prompts
- Include risk management guidelines

❌ **DON'T:**
- Use vague or ambiguous language
- Omit critical trading parameters
- Allow free-form responses
- Skip validation requirements

---

### Model Selection

✅ **DO:**
- Use DeepSeek for frequent analysis (free)
- Use Qwen3 Max for critical live trades
- Warn users about costs
- Allow model switching
- Monitor token usage

❌ **DON'T:**
- Use paid models unnecessarily
- Ignore rate limits
- Skip cost warnings
- Force single model usage

---

### Error Handling

✅ **DO:**
- Validate all AI responses
- Log errors for debugging
- Provide user-friendly error messages
- Implement retry logic
- Pause auto-trading on repeated errors

❌ **DON'T:**
- Ignore malformed responses
- Continue trading on errors
- Show technical errors to users
- Skip error logging

---

### Performance Optimization

✅ **DO:**
- Cache market data (5 seconds)
- Debounce API calls
- Use multi-chart analysis for efficiency
- Limit max_tokens to 1500
- Monitor response times

❌ **DON'T:**
- Make redundant API calls
- Fetch data on every render
- Use excessive token limits
- Skip caching strategies

---

## Performance Metrics

### Response Times

- **DeepSeek V3.1:** 2-5 seconds
- **Qwen3 Max:** 3-7 seconds
- **Multi-Chart Analysis:** +1-2 seconds per additional chart

### Rate Limits

- **DeepSeek Free:** 10 requests/minute
- **Qwen3 Max:** 60 requests/minute (paid tier)
- **Auto-Trading:** 1 analysis per 60 seconds

### Token Usage

- **Single Chart:** ~800-1200 tokens
- **Multi-Chart (4 coins):** ~1500-2000 tokens
- **Average Cost (Qwen):** $0.02-0.05 per analysis

---

## Security Considerations

### API Key Security

1. **Client-Side Storage:**
   - API keys stored in localStorage
   - Never sent to backend in headers
   - Passed in request body only

2. **Validation:**
   - Format validation (`sk-or-v1-*`)
   - Length validation
   - Prefix validation

3. **Network Security:**
   - HTTPS only in production
   - CORS restrictions
   - No key logging

### Prompt Injection Protection

1. **Input Sanitization:**
   - Escape special characters
   - Remove code blocks
   - Limit prompt length

2. **Output Validation:**
   - JSON schema validation
   - Type checking
   - Range validation

---

## Troubleshooting

### AI Not Responding

**Symptoms:** No analysis returned, timeout errors

**Solutions:**
1. Check OpenRouter API key validity
2. Verify internet connection
3. Try switching models
4. Check OpenRouter status page
5. Review rate limits

---

### Invalid Recommendations

**Symptoms:** AI suggests unrealistic trades, extreme leverage

**Solutions:**
1. Review custom prompt template
2. Check market data accuracy
3. Validate risk settings
4. Switch to Qwen3 Max for better accuracy
5. Add more context to prompts

---

### High Costs

**Symptoms:** Unexpected OpenRouter charges

**Solutions:**
1. Switch to DeepSeek (free tier)
2. Reduce auto-trading frequency
3. Limit allowed coins
4. Monitor token usage
5. Set OpenRouter spending limits

---

## Resources

- **OpenRouter Dashboard:** https://openrouter.ai/dashboard
- **DeepSeek Documentation:** https://platform.deepseek.com/docs
- **Qwen3 Max Info:** https://openrouter.ai/models/qwen/qwen3-max
- **OpenAI SDK Docs:** https://github.com/openai/openai-node

---

**Last Updated:** November 15, 2025  
**Maintained By:** VenTheZone

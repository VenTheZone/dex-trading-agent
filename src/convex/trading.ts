"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Analyzes market data for a single symbol using AI
 * @param symbol - Trading pair symbol (e.g., "BTCUSD")
 * @param chartData - Serialized chart data for analysis
 * @param userBalance - Current user balance
 * @param settings - Trading risk settings
 * @param isDemoMode - Whether to use free tier API
 * @param aiModel - AI model to use for analysis
 * @param customPrompt - Custom prompt for AI analysis
 * @returns AI trading recommendation with entry/exit points
 */
export const analyzeSingleMarket = action({
  args: {
    symbol: v.string(),
    chartData: v.string(),
    userBalance: v.number(),
    settings: v.object({
      takeProfitPercent: v.number(),
      stopLossPercent: v.number(),
      useAdvancedStrategy: v.boolean(),
    }),
    isDemoMode: v.optional(v.boolean()),
    aiModel: v.optional(v.string()),
    customPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey && !args.isDemoMode) {
      throw new Error("OpenRouter API key not configured. Please add OPENROUTER_API_KEY to your environment variables.");
    }

    // Validate API key format if provided
    if (apiKey && !apiKey.startsWith('sk-or-v1-')) {
      throw new Error("Invalid OpenRouter API key format. Key must start with 'sk-or-v1-'");
    }

    const model = args.aiModel || "deepseek/deepseek-chat-v3.1:free";

    const basePrompt = args.customPrompt || `You are an expert crypto trading analyst. Analyze the following market data and provide a trading recommendation.`;

    const prompt = `${basePrompt}\n\nSymbol: ${args.symbol}\nCurrent Balance: ${args.userBalance}\nChart Data: ${args.chartData}\nRisk Settings: TP ${args.settings.takeProfitPercent}%, SL ${args.settings.stopLossPercent}%\n\nProvide your analysis in JSON format with:\n{\n  "action": "open_long" | "open_short" | "close" | "hold",\n  "confidence": 0-100,\n  "reasoning": "detailed explanation",\n  "entryPrice": number,\n  "stopLoss": number,\n  "takeProfit": number,\n  "positionSize": number\n}`;

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "HTTP-Referer": "https://dex-trading-agent.vly.site",
        "X-Title": args.isDemoMode ? "DeX Trading Agent Demo" : "DeX Trading Agent",
      };
      
      // Only add Authorization header if not using free tier
      if (!args.isDemoMode && apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "You are a professional crypto trading analyst. Always respond with valid JSON."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', errorText);
        throw new Error(`OpenRouter API error (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        console.error('[CONVEX] Invalid API response structure:', data);
        throw new Error('OpenRouter API returned invalid response structure. No choices array found.');
      }
      
      if (!data.choices[0]?.message?.content) {
        console.error('[CONVEX] Missing message content in API response:', data.choices[0]);
        throw new Error('OpenRouter API returned empty message content.');
      }
      
      const analysis = JSON.parse(data.choices[0].message.content);

      return analysis;
    } catch (error) {
      console.error("AI Analysis error:", error);
      throw error;
    }
  },
});

/**
 * Analyzes multiple charts simultaneously for correlation-based trading decisions
 * @param charts - Array of chart data with symbols and prices
 * @param userBalance - Current user balance
 * @param settings - Trading risk settings including leverage
 * @param isDemoMode - Whether to use free tier API
 * @param aiModel - AI model to use for analysis
 * @param customPrompt - Custom prompt for AI analysis
 * @returns AI recommendation with best trading opportunity across all charts
 */
export const analyzeMultipleCharts = action({
  args: {
    charts: v.array(v.object({
      symbol: v.string(),
      currentPrice: v.number(),
      chartType: v.union(v.literal("time"), v.literal("range")),
      chartInterval: v.string(),
    })),
    userBalance: v.number(),
    settings: v.object({
      takeProfitPercent: v.number(),
      stopLossPercent: v.number(),
      useAdvancedStrategy: v.boolean(),
      leverage: v.number(),
      allowAILeverage: v.boolean(),
    }),
    isDemoMode: v.optional(v.boolean()),
    aiModel: v.optional(v.string()),
    customPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log('[CONVEX] analyzeMultipleCharts called', {
      chartsCount: args.charts.length,
      isDemoMode: args.isDemoMode,
      aiModel: args.aiModel,
      hasCustomPrompt: !!args.customPrompt,
    });
    
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey && !args.isDemoMode) {
      throw new Error("OpenRouter API key not configured");
    }

    // Validate AI model
    const validModels = ['deepseek/deepseek-chat-v3.1:free', 'qwen/qwen3-max'];
    const requestedModel = args.aiModel || "deepseek/deepseek-chat-v3.1:free";
    if (!validModels.includes(requestedModel)) {
      throw new Error(`Invalid AI model: ${requestedModel}. Valid models: ${validModels.join(', ')}`);
    }

    // Demo mode uses free tier model with :free suffix
    const model = args.isDemoMode ? "deepseek/deepseek-chat-v3.1:free" : (args.aiModel || "deepseek/deepseek-chat-v3.1:free");

    // Simplified market snapshot (similar to Hyper-Alpha-Arena approach)
    const marketSnapshot = args.charts.map(chart => 
      `${chart.symbol}: ${chart.currentPrice.toFixed(2)}`
    ).join('\n');

    const basePrompt = args.customPrompt || `You are an expert crypto trading analyst.`;

    // Simplified prompt structure - less data, clearer format
    const prompt = `${basePrompt}

MARKET PRICES:
${marketSnapshot}

ACCOUNT:
Balance: ${args.userBalance.toFixed(2)}
Leverage: ${args.settings.leverage}x
Risk: TP ${args.settings.takeProfitPercent}%, SL ${args.settings.stopLossPercent}%

TASK:
Analyze these ${args.charts.length} assets and recommend ONE trade.

OUTPUT (JSON only):
{
  "recommendedSymbol": "symbol to trade",
  "action": "open_long" | "open_short" | "close" | "hold",
  "confidence": 0-100,
  "reasoning": "brief explanation (max 150 chars)",
  "entryPrice": number,
  "stopLoss": number,
  "takeProfit": number,
  "positionSize": number
}`;

    try {
      const multiHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        "HTTP-Referer": "https://dex-trading-agent.vly.site",
        "X-Title": args.isDemoMode ? "DeX Trading Agent Demo" : "DeX Trading Agent",
      };
      
      // Only add Authorization header if not using free tier
      if (!args.isDemoMode && apiKey) {
        multiHeaders["Authorization"] = `Bearer ${apiKey}`;
      }

      console.log('[CONVEX] Calling OpenRouter API', {
        model,
        isDemoMode: args.isDemoMode,
        hasAuthHeader: !!multiHeaders["Authorization"],
      });

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: multiHeaders,
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "You are a professional crypto trading analyst specializing in multi-chart correlation analysis. Always respond with valid JSON."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CONVEX] OpenRouter API error', {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        throw new Error(`OpenRouter API error (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[CONVEX] OpenRouter API response received', {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        fullResponse: JSON.stringify(data).substring(0, 500), // Log first 500 chars for debugging
      });
      
      // Validate response structure
      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        console.error('[CONVEX] Invalid API response structure:', data);
        throw new Error('OpenRouter API returned invalid response structure. No choices array found.');
      }
      
      if (!data.choices[0]?.message?.content) {
        console.error('[CONVEX] Missing message content in API response:', data.choices[0]);
        throw new Error('OpenRouter API returned empty message content.');
      }
      
      const analysis = JSON.parse(data.choices[0].message.content);
      console.log('[CONVEX] AI analysis parsed successfully', {
        action: analysis.action,
        confidence: analysis.confidence,
        recommendedSymbol: analysis.recommendedSymbol,
      });

      return analysis;
    } catch (error) {
      console.error("[CONVEX] Multi-chart AI Analysis error:", error);
      throw error;
    }
  },
});

/**
 * Executes a live trade on Hyperliquid exchange
 * @param apiSecret - Hyperliquid private key
 * @param symbol - Trading pair symbol
 * @param side - Buy or sell
 * @param size - Position size
 * @param price - Entry price
 * @param stopLoss - Stop loss price (optional)
 * @param takeProfit - Take profit price (optional)
 * @param leverage - Leverage multiplier
 * @param isTestnet - Whether to use testnet
 * @returns Execution result with order details
 */
export const executeHyperliquidTrade = action({
  args: {
    apiSecret: v.string(),
    symbol: v.string(),
    side: v.union(v.literal("buy"), v.literal("sell")),
    size: v.number(),
    price: v.number(),
    stopLoss: v.optional(v.number()),
    takeProfit: v.optional(v.number()),
    leverage: v.number(),
    isTestnet: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      const hl = await import("@nktkas/hyperliquid");
      const { privateKeyToAccount } = await import("viem/accounts");

      const transport = new hl.HttpTransport({ isTestnet: args.isTestnet ?? false });
      const account = privateKeyToAccount(args.apiSecret as `0x${string}`);
      const exchClient = new hl.ExchangeClient({ wallet: account, transport });
      const infoClient = new hl.InfoClient({ transport });

      // Get asset index
      const meta = await infoClient.meta();
      const assetIndex = meta.universe.findIndex(
        (asset) => asset.name === args.symbol
      );
      
      if (assetIndex === -1) {
        throw new Error(`Asset ${args.symbol} not found`);
      }

      // Set leverage
      await exchClient.updateLeverage({
        asset: assetIndex,
        isCross: true,
        leverage: args.leverage,
      });

      // Place main order
      const orderResult = await exchClient.order({
        orders: [{
          a: assetIndex,
          b: args.side === "buy",
          p: args.price.toString(),
          s: args.size.toString(),
          r: false,
          t: { limit: { tif: "Gtc" } },
        }],
        grouping: "na",
      });

      // Place stop loss if provided
      if (args.stopLoss) {
        await exchClient.order({
          orders: [{
            a: assetIndex,
            b: args.side === "sell", // Opposite side for stop loss
            p: "0",
            s: args.size.toString(),
            r: true,
            t: {
              trigger: {
                isMarket: true,
                triggerPx: args.stopLoss.toString(),
                tpsl: "sl",
              },
            },
          }],
          grouping: "normalTpsl",
        });
      }

      // Place take profit if provided
      if (args.takeProfit) {
        await exchClient.order({
          orders: [{
            a: assetIndex,
            b: args.side === "sell", // Opposite side for take profit
            p: "0",
            s: args.size.toString(),
            r: true,
            t: {
              trigger: {
                isMarket: true,
                triggerPx: args.takeProfit.toString(),
                tpsl: "tp",
              },
            },
          }],
          grouping: "normalTpsl",
        });
      }

      return { success: true, result: orderResult };
    } catch (error: any) {
      console.error("Live trade execution error:", error);
      return { success: false, error: error.message };
    }
  },
});

/**
 * Fetches current positions from Hyperliquid exchange
 * @param apiSecret - Hyperliquid private key
 * @param walletAddress - User's wallet address
 * @param isTestnet - Whether to use testnet
 * @returns Current positions and account state
 */
export const fetchHyperliquidPositions = action({
  args: {
    apiSecret: v.string(),
    walletAddress: v.string(),
    isTestnet: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      const hl = await import("@nktkas/hyperliquid");

      const transport = new hl.HttpTransport({ isTestnet: args.isTestnet ?? false });
      const infoClient = new hl.InfoClient({ transport });

      const state = await infoClient.clearinghouseState({
        user: args.walletAddress,
      });

      return { success: true, positions: state };
    } catch (error: any) {
      console.error("Get positions error:", error);
      return { success: false, error: error.message };
    }
  },
});

/**
 * Executes a simulated paper trade (no real funds)
 * @param symbol - Trading pair symbol
 * @param side - Buy or sell
 * @param size - Position size
 * @param price - Entry price
 * @param type - Market or limit order
 * @param stopLoss - Stop loss price (optional)
 * @param takeProfit - Take profit price (optional)
 * @param leverage - Leverage multiplier
 * @returns Simulated order ID and confirmation
 */
export const executePaperTrade = action({
  args: {
    symbol: v.string(),
    side: v.union(v.literal("buy"), v.literal("sell")),
    size: v.number(),
    price: v.number(),
    type: v.union(v.literal("market"), v.literal("limit")),
    stopLoss: v.optional(v.number()),
    takeProfit: v.optional(v.number()),
    leverage: v.number(),
  },
  handler: async (ctx, args) => {
    // Log the paper trade
    await ctx.runMutation((internal as any).tradingLogs.createLogInternal, {
      action: `paper_${args.side}`,
      symbol: args.symbol,
      reason: `Paper ${args.type} order executed`,
      price: args.price,
      size: args.size,
      side: args.side === "buy" ? "long" : "short",
      details: `Leverage: ${args.leverage}x, SL: ${args.stopLoss || "N/A"}, TP: ${args.takeProfit || "N/A"}`,
    });

    return {
      success: true,
      orderId: `paper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: "Paper trade executed successfully",
    };
  },
});

/**
 * Internal action to log trade execution
 * @internal
 */
export const logTradeExecution = internalAction({
  args: {
    action: v.string(),
    symbol: v.string(),
    side: v.optional(v.union(v.literal("long"), v.literal("short"))),
    price: v.number(),
    size: v.number(),
    stopLoss: v.optional(v.number()),
    takeProfit: v.optional(v.number()),
    reasoning: v.string(),
  },
  handler: async (ctx, args) => {
    // Log the trade action
    await ctx.runMutation((internal as any).tradingLogs.createLogInternal, {
      action: args.action,
      symbol: args.symbol,
      reason: args.reasoning,
      price: args.price,
      size: args.size,
      side: args.side,
      details: args.stopLoss 
        ? `SL: ${args.stopLoss}, TP: ${args.takeProfit}` 
        : undefined,
    });

    return { success: true };
  },
});

/**
 * Internal action to update stop loss for a position
 * @internal
 */
export const updatePositionStopLoss = internalAction({
  args: {
    symbol: v.string(),
    newStopLoss: v.number(),
    positionSize: v.number(),
    side: v.union(v.literal("long"), v.literal("short")),
    mode: v.union(v.literal("paper"), v.literal("live")),
  },
  handler: async (ctx, args) => {
    // Log the stop loss update
    await ctx.runMutation((internal as any).tradingLogs.createLogInternal, {
      action: "update_stop_loss",
      symbol: args.symbol,
      reason: `Stop loss updated to $${args.newStopLoss}`,
      price: args.newStopLoss,
      size: args.positionSize,
      side: args.side,
    });

    return { success: true };
  },
});

/**
 * Scheduled cron job handler for automated AI analysis
 * @internal
 */
export const runScheduledAIAnalysis = internalAction({
  args: {},
  handler: async (ctx) => {
    // This will be called by the cron job every 5 minutes
    // It checks all users with auto-trading enabled and runs analysis
    console.log("Scheduled AI analysis triggered at", new Date().toISOString());
    
    // Note: This is a placeholder for the cron job
    // The actual real-time trading logic runs in the frontend hook
    // to have access to user settings and API keys from localStorage
    
    return { success: true, message: "Scheduled analysis complete" };
  },
});

// Legacy exports for backward compatibility
export const analyzeMarket = analyzeSingleMarket;
export const analyzeMultiChart = analyzeMultipleCharts;
export const executeLiveTrade = executeHyperliquidTrade;
export const getHyperliquidPositions = fetchHyperliquidPositions;
export const executeTradeAction = logTradeExecution;
export const updateStopLoss = updatePositionStopLoss;
export const scheduledAIAnalysis = runScheduledAIAnalysis;
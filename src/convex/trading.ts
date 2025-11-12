"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const analyzeMarket = action({
  args: {
    symbol: v.string(),
    chartData: v.string(),
    userBalance: v.number(),
    settings: v.object({
      takeProfitPercent: v.number(),
      stopLossPercent: v.number(),
      useAdvancedStrategy: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      throw new Error("OpenRouter API key not configured");
    }

    const prompt = `You are an expert crypto trading analyst. Analyze the following market data and provide a trading recommendation.

Symbol: ${args.symbol}
Current Balance: $${args.userBalance}
Chart Data: ${args.chartData}
Risk Settings: TP ${args.settings.takeProfitPercent}%, SL ${args.settings.stopLossPercent}%

Provide your analysis in JSON format with:
{
  "action": "open_long" | "open_short" | "close" | "hold",
  "confidence": 0-100,
  "reasoning": "detailed explanation",
  "entryPrice": number,
  "stopLoss": number,
  "takeProfit": number,
  "positionSize": number
}`;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
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
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const data = await response.json();
      const analysis = JSON.parse(data.choices[0].message.content);

      return analysis;
    } catch (error) {
      console.error("AI Analysis error:", error);
      throw error;
    }
  },
});

export const analyzeMultiChart = action({
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
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      throw new Error("OpenRouter API key not configured");
    }

    const chartsDescription = args.charts.map(chart => 
      `${chart.symbol}: $${chart.currentPrice} (${chart.chartType} chart, ${chart.chartInterval})`
    ).join('\n');

    const prompt = `You are an expert crypto trading analyst with multi-chart analysis capabilities. Analyze the following market data across multiple assets and provide a trading recommendation.

MULTI-CHART ANALYSIS:
${chartsDescription}

Current Balance: $${args.userBalance}
Leverage: ${args.settings.leverage}x ${args.settings.allowAILeverage ? '(AI can adjust)' : '(fixed)'}
Risk Settings: TP ${args.settings.takeProfitPercent}%, SL ${args.settings.stopLossPercent}%

Consider:
1. Correlation between assets (BTC dominance, altcoin movements)
2. Market-wide trends and sentiment
3. Relative strength across different assets
4. Risk diversification opportunities
5. Best risk/reward setup among all charts

Provide your analysis in JSON format with:
{
  "recommendedSymbol": "symbol to trade",
  "action": "open_long" | "open_short" | "close" | "hold",
  "confidence": 0-100,
  "reasoning": "detailed multi-chart analysis explanation",
  "entryPrice": number,
  "stopLoss": number,
  "takeProfit": number,
  "positionSize": number,
  "marketContext": "overall market analysis across all charts"
}`;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
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
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const data = await response.json();
      const analysis = JSON.parse(data.choices[0].message.content);

      return analysis;
    } catch (error) {
      console.error("Multi-chart AI Analysis error:", error);
      throw error;
    }
  },
});

export const executeLiveTrade = action({
  args: {
    apiSecret: v.string(),
    symbol: v.string(),
    side: v.union(v.literal("buy"), v.literal("sell")),
    size: v.number(),
    price: v.number(),
    stopLoss: v.optional(v.number()),
    takeProfit: v.optional(v.number()),
    leverage: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      const hl = await import("@nktkas/hyperliquid");
      const { privateKeyToAccount } = await import("viem/accounts");

      const transport = new hl.HttpTransport({ isTestnet: false });
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

export const getHyperliquidPositions = action({
  args: {
    apiSecret: v.string(),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const hl = await import("@nktkas/hyperliquid");

      const transport = new hl.HttpTransport({ isTestnet: false });
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
    await ctx.runMutation(internal.tradingLogs.createLogInternal, {
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

export const executeTradeAction = internalAction({
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
    await ctx.runMutation(internal.tradingLogs.createLogInternal, {
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

export const updateStopLoss = internalAction({
  args: {
    symbol: v.string(),
    newStopLoss: v.number(),
    positionSize: v.number(),
    side: v.union(v.literal("long"), v.literal("short")),
    mode: v.union(v.literal("paper"), v.literal("live")),
  },
  handler: async (ctx, args) => {
    // Log the stop loss update
    await ctx.runMutation(internal.tradingLogs.createLogInternal, {
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
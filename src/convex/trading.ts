"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const analyzeMarket = internalAction({
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
    // This will call OpenRouter API with DeepSeek
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
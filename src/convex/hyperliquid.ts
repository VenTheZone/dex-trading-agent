"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";

export const placeOrder = internalAction({
  args: {
    apiKey: v.string(),
    apiSecret: v.string(),
    symbol: v.string(),
    side: v.union(v.literal("buy"), v.literal("sell")),
    price: v.string(),
    size: v.string(),
    reduceOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Import Hyperliquid SDK dynamically
    const hl = await import("@nktkas/hyperliquid");
    const { privateKeyToAccount } = await import("viem/accounts");

    try {
      const transport = new hl.HttpTransport({ isTestnet: false });
      const account = privateKeyToAccount(args.apiSecret as `0x${string}`);
      const exchClient = new hl.ExchangeClient({ wallet: account, transport });

      const result = await exchClient.order({
        orders: [{
          a: 0, // Asset index (BTC)
          b: args.side === "buy",
          p: args.price,
          s: args.size,
          r: args.reduceOnly || false,
          t: { limit: { tif: "Gtc" } },
        }],
        grouping: "na",
      });

      return { success: true, result };
    } catch (error: any) {
      console.error("Hyperliquid order error:", error);
      return { success: false, error: error.message };
    }
  },
});

export const setStopLoss = internalAction({
  args: {
    apiKey: v.string(),
    apiSecret: v.string(),
    symbol: v.string(),
    side: v.union(v.literal("buy"), v.literal("sell")),
    triggerPrice: v.string(),
    size: v.string(),
  },
  handler: async (ctx, args) => {
    const hl = await import("@nktkas/hyperliquid");
    const { privateKeyToAccount } = await import("viem/accounts");

    try {
      const transport = new hl.HttpTransport({ isTestnet: false });
      const account = privateKeyToAccount(args.apiSecret as `0x${string}`);
      const exchClient = new hl.ExchangeClient({ wallet: account, transport });

      const result = await exchClient.order({
        orders: [{
          a: 0,
          b: args.side === "buy",
          p: args.triggerPrice,
          s: args.size,
          r: true, // Reduce-only
          t: {
            trigger: {
              isMarket: true,
              triggerPx: args.triggerPrice,
              tpsl: "sl",
            },
          },
        }],
        grouping: "positionTpsl",
      });

      return { success: true, result };
    } catch (error: any) {
      console.error("Stop loss error:", error);
      return { success: false, error: error.message };
    }
  },
});

export const getUserPositions = internalAction({
  args: {
    apiKey: v.string(),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const hl = await import("@nktkas/hyperliquid");

    try {
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

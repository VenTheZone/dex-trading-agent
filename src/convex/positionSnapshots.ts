import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const recordSnapshot = mutation({
  args: {
    symbol: v.string(),
    side: v.union(v.literal("long"), v.literal("short")),
    size: v.number(),
    entryPrice: v.number(),
    currentPrice: v.number(),
    unrealizedPnl: v.number(),
    leverage: v.number(),
    mode: v.union(v.literal("paper"), v.literal("live")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("positionSnapshots", {
      userId,
      symbol: args.symbol,
      side: args.side,
      size: args.size,
      entryPrice: args.entryPrice,
      currentPrice: args.currentPrice,
      unrealizedPnl: args.unrealizedPnl,
      leverage: args.leverage,
      mode: args.mode,
    });
  },
});

export const getPositionHistory = query({
  args: {
    symbol: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    let query = ctx.db
      .query("positionSnapshots")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    if (args.symbol) {
      const symbol = args.symbol;
      const snapshots = await ctx.db
        .query("positionSnapshots")
        .withIndex("by_user_and_symbol", (q) => 
          q.eq("userId", userId).eq("symbol", symbol)
        )
        .order("desc")
        .take(args.limit ?? 100);

      return snapshots.reverse();
    }

    const snapshots = await query
      .order("desc")
      .take(args.limit ?? 100);

    return snapshots.reverse();
  },
});

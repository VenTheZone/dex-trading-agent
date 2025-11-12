import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createLog = mutation({
  args: {
    action: v.string(),
    symbol: v.string(),
    reason: v.string(),
    details: v.optional(v.string()),
    price: v.optional(v.number()),
    size: v.optional(v.number()),
    side: v.optional(v.union(v.literal("long"), v.literal("short"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("tradingLogs", {
      userId,
      action: args.action,
      symbol: args.symbol,
      reason: args.reason,
      details: args.details,
      price: args.price,
      size: args.size,
      side: args.side,
    });
  },
});

export const createLogInternal = internalMutation({
  args: {
    action: v.string(),
    symbol: v.string(),
    reason: v.string(),
    details: v.optional(v.string()),
    price: v.optional(v.number()),
    size: v.optional(v.number()),
    side: v.optional(v.union(v.literal("long"), v.literal("short"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("tradingLogs", {
      userId,
      action: args.action,
      symbol: args.symbol,
      reason: args.reason,
      details: args.details,
      price: args.price,
      size: args.size,
      side: args.side,
    });
  },
});

export const getUserLogs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const logs = await ctx.db
      .query("tradingLogs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit ?? 50);

    return logs;
  },
});

export const clearUserLogs = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const logs = await ctx.db
      .query("tradingLogs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const log of logs) {
      await ctx.db.delete(log._id);
    }
  },
});
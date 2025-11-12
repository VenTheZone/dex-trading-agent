import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Creates a new trading log entry for the current user
 * @param action - Action type (e.g., "open_long", "close_position")
 * @param symbol - Trading pair symbol
 * @param reason - Reason for the action
 * @param details - Additional details (optional)
 * @param price - Execution price (optional)
 * @param size - Position size (optional)
 * @param side - Position side (optional)
 * @returns Log entry ID
 */
export const createTradingLog = mutation({
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

/**
 * Internal mutation to create trading log (for server-side use)
 * @internal
 */
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

/**
 * Fetches trading logs for the current user
 * @param limit - Maximum number of logs to return (default: 50)
 * @returns Array of trading log entries, most recent first
 */
export const fetchUserTradingLogs = query({
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

/**
 * Clears all trading logs for the current user
 * @returns void
 */
export const clearAllUserLogs = mutation({
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

// Legacy exports for backward compatibility
export const createLog = createTradingLog;
export const getUserLogs = fetchUserTradingLogs;
export const clearUserLogs = clearAllUserLogs;
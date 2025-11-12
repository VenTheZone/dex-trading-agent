import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const recordBalance = mutation({
  args: {
    balance: v.number(),
    mode: v.union(v.literal("paper"), v.literal("live")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("balanceHistory", {
      userId,
      balance: args.balance,
      mode: args.mode,
    });
  },
});

export const getBalanceHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const history = await ctx.db
      .query("balanceHistory")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit ?? 100);

    return history.reverse();
  },
});

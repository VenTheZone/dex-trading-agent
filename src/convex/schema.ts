import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // Trading logs table
    tradingLogs: defineTable({
      userId: v.id("users"),
      action: v.string(),
      symbol: v.string(),
      reason: v.string(),
      details: v.optional(v.string()),
      price: v.optional(v.number()),
      size: v.optional(v.number()),
      side: v.optional(v.union(v.literal("long"), v.literal("short"))),
    }).index("by_user", ["userId"]),

    // Balance history table
    balanceHistory: defineTable({
      userId: v.id("users"),
      balance: v.number(),
      mode: v.union(v.literal("paper"), v.literal("live")),
    }).index("by_user", ["userId"]),

    // Paper trading positions table
    paperPositions: defineTable({
      userId: v.id("users"),
      symbol: v.string(),
      side: v.union(v.literal("long"), v.literal("short")),
      size: v.number(),
      entryPrice: v.number(),
      currentPrice: v.number(),
      unrealizedPnl: v.number(),
      realizedPnl: v.number(),
      stopLoss: v.optional(v.number()),
      takeProfit: v.optional(v.number()),
      leverage: v.number(),
    }).index("by_user", ["userId"])
      .index("by_user_and_symbol", ["userId", "symbol"]),

    // Paper trading orders table
    paperOrders: defineTable({
      userId: v.id("users"),
      symbol: v.string(),
      side: v.union(v.literal("buy"), v.literal("sell")),
      type: v.union(v.literal("market"), v.literal("limit")),
      price: v.number(),
      size: v.number(),
      filled: v.number(),
      status: v.union(
        v.literal("open"),
        v.literal("filled"),
        v.literal("cancelled"),
        v.literal("partial")
      ),
    }).index("by_user", ["userId"])
      .index("by_user_and_status", ["userId", "status"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
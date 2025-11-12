/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as balanceHistory from "../balanceHistory.js";
import type * as crons from "../crons.js";
import type * as cryptoPanic from "../cryptoPanic.js";
import type * as http from "../http.js";
import type * as hyperliquid from "../hyperliquid.js";
import type * as marketData from "../marketData.js";
import type * as positionSnapshots from "../positionSnapshots.js";
import type * as trading from "../trading.js";
import type * as tradingLogs from "../tradingLogs.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "auth/emailOtp": typeof auth_emailOtp;
  balanceHistory: typeof balanceHistory;
  crons: typeof crons;
  cryptoPanic: typeof cryptoPanic;
  http: typeof http;
  hyperliquid: typeof hyperliquid;
  marketData: typeof marketData;
  positionSnapshots: typeof positionSnapshots;
  trading: typeof trading;
  tradingLogs: typeof tradingLogs;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Test connection to Hyperliquid (mainnet or testnet)
 * @param isTestnet - Whether to test testnet connection
 * @returns Connection status and network info
 */
export const testConnection = action({
  args: {
    isTestnet: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      const hl = await import("@nktkas/hyperliquid");
      
      const transport = new hl.HttpTransport({ 
        isTestnet: args.isTestnet ?? false 
      });
      
      const infoClient = new hl.InfoClient({ transport });
      
      // Fetch meta to verify connection
      const meta = await infoClient.meta();
      
      return {
        success: true,
        network: args.isTestnet ? "testnet" : "mainnet",
        apiEndpoint: args.isTestnet 
          ? "https://api.hyperliquid-testnet.xyz" 
          : "https://api.hyperliquid.xyz",
        appUrl: args.isTestnet
          ? "https://app.hyperliquid-testnet.xyz"
          : "https://app.hyperliquid.xyz",
        assetsCount: meta.universe.length,
        availableAssets: meta.universe.slice(0, 10).map((a: any) => a.name).join(', '),
        message: `Successfully connected to Hyperliquid ${args.isTestnet ? 'Testnet' : 'Mainnet'}`,
      };
    } catch (error: any) {
      console.error("Hyperliquid connection test failed:", error);
      return {
        success: false,
        network: args.isTestnet ? "testnet" : "mainnet",
        error: error.message,
        message: `Failed to connect to Hyperliquid ${args.isTestnet ? 'Testnet' : 'Mainnet'}`,
      };
    }
  },
});

/**
 * Get account info from Hyperliquid (Perpetual Wallet Balance)
 * @param walletAddress - User's master wallet address (NOT agent wallet)
 * @param isTestnet - Whether to use testnet
 * @returns Perpetual account balance and margin info
 */
export const getAccountInfo = action({
  args: {
    walletAddress: v.string(),
    isTestnet: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      const hl = await import("@nktkas/hyperliquid");
      
      const transport = new hl.HttpTransport({ 
        isTestnet: args.isTestnet ?? false 
      });
      
      const infoClient = new hl.InfoClient({ transport });
      
      // Fetch clearinghouse state for perpetual wallet balance
      const state = await infoClient.clearinghouseState({
        user: args.walletAddress,
      });
      
      return {
        success: true,
        perpetualBalance: parseFloat(state.marginSummary.accountValue),
        withdrawable: parseFloat(state.withdrawable),
        totalMarginUsed: parseFloat(state.marginSummary.totalMarginUsed || "0"),
        positions: state.assetPositions.length,
        network: args.isTestnet ? "testnet" : "mainnet",
        spotBalances: [],
      };
    } catch (error: any) {
      console.error("Failed to get account info:", error);
      return {
        success: false,
        error: error.message,
        network: args.isTestnet ? "testnet" : "mainnet",
      };
    }
  },
});

/**
 * Fetch L2 orderbook data from Hyperliquid for a specific coin
 * @param coin - Coin symbol (e.g., "BTC", "ETH", "SOL")
 * @param isTestnet - Whether to use testnet
 * @returns Orderbook with bids and asks
 */
export const getOrderBook = action({
  args: {
    coin: v.string(),
    isTestnet: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      if (!args.coin || typeof args.coin !== 'string' || args.coin.trim() === '') {
        throw new Error('Invalid coin symbol provided');
      }

      const hl = await import("@nktkas/hyperliquid");
      
      const transport = new hl.HttpTransport({ 
        isTestnet: args.isTestnet ?? false 
      });
      
      const infoClient = new hl.InfoClient({ transport });
      
      // Fetch L2 orderbook with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const orderbook = await new Promise<any>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`Hyperliquid API timeout for ${args.coin}`));
        }, 10000);

        infoClient.l2Book({ coin: args.coin.trim() })
          .then((result) => {
            clearTimeout(timeoutId);
            resolve(result);
          })
          .catch((error) => {
            clearTimeout(timeoutId);
            reject(error);
          });
      });
      
      // Validate orderbook response
      if (!orderbook || !orderbook.levels || !Array.isArray(orderbook.levels)) {
        throw new Error(`Invalid orderbook data received for ${args.coin}`);
      }
      
      // Format the response
      const bids = orderbook.levels[0].map((level: any) => ({
        price: parseFloat(level.px),
        size: parseFloat(level.sz),
        orders: level.n,
      }));
      
      const asks = orderbook.levels[1].map((level: any) => ({
        price: parseFloat(level.px),
        size: parseFloat(level.sz),
        orders: level.n,
      }));
      
      return {
        success: true,
        coin: orderbook.coin,
        timestamp: orderbook.time,
        bids,
        asks,
        spread: asks.length > 0 && bids.length > 0 
          ? asks[0].price - bids[0].price 
          : 0,
        midPrice: asks.length > 0 && bids.length > 0 
          ? (asks[0].price + bids[0].price) / 2 
          : 0,
      };
    } catch (error: any) {
      console.error(`Failed to get orderbook for ${args.coin}:`, {
        message: error.message,
        stack: error.stack,
        isTestnet: args.isTestnet,
      });
      return {
        success: false,
        error: error.message || 'Unknown error fetching orderbook',
        coin: args.coin,
      };
    }
  },
});

/**
 * Fetch orderbook data for multiple coins in parallel
 * @param coins - Array of coin symbols
 * @param isTestnet - Whether to use testnet
 * @returns Object mapping coins to their orderbook data
 */
export const getBulkOrderBooks = action({
  args: {
    coins: v.array(v.string()),
    isTestnet: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      const hl = await import("@nktkas/hyperliquid");
      
      const transport = new hl.HttpTransport({ 
        isTestnet: args.isTestnet ?? false 
      });
      
      const infoClient = new hl.InfoClient({ transport });
      
      // Fetch all orderbooks in parallel
      const orderbookPromises = args.coins.map(async (coin) => {
        try {
          const orderbook = await infoClient.l2Book({ coin });
          
          if (!orderbook || !orderbook.levels || !Array.isArray(orderbook.levels)) {
            console.error(`Invalid orderbook data for ${coin}`);
            return null;
          }
          
          const bids = orderbook.levels[0].map((level: any) => ({
            price: parseFloat(level.px),
            size: parseFloat(level.sz),
            orders: level.n,
          }));
          
          const asks = orderbook.levels[1].map((level: any) => ({
            price: parseFloat(level.px),
            size: parseFloat(level.sz),
            orders: level.n,
          }));
          
          return {
            coin: orderbook.coin,
            timestamp: orderbook.time,
            bids,
            asks,
            spread: asks.length > 0 && bids.length > 0 
              ? asks[0].price - bids[0].price 
              : 0,
            midPrice: asks.length > 0 && bids.length > 0 
              ? (asks[0].price + bids[0].price) / 2 
              : 0,
          };
        } catch (error) {
          console.error(`Failed to fetch orderbook for ${coin}:`, error);
          return null;
        }
      });
      
      const orderbooks = await Promise.all(orderbookPromises);
      
      // Build results object
      const results: Record<string, any> = {};
      orderbooks.forEach((orderbook) => {
        if (orderbook) {
          results[orderbook.coin] = orderbook;
        }
      });
      
      return {
        success: true,
        orderbooks: results,
        count: Object.keys(results).length,
      };
    } catch (error: any) {
      console.error("Failed to fetch bulk orderbooks:", error);
      return {
        success: false,
        error: error.message,
        orderbooks: {},
        count: 0,
      };
    }
  },
});
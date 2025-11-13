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
        endpoint: args.isTestnet 
          ? "https://api.hyperliquid-testnet.xyz" 
          : "https://api.hyperliquid.xyz",
        assetsCount: meta.universe.length,
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
 * Get account info from Hyperliquid
 * @param walletAddress - User's wallet address
 * @param isTestnet - Whether to use testnet
 * @returns Account balance and margin info
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
      
      const state = await infoClient.clearinghouseState({
        user: args.walletAddress,
      });
      
      return {
        success: true,
        balance: state.marginSummary.accountValue,
        positions: state.assetPositions.length,
        network: args.isTestnet ? "testnet" : "mainnet",
      };
    } catch (error: any) {
      console.error("Failed to get account info:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
});
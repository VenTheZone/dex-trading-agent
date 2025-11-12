"use node";

import * as hl from "@nktkas/hyperliquid";

export interface HyperliquidConfig {
  privateKey: string;
  isTestnet?: boolean;
}

export interface OrderParams {
  symbol: string;
  side: "buy" | "sell";
  size: string;
  price?: string;
  orderType: "market" | "limit";
  reduceOnly?: boolean;
}

export interface StopLossParams {
  symbol: string;
  side: "buy" | "sell";
  size: string;
  triggerPrice: string;
  isMarket?: boolean;
}

export class HyperliquidService {
  private exchangeClient: hl.ExchangeClient;
  private infoClient: hl.InfoClient;
  private walletAddress: string;

  constructor(config: HyperliquidConfig) {
    const transport = new hl.HttpTransport({
      isTestnet: config.isTestnet ?? false,
    });

    this.exchangeClient = new hl.ExchangeClient({
      wallet: config.privateKey,
      transport,
    });

    this.infoClient = new hl.InfoClient({ transport });
    
    // Derive wallet address from private key
    this.walletAddress = config.privateKey.startsWith("0x") 
      ? config.privateKey.slice(0, 42) 
      : `0x${config.privateKey.slice(0, 40)}`;
  }

  async getAssetIndex(symbol: string): Promise<number> {
    const meta = await this.infoClient.meta();
    const assetIndex = meta.universe.findIndex(
      (asset) => asset.name === symbol
    );
    if (assetIndex === -1) {
      throw new Error(`Asset ${symbol} not found`);
    }
    return assetIndex;
  }

  async placeOrder(params: OrderParams) {
    const assetIndex = await this.getAssetIndex(params.symbol);
    
    const order: any = {
      a: assetIndex,
      b: params.side === "buy",
      p: params.price || "0",
      s: params.size,
      r: params.reduceOnly ?? false,
      t: params.orderType === "market" 
        ? { market: {} }
        : { limit: { tif: "Gtc" } }
    };

    const result = await this.exchangeClient.order({
      orders: [order],
      grouping: "na",
    });

    return result;
  }

  async placeStopLoss(params: StopLossParams) {
    const assetIndex = await this.getAssetIndex(params.symbol);
    
    const order: any = {
      a: assetIndex,
      b: params.side === "buy",
      p: "0",
      s: params.size,
      r: false,
      t: {
        trigger: {
          isMarket: params.isMarket ?? true,
          tpsl: "sl",
          triggerPx: params.triggerPrice,
        }
      }
    };

    const result = await this.exchangeClient.order({
      orders: [order],
      grouping: "normalTpsl",
    });

    return result;
  }

  async placeTakeProfit(params: StopLossParams) {
    const assetIndex = await this.getAssetIndex(params.symbol);
    
    const order: any = {
      a: assetIndex,
      b: params.side === "buy",
      p: "0",
      s: params.size,
      r: false,
      t: {
        trigger: {
          isMarket: params.isMarket ?? true,
          tpsl: "tp",
          triggerPx: params.triggerPrice,
        }
      }
    };

    const result = await this.exchangeClient.order({
      orders: [order],
      grouping: "normalTpsl",
    });

    return result;
  }

  async getPositions() {
    const state = await this.infoClient.clearinghouseState({
      user: this.walletAddress,
    });
    return state.assetPositions;
  }

  async getBalance() {
    const state = await this.infoClient.clearinghouseState({
      user: this.walletAddress,
    });
    return {
      marginSummary: state.marginSummary,
      crossMarginSummary: state.crossMarginSummary,
    };
  }

  async getOpenOrders() {
    const orders = await this.infoClient.openOrders({
      user: this.walletAddress,
    });
    return orders;
  }

  async cancelOrder(symbol: string, orderId: number) {
    const assetIndex = await this.getAssetIndex(symbol);
    
    const result = await this.exchangeClient.cancel({
      cancels: [{ a: assetIndex, o: orderId }],
    });

    return result;
  }

  async cancelAllOrders(symbol?: string) {
    if (symbol) {
      const assetIndex = await this.getAssetIndex(symbol);
      const result = await this.exchangeClient.cancel({
        cancels: [{ a: assetIndex, o: 0 }],
      });
      return result;
    }
    
    // Cancel all orders across all assets
    const openOrders = await this.getOpenOrders();
    const cancels = openOrders.map((order: any) => ({
      a: order.coin,
      o: order.oid,
    }));

    if (cancels.length === 0) return { status: "ok", response: { type: "cancel", data: { statuses: [] } } };

    const result = await this.exchangeClient.cancel({ cancels });
    return result;
  }
}
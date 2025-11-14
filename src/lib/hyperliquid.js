"use node";
import * as hl from "@nktkas/hyperliquid";
import { privateKeyToAccount } from "viem/accounts";
export class HyperliquidService {
    exchangeClient;
    infoClient;
    walletAddress;
    constructor(config) {
        const transport = new hl.HttpTransport({
            isTestnet: config.isTestnet ?? false,
        });
        // Properly derive wallet address from private key
        const account = privateKeyToAccount(config.privateKey);
        this.walletAddress = account.address;
        this.exchangeClient = new hl.ExchangeClient({
            wallet: account,
            transport,
        });
        this.infoClient = new hl.InfoClient({ transport });
    }
    async getAssetIndex(symbol) {
        const meta = await this.infoClient.meta();
        const assetIndex = meta.universe.findIndex((asset) => asset.name === symbol);
        if (assetIndex === -1) {
            throw new Error(`Asset ${symbol} not found`);
        }
        return assetIndex;
    }
    async placeOrder(params) {
        const assetIndex = await this.getAssetIndex(params.symbol);
        const order = {
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
    async placeStopLoss(params) {
        const assetIndex = await this.getAssetIndex(params.symbol);
        const order = {
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
    async placeTakeProfit(params) {
        const assetIndex = await this.getAssetIndex(params.symbol);
        const order = {
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
    async cancelOrder(symbol, orderId) {
        const assetIndex = await this.getAssetIndex(symbol);
        const result = await this.exchangeClient.cancel({
            cancels: [{ a: assetIndex, o: orderId }],
        });
        return result;
    }
    async cancelAllOrders(symbol) {
        if (symbol) {
            const assetIndex = await this.getAssetIndex(symbol);
            const result = await this.exchangeClient.cancel({
                cancels: [{ a: assetIndex, o: 0 }],
            });
            return result;
        }
        // Cancel all orders across all assets
        const openOrders = await this.getOpenOrders();
        const cancels = openOrders.map((order) => ({
            a: order.coin,
            o: order.oid,
        }));
        if (cancels.length === 0)
            return { status: "ok", response: { type: "cancel", data: { statuses: [] } } };
        const result = await this.exchangeClient.cancel({ cancels });
        return result;
    }
}

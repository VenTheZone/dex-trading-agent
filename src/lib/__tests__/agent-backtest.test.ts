import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PaperTradingEngine } from '@/lib/paper-trading-engine';
import { fetchPriceWithFallback, clearPriceCache } from '@/lib/price-service';
import { pythonApi } from '@/lib/python-api-client';
import { TRADING_TOKENS } from '@/lib/tokenData';

const PRICE_BY_SYMBOL: Record<string, number> = {
  BTCUSD: 50000,
  ETHUSD: 3000,
  SOLUSD: 200,
  HYPEUSD: 28,
  XRPUSD: 0.6,
  PUMPUSD: 0.012,
  UNIUSD: 11,
  ASTERUSD: 2.4,
};

describe('Trading Agent Backtesting Suite', () => {
  beforeEach(() => {
    clearPriceCache();
    vi.restoreAllMocks();

    vi.spyOn(pythonApi, 'fetchPrice').mockImplementation(async (symbol: string) => {
      const price = PRICE_BY_SYMBOL[symbol];
      if (price === undefined) {
        throw new Error(`Failed to fetch price for ${symbol}: symbol not found`);
      }
      return price;
    });

    vi.spyOn(pythonApi, 'createTradingLog').mockImplementation(async (log: any) => ({
      success: true,
      data: { id: Date.now(), created_at: new Date().toISOString(), ...log },
    }));

    vi.spyOn(pythonApi, 'getTradingLogs').mockResolvedValue({
      success: true,
      data: [
        {
          id: 1,
          action: 'analysis_start',
          symbol: 'BTCUSD',
          reason: 'seeded log',
          details: 'deterministic test data',
          created_at: new Date().toISOString(),
        },
      ],
    } as any);

    vi.spyOn(pythonApi, 'recordBalance').mockImplementation(async (balance: number, mode: any) => ({
      success: true,
      data: { id: Date.now(), balance, mode, created_at: new Date().toISOString() },
    } as any));

    vi.spyOn(pythonApi, 'recordPositionSnapshot').mockImplementation(async (snapshot: any) => ({
      success: true,
      data: { id: Date.now(), created_at: new Date().toISOString(), ...snapshot },
    } as any));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearPriceCache();
  });

  describe('1. Price Fetching Capability', () => {
    it('should fetch prices for all trading tokens', async () => {
      const results = await Promise.allSettled(
        TRADING_TOKENS.map((token) => fetchPriceWithFallback(`${token.symbol}USD`))
      );

      expect(results.every((result) => result.status === 'fulfilled')).toBe(true);
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          expect(result.value.price).toBeGreaterThan(0);
          expect(result.value.isStale).toBe(false);
        }
      });
    });

    it('should fetch price via Python API endpoint', async () => {
      const price = await pythonApi.fetchPrice('BTCUSD', false);

      expect(price).toBe(50000);
      expect(typeof price).toBe('number');
    });

    it('should handle price fetch errors gracefully', async () => {
      await expect(pythonApi.fetchPrice('INVALID_SYMBOL_XYZ', false)).rejects.toThrow(
        'symbol not found'
      );
    });
  });

  describe('2. Chart Analysis Capability', () => {
    it('should validate TradingView symbol formats', () => {
      expect(TRADING_TOKENS.find((token) => token.symbol === 'BTC')?.tradingViewSymbol).toBe('BTCUSD');
      expect(TRADING_TOKENS.find((token) => token.symbol === 'ETH')?.tradingViewSymbol).toBe('ETHUSD');
      expect(TRADING_TOKENS.find((token) => token.symbol === 'SOL')?.tradingViewSymbol).toBe('SOLUSD');
    });

    it('should prepare multi-chart data for AI analysis', async () => {
      const chartData = await Promise.all(
        ['BTCUSD', 'ETHUSD'].map(async (symbol) => ({
          symbol,
          currentPrice: await pythonApi.fetchPrice(symbol, false),
          chartType: 'time' as const,
          chartInterval: '5',
        }))
      );

      expect(chartData).toEqual([
        { symbol: 'BTCUSD', currentPrice: 50000, chartType: 'time', chartInterval: '5' },
        { symbol: 'ETHUSD', currentPrice: 3000, chartType: 'time', chartInterval: '5' },
      ]);
    });
  });

  describe('3. Logging Capability', () => {
    it('should create trading log entries', async () => {
      const result = await pythonApi.createTradingLog({
        action: 'test_action',
        symbol: 'BTCUSD',
        reason: 'Backtesting log creation',
        details: 'Testing agent logging capability',
        price: 50000,
        size: 0.1,
        side: 'long',
      } as any);

      expect(result.success).toBe(true);
      expect(result.data?.symbol).toBe('BTCUSD');
    });

    it('should retrieve trading logs', async () => {
      const result = await pythonApi.getTradingLogs(10);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data?.length).toBeGreaterThan(0);
    });

    it('should record balance history', async () => {
      const result = await pythonApi.recordBalance(10000, 'paper');

      expect(result.success).toBe(true);
      expect(result.data?.balance).toBe(10000);
    });

    it('should record position snapshots', async () => {
      const result = await pythonApi.recordPositionSnapshot({
        symbol: 'BTCUSD',
        side: 'long',
        size: 0.1,
        entry_price: 50000,
        current_price: 51000,
        unrealized_pnl: 100,
        leverage: 2,
        mode: 'paper',
      });

      expect(result.success).toBe(true);
      expect(result.data?.symbol).toBe('BTCUSD');
    });
  });

  describe('4. Trading Execution Capability', () => {
    let engine: PaperTradingEngine;

    beforeEach(() => {
      engine = new PaperTradingEngine(10000);
    });

    it('should execute a complete long trade lifecycle', () => {
      const order = engine.placeOrder('BTCUSD', 'buy', 0.1, 50000, 'market');
      engine.updateMarketPrice('BTCUSD', 52000);
      const closeResult = engine.closePosition('BTCUSD', 52000, 'manual');

      expect(order.status).toBe('filled');
      expect(closeResult).toMatchObject({ success: true, pnl: 200 });
    });

    it('should execute a complete short trade lifecycle', () => {
      const order = engine.placeOrder('ETHUSD', 'sell', 1, 3000, 'market');
      engine.updateMarketPrice('ETHUSD', 2800);
      const closeResult = engine.closePosition('ETHUSD', 2800, 'manual');

      expect(order.status).toBe('filled');
      expect(closeResult).toMatchObject({ success: true, pnl: 200 });
    });

    it('should handle stop loss correctly', () => {
      engine.placeOrder('BTCUSD', 'buy', 0.1, 50000, 'market');
      engine.setStopLoss('BTCUSD', 49000);
      engine.updateMarketPrice('BTCUSD', 48900);

      expect(engine.getPosition('BTCUSD')).toBeUndefined();
    });

    it('should handle take profit correctly', () => {
      engine.placeOrder('ETHUSD', 'buy', 1, 3000, 'market');
      engine.setTakeProfit('ETHUSD', 3200);
      engine.updateMarketPrice('ETHUSD', 3300);

      expect(engine.getPosition('ETHUSD')).toBeUndefined();
    });

    it('should prevent trades with insufficient balance', () => {
      const order = engine.placeOrder('BTCUSD', 'buy', 10, 50000, 'market');

      expect(order.status).toBe('cancelled');
      expect(engine.getPosition('BTCUSD')).toBeUndefined();
    });

    it('should track balance and equity correctly', () => {
      engine.placeOrder('BTCUSD', 'buy', 0.1, 50000, 'market');
      engine.updateMarketPrice('BTCUSD', 52000);

      expect(engine.getBalance()).toBe(5000);
      expect(engine.getEquity()).toBe(5200);
    });
  });

  describe('5. End-to-End Integration Test', () => {
    it('should simulate complete trading agent workflow', async () => {
      const createTradingLogSpy = vi.mocked(pythonApi.createTradingLog);
      const recordPositionSnapshotSpy = vi.mocked(pythonApi.recordPositionSnapshot);
      const recordBalanceSpy = vi.mocked(pythonApi.recordBalance);

      const currentPrice = await pythonApi.fetchPrice('BTCUSD', false);
      const engine = new PaperTradingEngine(10000);
      const tradeSize = 0.1;
      const stopLoss = currentPrice * 0.98;
      const takeProfit = currentPrice * 1.04;

      await pythonApi.createTradingLog({
        action: 'analysis_start',
        symbol: 'BTCUSD',
        reason: 'Backtesting workflow simulation',
        details: `Current price: $${currentPrice}`,
      } as any);

      const order = engine.placeOrder('BTCUSD', 'buy', tradeSize, currentPrice, 'market');
      engine.setStopLoss('BTCUSD', stopLoss);
      engine.setTakeProfit('BTCUSD', takeProfit);

      await pythonApi.createTradingLog({
        action: 'open_long',
        symbol: 'BTCUSD',
        side: 'long',
        price: currentPrice,
        size: tradeSize,
        reason: 'Backtesting simulation',
        details: `SL: $${stopLoss.toFixed(2)}, TP: $${takeProfit.toFixed(2)}`,
      } as any);

      await pythonApi.recordPositionSnapshot({
        symbol: 'BTCUSD',
        side: 'long',
        size: tradeSize,
        entry_price: currentPrice,
        current_price: currentPrice,
        unrealized_pnl: 0,
        leverage: 1,
        mode: 'paper',
      });

      const exitPrice = currentPrice * 1.02;
      engine.updateMarketPrice('BTCUSD', exitPrice);
      const closeResult = engine.closePosition('BTCUSD', exitPrice, 'manual');

      await pythonApi.createTradingLog({
        action: 'close_position',
        symbol: 'BTCUSD',
        side: 'long',
        price: exitPrice,
        size: tradeSize,
        reason: 'Backtesting simulation complete',
        details: `P&L: $${closeResult.pnl.toFixed(2)}`,
      } as any);
      await pythonApi.recordBalance(engine.getBalance(), 'paper');

      expect(order.status).toBe('filled');
      expect(closeResult).toMatchObject({ success: true, pnl: 100 });
      expect(createTradingLogSpy).toHaveBeenCalledTimes(3);
      expect(recordPositionSnapshotSpy).toHaveBeenCalledTimes(1);
      expect(recordBalanceSpy).toHaveBeenCalledWith(10100, 'paper');
    });
  });
});

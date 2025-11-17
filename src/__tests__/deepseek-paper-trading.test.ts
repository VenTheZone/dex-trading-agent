import { describe, it, expect, beforeEach } from 'vitest';
import { PaperTradingEngine } from '@/lib/paper-trading-engine';

describe('Paper Trading Engine - Perpetual Futures Simulation', () => {
  let engine: PaperTradingEngine;
  const initialBalance = 10000;

  beforeEach(() => {
    engine = new PaperTradingEngine(initialBalance);
  });

  describe('Leverage Mechanics', () => {
    it('should multiply position size by leverage', () => {
      const leverage = 10;
      const price = 50000;
      const collateral = 1000; // $1000 collateral
      const expectedSize = (collateral * leverage) / price; // 0.2 BTC

      const order = engine.placeOrder('BTCUSD', 'buy', expectedSize, price, 'market', leverage);
      
      expect(order.status).toBe('filled');
      
      const position = engine.getPosition('BTCUSD');
      expect(position).toBeDefined();
      expect(position?.size).toBeCloseTo(expectedSize, 6);
      expect(position?.leverage).toBe(leverage);
      
      // Balance should only decrease by collateral, not full position value
      expect(engine.getBalance()).toBeCloseTo(initialBalance - collateral, 2);
    });

    it('should calculate correct P&L with leverage', () => {
      const leverage = 5;
      const entryPrice = 50000;
      const size = 0.1; // 0.1 BTC

      engine.placeOrder('BTCUSD', 'buy', size, entryPrice, 'market', leverage);
      
      // Price increases by 10% = $5000
      const newPrice = 55000;
      engine.updateMarketPrice('BTCUSD', newPrice);
      
      const position = engine.getPosition('BTCUSD');
      
      // P&L should be: (55000 - 50000) * 0.1 = $500
      // ROI on collateral: $500 / $1000 = 50% (5x leverage * 10% price move)
      expect(position?.unrealizedPnl).toBeCloseTo(500, 2);
    });

    it('should trigger liquidation when loss exceeds margin', () => {
      const leverage = 10;
      const entryPrice = 50000;
      const size = 0.2; // 0.2 BTC

      engine.placeOrder('BTCUSD', 'buy', size, entryPrice, 'market', leverage);
      
      // Price drops by 8% = $4000 (loss = $800, approaching liquidation)
      const liquidationPrice = entryPrice * 0.92; // ~8% drop triggers liquidation at 10x
      engine.updateMarketPrice('BTCUSD', liquidationPrice);
      
      const position = engine.getPosition('BTCUSD');
      
      // Position should be liquidated (closed automatically)
      expect(position).toBeUndefined();
      
      // Balance should reflect liquidation loss (most collateral lost)
      expect(engine.getBalance()).toBeLessThan(initialBalance - 800);
    });
  });

  describe('Mark-to-Market for Open Trades', () => {
    it('should continuously update unrealized P&L as price changes', () => {
      const entryPrice = 50000;
      const size = 0.1;

      engine.placeOrder('BTCUSD', 'buy', size, entryPrice, 'market', 1);
      
      // Price increases
      engine.updateMarketPrice('BTCUSD', 51000);
      let position = engine.getPosition('BTCUSD');
      expect(position?.unrealizedPnl).toBeCloseTo(100, 2);
      expect(position?.currentPrice).toBe(51000);
      
      // Price decreases
      engine.updateMarketPrice('BTCUSD', 49000);
      position = engine.getPosition('BTCUSD');
      expect(position?.unrealizedPnl).toBeCloseTo(-100, 2);
      expect(position?.currentPrice).toBe(49000);
      
      // Price returns to entry
      engine.updateMarketPrice('BTCUSD', 50000);
      position = engine.getPosition('BTCUSD');
      expect(position?.unrealizedPnl).toBeCloseTo(0, 2);
    });

    it('should update equity (balance + unrealized P&L)', () => {
      const entryPrice = 50000;
      const size = 0.1;

      engine.placeOrder('BTCUSD', 'buy', size, entryPrice, 'market', 1);
      
      const initialEquity = engine.getEquity();
      expect(initialEquity).toBeCloseTo(initialBalance - (size * entryPrice), 2);
      
      // Price increases by $1000
      engine.updateMarketPrice('BTCUSD', 51000);
      const newEquity = engine.getEquity();
      
      // Equity should increase by P&L
      expect(newEquity).toBeCloseTo(initialEquity + 100, 2);
    });
  });

  describe('Take Profit / Stop Loss Execution', () => {
    it('should automatically close position when take profit is hit', () => {
      const entryPrice = 50000;
      const size = 0.1;
      const takeProfit = 52000; // +4% target

      engine.placeOrder('BTCUSD', 'buy', size, entryPrice, 'market', 1);
      engine.setTakeProfit('BTCUSD', takeProfit);
      
      // Price reaches TP
      engine.updateMarketPrice('BTCUSD', 52000);
      
      const position = engine.getPosition('BTCUSD');
      expect(position).toBeUndefined(); // Position should be closed
      
      // Balance should reflect profit
      const expectedProfit = (takeProfit - entryPrice) * size;
      expect(engine.getBalance()).toBeCloseTo(initialBalance + expectedProfit, 2);
    });

    it('should automatically close position when stop loss is hit', () => {
      const entryPrice = 50000;
      const size = 0.1;
      const stopLoss = 49000; // -2% stop

      engine.placeOrder('BTCUSD', 'buy', size, entryPrice, 'market', 1);
      engine.setStopLoss('BTCUSD', stopLoss);
      
      // Price hits SL
      engine.updateMarketPrice('BTCUSD', 49000);
      
      const position = engine.getPosition('BTCUSD');
      expect(position).toBeUndefined(); // Position should be closed
      
      // Balance should reflect loss
      const expectedLoss = (stopLoss - entryPrice) * size;
      expect(engine.getBalance()).toBeCloseTo(initialBalance + expectedLoss, 2);
    });

    it('should handle TP/SL for short positions correctly', () => {
      const entryPrice = 50000;
      const size = 0.1;
      const takeProfit = 48000; // Short profits when price drops
      const stopLoss = 51000; // Short stops when price rises

      engine.placeOrder('BTCUSD', 'sell', size, entryPrice, 'market', 1);
      engine.setTakeProfit('BTCUSD', takeProfit);
      engine.setStopLoss('BTCUSD', stopLoss);
      
      // Test TP
      engine.updateMarketPrice('BTCUSD', 48000);
      let position = engine.getPosition('BTCUSD');
      expect(position).toBeUndefined();
      
      // Reset for SL test
      engine.placeOrder('BTCUSD', 'sell', size, entryPrice, 'market', 1);
      engine.setStopLoss('BTCUSD', stopLoss);
      
      engine.updateMarketPrice('BTCUSD', 51000);
      position = engine.getPosition('BTCUSD');
      expect(position).toBeUndefined();
    });
  });

  describe('Trailing Stop Loss', () => {
    it('should activate trailing stop after reaching profit threshold', () => {
      const entryPrice = 50000;
      const size = 0.1;
      const trailingStopPercent = 2; // 2% trailing
      const activationPercent = 5; // Activate after 5% profit

      engine.placeOrder('BTCUSD', 'buy', size, entryPrice, 'market', 1);
      engine.setTrailingStop('BTCUSD', trailingStopPercent, activationPercent);
      
      // Price increases by 6% (activates trailing stop)
      engine.updateMarketPrice('BTCUSD', 53000);
      
      let position = engine.getPosition('BTCUSD');
      expect(position?.trailingStopActive).toBe(true);
      expect(position?.trailingStopPrice).toBeCloseTo(53000 * 0.98, 2); // 2% below peak
      
      // Price continues up
      engine.updateMarketPrice('BTCUSD', 54000);
      position = engine.getPosition('BTCUSD');
      expect(position?.trailingStopPrice).toBeCloseTo(54000 * 0.98, 2); // Trailing stop moves up
      
      // Price drops and hits trailing stop
      engine.updateMarketPrice('BTCUSD', 52920); // Just below trailing stop
      position = engine.getPosition('BTCUSD');
      expect(position).toBeUndefined(); // Position closed by trailing stop
    });

    it('should not activate trailing stop before profit threshold', () => {
      const entryPrice = 50000;
      const size = 0.1;
      const trailingStopPercent = 2;
      const activationPercent = 5;

      engine.placeOrder('BTCUSD', 'buy', size, entryPrice, 'market', 1);
      engine.setTrailingStop('BTCUSD', trailingStopPercent, activationPercent);
      
      // Price increases by only 3% (below activation threshold)
      engine.updateMarketPrice('BTCUSD', 51500);
      
      const position = engine.getPosition('BTCUSD');
      expect(position?.trailingStopActive).toBe(false);
      
      // Price drops back down - should not trigger trailing stop
      engine.updateMarketPrice('BTCUSD', 50000);
      expect(engine.getPosition('BTCUSD')).toBeDefined(); // Still open
    });
  });

  describe('Multiple Positions and Risk Management', () => {
    it('should handle multiple positions across different symbols', () => {
      engine.placeOrder('BTCUSD', 'buy', 0.1, 50000, 'market', 5);
      engine.placeOrder('ETHUSD', 'buy', 1, 3000, 'market', 3);
      
      const positions = engine.getAllPositions();
      expect(positions.length).toBe(2);
      
      engine.updateMarketPrice('BTCUSD', 51000);
      engine.updateMarketPrice('ETHUSD', 3100);
      
      const totalPnl = engine.getTotalPnl();
      expect(totalPnl).toBeCloseTo(200, 2); // BTC: +100, ETH: +100
    });

    it('should prevent opening position if insufficient margin', () => {
      const leverage = 10;
      const price = 50000;
      const size = 3; // Would require $15000 collateral at 10x = $150k position

      const order = engine.placeOrder('BTCUSD', 'buy', size, price, 'market', leverage);
      
      expect(order.status).toBe('cancelled');
      expect(engine.getPosition('BTCUSD')).toBeUndefined();
    });

    it('should calculate total margin usage correctly', () => {
      const leverage = 5;
      
      engine.placeOrder('BTCUSD', 'buy', 0.1, 50000, 'market', leverage);
      engine.placeOrder('ETHUSD', 'buy', 1, 3000, 'market', leverage);
      
      const marginUsed = engine.getTotalMarginUsed();
      const expectedMargin = (0.1 * 50000) / leverage + (1 * 3000) / leverage;
      
      expect(marginUsed).toBeCloseTo(expectedMargin, 2);
      
      const marginUsagePercent = (marginUsed / initialBalance) * 100;
      expect(marginUsagePercent).toBeLessThan(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle partial position closes', () => {
      engine.placeOrder('BTCUSD', 'buy', 0.2, 50000, 'market', 1);
      
      // Close half the position
      engine.placeOrder('BTCUSD', 'sell', 0.1, 51000, 'market', 1);
      
      const position = engine.getPosition('BTCUSD');
      expect(position?.size).toBeCloseTo(0.1, 6);
    });

    it('should handle position reversal (close and open opposite)', () => {
      engine.placeOrder('BTCUSD', 'buy', 0.1, 50000, 'market', 1);
      
      // Sell more than position size (close long, open short)
      engine.placeOrder('BTCUSD', 'sell', 0.2, 51000, 'market', 1);
      
      const position = engine.getPosition('BTCUSD');
      expect(position?.side).toBe('short');
      expect(position?.size).toBeCloseTo(0.1, 6);
    });

    it('should reset realized P&L after position close', () => {
      engine.placeOrder('BTCUSD', 'buy', 0.1, 50000, 'market', 1);
      engine.updateMarketPrice('BTCUSD', 51000);
      
      const closeResult = engine.closePosition('BTCUSD', 51000, 'manual');
      expect(closeResult.success).toBe(true);
      expect(closeResult.pnl).toBeCloseTo(100, 2);
      
      // Open new position - realized P&L should be independent
      engine.placeOrder('BTCUSD', 'buy', 0.1, 51000, 'market', 1);
      const position = engine.getPosition('BTCUSD');
      expect(position?.realizedPnl).toBe(0);
    });
  });
});

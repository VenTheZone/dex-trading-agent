import { describe, it, expect, beforeEach } from 'vitest';
import { PaperTradingEngine } from '../lib/paper-trading-engine';

describe('PaperTradingEngine', () => {
  let engine: PaperTradingEngine;

  beforeEach(() => {
    engine = new PaperTradingEngine(10000); // Start with $10,000
  });

  it('should initialize with correct balance', () => {
    expect(engine.getBalance()).toBe(10000);
    expect(engine.getEquity()).toBe(10000);
  });

  it('should place a market buy order and create a position', () => {
    const order = engine.placeOrder('BTC-USD', 'buy', 1, 50000, 'market', 10);
    
    expect(order.status).toBe('filled');
    expect(order.filled).toBe(1);
    
    const position = engine.getPosition('BTC-USD');
    expect(position).toBeDefined();
    expect(position?.side).toBe('long');
    expect(position?.size).toBe(1);
    expect(position?.entryPrice).toBe(50000);
    expect(position?.leverage).toBe(10);
    
    // Collateral should be deducted from balance
    // Size * Price / Leverage = 1 * 50000 / 10 = 5000
    expect(engine.getBalance()).toBe(5000);
  });

  it('should calculate PnL correctly for long position', () => {
    engine.placeOrder('BTC-USD', 'buy', 1, 50000, 'market', 10);
    
    // Price moves up 10%
    engine.updateMarketPrice('BTC-USD', 55000);
    
    const position = engine.getPosition('BTC-USD');
    expect(position?.unrealizedPnl).toBe(5000); // (55000 - 50000) * 1
    expect(engine.getEquity()).toBe(15000); // 5000 balance + 5000 collateral + 5000 PnL
  });

  it('should calculate PnL correctly for short position', () => {
    engine.placeOrder('BTC-USD', 'sell', 1, 50000, 'market', 10);
    
    // Price moves down 10%
    engine.updateMarketPrice('BTC-USD', 45000);
    
    const position = engine.getPosition('BTC-USD');
    expect(position?.unrealizedPnl).toBe(5000); // (50000 - 45000) * 1
    expect(engine.getEquity()).toBe(15000);
  });

  it('should trigger stop loss', () => {
    engine.placeOrder('BTC-USD', 'buy', 1, 50000, 'market', 10);
    engine.setStopLoss('BTC-USD', 49000);
    
    // Price drops below stop loss
    engine.updateMarketPrice('BTC-USD', 48000);
    
    const position = engine.getPosition('BTC-USD');
    expect(position).toBeUndefined(); // Position should be closed
    
    // Loss calculation: (48000 - 50000) * 1 = -2000
    // Initial Balance: 10000
    // Collateral: 5000
    // Balance after open: 5000
    // Return: Collateral (5000) + PnL (-2000) = 3000
    // Final Balance: 5000 + 3000 = 8000
    expect(engine.getBalance()).toBe(8000);
  });

  it('should trigger take profit', () => {
    engine.placeOrder('BTC-USD', 'buy', 1, 50000, 'market', 10);
    engine.setTakeProfit('BTC-USD', 55000);
    
    // Price rises above take profit
    engine.updateMarketPrice('BTC-USD', 56000);
    
    const position = engine.getPosition('BTC-USD');
    expect(position).toBeUndefined();
    
    // Profit: (56000 - 50000) * 1 = 6000
    // Final Balance: 10000 + 6000 = 16000
    expect(engine.getBalance()).toBe(16000);
  });

  it('should handle liquidation', () => {
    // 50x leverage
    engine.placeOrder('BTC-USD', 'buy', 1, 50000, 'market', 50);
    // Collateral: 1000
    
    const position = engine.getPosition('BTC-USD');
    const liqPrice = position?.liquidationPrice || 0;
    
    // Drop price below liquidation
    engine.updateMarketPrice('BTC-USD', liqPrice - 100);
    
    expect(engine.getPosition('BTC-USD')).toBeUndefined();
    // Should lose collateral minus fee
    expect(engine.getBalance()).toBeLessThan(10000);
    expect(engine.getBalance()).toBeGreaterThan(9000); 
  });

  it('should handle trailing stop', () => {
    engine.placeOrder('BTC-USD', 'buy', 1, 50000, 'market', 1);
    // Set trailing stop 5% with 1% activation
    engine.setTrailingStop('BTC-USD', 5, 1);
    
    // Price moves up 10% (55000) - should activate trailing stop
    engine.updateMarketPrice('BTC-USD', 55000);
    
    let position = engine.getPosition('BTC-USD');
    expect(position?.trailingStopActive).toBe(true);
    expect(position?.trailingStopPrice).toBe(55000 * 0.95); // 52250
    
    // Price moves up more to 60000
    engine.updateMarketPrice('BTC-USD', 60000);
    position = engine.getPosition('BTC-USD');
    expect(position?.trailingStopPrice).toBe(60000 * 0.95); // 57000
    
    // Price drops to 56000 (below 57000)
    engine.updateMarketPrice('BTC-USD', 56000);
    
    expect(engine.getPosition('BTC-USD')).toBeUndefined();
  });
});

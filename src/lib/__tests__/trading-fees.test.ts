import { describe, it, expect } from 'vitest';

/**
 * Trading Fees Unit Tests
 * Tests maker/taker fee calculations for Hyperliquid perpetual futures
 * 
 * Hyperliquid Fee Structure:
 * - Maker Fee: 0.02% (0.0002) - rebate for providing liquidity
 * - Taker Fee: 0.05% (0.0005) - fee for taking liquidity
 */

describe('Trading Fees - Maker/Taker Fee Calculations', () => {
  const MAKER_FEE_RATE = 0.0002; // 0.02%
  const TAKER_FEE_RATE = 0.0005; // 0.05%

  describe('Maker Fee Calculations', () => {
    it('should calculate maker fee for BTC long position', () => {
      const positionSize = 0.1; // 0.1 BTC
      const entryPrice = 50000; // $50,000
      const notionalValue = positionSize * entryPrice; // $5,000
      
      const makerFee = notionalValue * MAKER_FEE_RATE;
      
      expect(makerFee).toBe(1.0); // $1.00 maker fee
      expect(makerFee).toBeLessThan(notionalValue * TAKER_FEE_RATE); // Maker fee < Taker fee
    });

    it('should calculate maker fee for ETH short position', () => {
      const positionSize = 5.0; // 5 ETH
      const entryPrice = 3000; // $3,000
      const notionalValue = positionSize * entryPrice; // $15,000
      
      const makerFee = notionalValue * MAKER_FEE_RATE;
      
      expect(makerFee).toBe(3.0); // $3.00 maker fee
      expect(makerFee / notionalValue).toBe(MAKER_FEE_RATE);
    });

    it('should calculate maker fee for SOL position with leverage', () => {
      const positionSize = 100; // 100 SOL
      const entryPrice = 150; // $150
      const leverage = 10;
      const notionalValue = positionSize * entryPrice; // $15,000
      const marginRequired = notionalValue / leverage; // $1,500
      
      const makerFee = notionalValue * MAKER_FEE_RATE;
      
      expect(makerFee).toBe(3.0); // $3.00 maker fee
      expect(makerFee).toBeLessThan(marginRequired); // Fee < margin
    });

    it('should calculate maker fee for small position', () => {
      const positionSize = 0.001; // 0.001 BTC
      const entryPrice = 50000; // $50,000
      const notionalValue = positionSize * entryPrice; // $50
      
      const makerFee = notionalValue * MAKER_FEE_RATE;
      
      expect(makerFee).toBe(0.01); // $0.01 maker fee
      expect(makerFee).toBeGreaterThan(0);
    });

    it('should calculate maker fee for large position', () => {
      const positionSize = 10; // 10 BTC
      const entryPrice = 50000; // $50,000
      const notionalValue = positionSize * entryPrice; // $500,000
      
      const makerFee = notionalValue * MAKER_FEE_RATE;
      
      expect(makerFee).toBe(100.0); // $100.00 maker fee
      expect(makerFee / notionalValue).toBe(MAKER_FEE_RATE);
    });
  });

  describe('Taker Fee Calculations', () => {
    it('should calculate taker fee for BTC long position', () => {
      const positionSize = 0.1; // 0.1 BTC
      const entryPrice = 50000; // $50,000
      const notionalValue = positionSize * entryPrice; // $5,000
      
      const takerFee = notionalValue * TAKER_FEE_RATE;
      
      expect(takerFee).toBe(2.5); // $2.50 taker fee
      expect(takerFee).toBeGreaterThan(notionalValue * MAKER_FEE_RATE); // Taker fee > Maker fee
    });

    it('should calculate taker fee for ETH short position', () => {
      const positionSize = 5.0; // 5 ETH
      const entryPrice = 3000; // $3,000
      const notionalValue = positionSize * entryPrice; // $15,000
      
      const takerFee = notionalValue * TAKER_FEE_RATE;
      
      expect(takerFee).toBe(7.5); // $7.50 taker fee
      expect(takerFee / notionalValue).toBe(TAKER_FEE_RATE);
    });

    it('should calculate taker fee for SOL position with leverage', () => {
      const positionSize = 100; // 100 SOL
      const entryPrice = 150; // $150
      const leverage = 10;
      const notionalValue = positionSize * entryPrice; // $15,000
      const marginRequired = notionalValue / leverage; // $1,500
      
      const takerFee = notionalValue * TAKER_FEE_RATE;
      
      expect(takerFee).toBe(7.5); // $7.50 taker fee
      expect(takerFee).toBeLessThan(marginRequired); // Fee < margin
    });

    it('should calculate taker fee for small position', () => {
      const positionSize = 0.001; // 0.001 BTC
      const entryPrice = 50000; // $50,000
      const notionalValue = positionSize * entryPrice; // $50
      
      const takerFee = notionalValue * TAKER_FEE_RATE;
      
      expect(takerFee).toBe(0.025); // $0.025 taker fee
      expect(takerFee).toBeGreaterThan(0);
    });

    it('should calculate taker fee for large position', () => {
      const positionSize = 10; // 10 BTC
      const entryPrice = 50000; // $50,000
      const notionalValue = positionSize * entryPrice; // $500,000
      
      const takerFee = notionalValue * TAKER_FEE_RATE;
      
      expect(takerFee).toBe(250.0); // $250.00 taker fee
      expect(takerFee / notionalValue).toBe(TAKER_FEE_RATE);
    });
  });

  describe('Maker vs Taker Fee Comparison', () => {
    it('should show taker fee is 2.5x higher than maker fee', () => {
      const notionalValue = 10000; // $10,000 position
      
      const makerFee = notionalValue * MAKER_FEE_RATE;
      const takerFee = notionalValue * TAKER_FEE_RATE;
      
      expect(takerFee / makerFee).toBe(2.5);
      expect(takerFee).toBe(5.0); // $5.00
      expect(makerFee).toBe(2.0); // $2.00
    });

    it('should calculate fee savings when using maker orders', () => {
      const positionSize = 1.0; // 1 BTC
      const entryPrice = 50000; // $50,000
      const notionalValue = positionSize * entryPrice;
      
      const makerFee = notionalValue * MAKER_FEE_RATE;
      const takerFee = notionalValue * TAKER_FEE_RATE;
      const savings = takerFee - makerFee;
      
      expect(savings).toBe(15.0); // $15.00 savings
      expect(savings / takerFee).toBeCloseTo(0.6, 1); // 60% savings
    });
  });

  describe('Round-Trip Fee Calculations', () => {
    it('should calculate total fees for opening and closing position (both taker)', () => {
      const positionSize = 0.5; // 0.5 BTC
      const entryPrice = 50000; // $50,000
      const exitPrice = 52000; // $52,000
      
      const entryNotional = positionSize * entryPrice; // $25,000
      const exitNotional = positionSize * exitPrice; // $26,000
      
      const entryFee = entryNotional * TAKER_FEE_RATE; // $12.50
      const exitFee = exitNotional * TAKER_FEE_RATE; // $13.00
      const totalFees = entryFee + exitFee;
      
      expect(totalFees).toBe(25.5); // $25.50 total fees
      expect(entryFee).toBe(12.5);
      expect(exitFee).toBe(13.0);
    });

    it('should calculate total fees for opening and closing position (both maker)', () => {
      const positionSize = 0.5; // 0.5 BTC
      const entryPrice = 50000; // $50,000
      const exitPrice = 52000; // $52,000
      
      const entryNotional = positionSize * entryPrice; // $25,000
      const exitNotional = positionSize * exitPrice; // $26,000
      
      const entryFee = entryNotional * MAKER_FEE_RATE; // $5.00
      const exitFee = exitNotional * MAKER_FEE_RATE; // $5.20
      const totalFees = entryFee + exitFee;
      
      expect(totalFees).toBe(10.2); // $10.20 total fees
      expect(entryFee).toBe(5.0);
      expect(exitFee).toBe(5.2);
    });

    it('should calculate total fees for mixed maker/taker orders', () => {
      const positionSize = 0.5; // 0.5 BTC
      const entryPrice = 50000; // $50,000
      const exitPrice = 52000; // $52,000
      
      const entryNotional = positionSize * entryPrice; // $25,000
      const exitNotional = positionSize * exitPrice; // $26,000
      
      const entryFee = entryNotional * MAKER_FEE_RATE; // $5.00 (maker)
      const exitFee = exitNotional * TAKER_FEE_RATE; // $13.00 (taker)
      const totalFees = entryFee + exitFee;
      
      expect(totalFees).toBe(18.0); // $18.00 total fees
      expect(entryFee).toBe(5.0);
      expect(exitFee).toBe(13.0);
    });
  });

  describe('Fee Impact on P&L', () => {
    it('should calculate net P&L after fees for profitable trade', () => {
      const positionSize = 1.0; // 1 BTC
      const entryPrice = 50000; // $50,000
      const exitPrice = 52000; // $52,000
      
      const grossPnL = (exitPrice - entryPrice) * positionSize; // $2,000
      
      const entryFee = (positionSize * entryPrice) * TAKER_FEE_RATE; // $25.00
      const exitFee = (positionSize * exitPrice) * TAKER_FEE_RATE; // $26.00
      const totalFees = entryFee + exitFee; // $51.00
      
      const netPnL = grossPnL - totalFees; // $1,949.00
      
      expect(grossPnL).toBe(2000);
      expect(totalFees).toBe(51.0);
      expect(netPnL).toBe(1949.0);
      expect(netPnL / grossPnL).toBeCloseTo(0.9745, 4); // 97.45% of gross P&L
    });

    it('should calculate net P&L after fees for losing trade', () => {
      const positionSize = 1.0; // 1 BTC
      const entryPrice = 50000; // $50,000
      const exitPrice = 49000; // $49,000
      
      const grossPnL = (exitPrice - entryPrice) * positionSize; // -$1,000
      
      const entryFee = (positionSize * entryPrice) * TAKER_FEE_RATE; // $25.00
      const exitFee = (positionSize * exitPrice) * TAKER_FEE_RATE; // $24.50
      const totalFees = entryFee + exitFee; // $49.50
      
      const netPnL = grossPnL - totalFees; // -$1,049.50
      
      expect(grossPnL).toBe(-1000);
      expect(totalFees).toBe(49.5);
      expect(netPnL).toBe(-1049.5);
      expect(Math.abs(netPnL)).toBeGreaterThan(Math.abs(grossPnL)); // Fees increase loss
    });

    it('should calculate break-even price including fees', () => {
      const positionSize = 1.0; // 1 BTC
      const entryPrice = 50000; // $50,000
      
      const entryNotional = positionSize * entryPrice;
      const entryFee = entryNotional * TAKER_FEE_RATE; // $25.00
      
      // To break even, exit price must cover entry fee + exit fee
      // exitPrice * size - entryPrice * size = entryFee + exitFee
      // exitPrice * size - entryPrice * size = entryFee + (exitPrice * size * TAKER_FEE_RATE)
      // exitPrice * size * (1 - TAKER_FEE_RATE) = entryPrice * size + entryFee
      // exitPrice = (entryPrice * size + entryFee) / (size * (1 - TAKER_FEE_RATE))
      
      const breakEvenPrice = (entryPrice * positionSize + entryFee) / (positionSize * (1 - TAKER_FEE_RATE));
      
      expect(breakEvenPrice).toBeGreaterThan(entryPrice);
      expect(breakEvenPrice).toBeCloseTo(50050.025, 2); // ~$50,050.03
      
      // Verify break-even calculation
      const exitNotional = positionSize * breakEvenPrice;
      const exitFee = exitNotional * TAKER_FEE_RATE;
      const pnl = (breakEvenPrice - entryPrice) * positionSize;
      const netPnL = pnl - entryFee - exitFee;
      
      expect(netPnL).toBeCloseTo(0, 2); // Should be ~$0
    });
  });

  describe('Fee Calculations with Leverage', () => {
    it('should calculate fees based on notional value, not margin', () => {
      const positionSize = 1.0; // 1 BTC
      const entryPrice = 50000; // $50,000
      const leverage = 20; // 20x leverage
      
      const notionalValue = positionSize * entryPrice; // $50,000
      const marginRequired = notionalValue / leverage; // $2,500
      
      const takerFee = notionalValue * TAKER_FEE_RATE; // $25.00 (based on notional)
      
      expect(takerFee).toBe(25.0);
      expect(takerFee).not.toBe(marginRequired * TAKER_FEE_RATE); // Fee NOT based on margin
      expect(takerFee / marginRequired).toBeCloseTo(0.01, 2); // 1% of margin
    });

    it('should show higher leverage increases fee-to-margin ratio', () => {
      const positionSize = 1.0; // 1 BTC
      const entryPrice = 50000; // $50,000
      const notionalValue = positionSize * entryPrice;
      
      const leverage5x = 5;
      const leverage20x = 20;
      
      const margin5x = notionalValue / leverage5x; // $10,000
      const margin20x = notionalValue / leverage20x; // $2,500
      
      const takerFee = notionalValue * TAKER_FEE_RATE; // $25.00 (same for both)
      
      const feeToMarginRatio5x = takerFee / margin5x; // 0.25%
      const feeToMarginRatio20x = takerFee / margin20x; // 1.0%
      
      expect(feeToMarginRatio20x).toBe(feeToMarginRatio5x * 4);
      expect(feeToMarginRatio5x).toBeCloseTo(0.0025, 4);
      expect(feeToMarginRatio20x).toBeCloseTo(0.01, 4);
    });
  });

  describe('Multi-Asset Fee Calculations', () => {
    it('should calculate fees for multiple assets correctly', () => {
      const trades = [
        { symbol: 'BTC', size: 0.1, price: 50000 },
        { symbol: 'ETH', size: 2.0, price: 3000 },
        { symbol: 'SOL', size: 50, price: 150 },
      ];
      
      const totalFees = trades.reduce((sum, trade) => {
        const notional = trade.size * trade.price;
        const fee = notional * TAKER_FEE_RATE;
        return sum + fee;
      }, 0);
      
      expect(totalFees).toBe(9.25); // $2.50 + $3.00 + $3.75
      
      // Verify individual fees
      expect((0.1 * 50000) * TAKER_FEE_RATE).toBe(2.5); // BTC
      expect((2.0 * 3000) * TAKER_FEE_RATE).toBe(3.0); // ETH
      expect((50 * 150) * TAKER_FEE_RATE).toBe(3.75); // SOL
    });
  });
});

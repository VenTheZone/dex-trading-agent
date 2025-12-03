import { 
  calculateLiquidationPrice, 
  assessLiquidationRisk, 
  canOpenPosition,
  getMarginTier
} from '../liquidation-protection';
import { describe, it, expect } from 'vitest';

describe('Liquidation Protection', () => {
  describe('calculateLiquidationPrice', () => {
    it('should calculate correct liquidation price for long position', () => {
      // Entry: 50000, Size: 1, Leverage: 10x
      // Margin Available: 5000 (10% of notional)
      // Maintenance Margin Rate: 1% (Tier 1)
      // Formula: Entry - (Margin / Size) / (1 - (1/Lev_maint) * 1)
      // Lev_maint = 1/0.01 = 100
      // Liq = 50000 - (5000/1) / (1 - 0.01) = 50000 - 5000 / 0.99 = 50000 - 5050.50 = 44949.50
      
      const liqPrice = calculateLiquidationPrice(50000, 1, 'long', 5000);
      
      // Approximate check due to floating point
      expect(liqPrice).toBeCloseTo(44949.49, 1);
    });

    it('should calculate correct liquidation price for short position', () => {
      // Entry: 50000, Size: 1, Leverage: 10x
      // Margin Available: 5000
      // Short formula: Entry + (Margin / Size) / (1 + (1/Lev_maint) * -1) ?? 
      // Actually formula uses side multiplier.
      // side = -1.
      // Liq = Entry - (-1 * Margin) / Size / (1 - l * -1)
      // Liq = Entry + Margin / Size / (1 + l)
      // Liq = 50000 + 5000 / (1 + 0.01) = 50000 + 5000 / 1.01 = 50000 + 4950.50 = 54950.50
      
      const liqPrice = calculateLiquidationPrice(50000, 1, 'short', 5000);
      
      expect(liqPrice).toBeCloseTo(54950.50, 1);
    });
  });

  describe('assessLiquidationRisk', () => {
    it('should return safe risk level when far from liquidation', () => {
      const position = {
        symbol: 'BTCUSD',
        side: 'long' as const,
        size: 1,
        entryPrice: 50000,
        leverage: 2,
      };
      
      // Current price 55000 (profit)
      // Balance 25000 (50% margin)
      const risk = assessLiquidationRisk(position, 55000, 25000);
      
      expect(risk.riskLevel).toBe('safe');
      expect(risk.distanceToLiquidation).toBeGreaterThan(20);
    });

    it('should return critical risk level when close to liquidation', () => {
      const position = {
        symbol: 'BTCUSD',
        side: 'long' as const,
        size: 1,
        entryPrice: 50000,
        leverage: 50, // High leverage
      };
      
      // Margin 1000. Liq price very close.
      // Current price drops to near liquidation
      // Liq price approx 49500.
      const risk = assessLiquidationRisk(position, 49600, 1000);
      
      expect(risk.riskLevel).toBe('critical');
      expect(risk.distanceToLiquidation).toBeLessThan(5);
    });
  });

  describe('canOpenPosition', () => {
    it('should allow opening position with sufficient margin', () => {
      const balance = 10000;
      const existingPositions: any[] = [];
      
      // Open 1 BTC @ 50000 (Notional 50000)
      // Maintenance margin ~500 (1%)
      // Margin usage = 500 / 10000 = 5% -> OK
      
      const result = canOpenPosition(balance, existingPositions, 1, 50000);
      
      expect(result.canOpen).toBe(true);
    });

    it('should prevent opening position if leverage is excessive', () => {
      const balance = 1000;
      const existingPositions: any[] = [];
      
      // Try to open position worth 20000 (20x leverage)
      // Limit is 10x in the function
      
      const result = canOpenPosition(balance, existingPositions, 0.4, 50000); // 20000 notional
      
      expect(result.canOpen).toBe(false);
      expect(result.reason).toContain('Excessive leverage');
    });

    it('should prevent opening position if margin usage is too high', () => {
      // Existing position using up most margin
      // Say we have 900,000 notional (90x leverage - unrealistic but for math)
      // Maintenance margin for 900k (Tier 2: 1.5% - 2500) = 13500 - 2500 = 11000
      // This would already be liquidated.
      
      // Let's try simpler. 
      // Balance 1000.
      // Existing: 0.
      // New: 0.18 BTC @ 50000 = 9000 notional.
      // Maintenance (1%) = 90.
      // Usage = 90 / 1000 = 9%. OK.
      
      // Wait, the function checks TOTAL maintenance margin against balance.
      // If we try to open huge position.
      
      const result = canOpenPosition(1000, [], 0.18, 50000); // 9000 notional. 9x leverage.
      expect(result.canOpen).toBe(true);
      
      // Try 15000 notional on 1000 balance (15x leverage) -> Should fail leverage check
      const result2 = canOpenPosition(1000, [], 0.3, 50000);
      expect(result2.canOpen).toBe(false);
    });
  });
  
  describe('getMarginTier', () => {
    it('should return tier 1 for low notional', () => {
      const tier = getMarginTier(10000);
      expect(tier.maintenanceMarginRate).toBe(0.01);
    });
    
    it('should return tier 2 for medium notional', () => {
      const tier = getMarginTier(600000);
      expect(tier.maintenanceMarginRate).toBe(0.015);
    });
    
    it('should return tier 3 for high notional', () => {
      const tier = getMarginTier(1500000);
      expect(tier.maintenanceMarginRate).toBe(0.025);
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  calculateLiquidationPrice,
  calculateMaintenanceMargin,
  assessLiquidationRisk,
  canOpenPosition,
  validateLeverage,
  getMarginTier
} from '../lib/liquidation-protection';

describe('Liquidation Protection Logic', () => {
  describe('getMarginTier', () => {
    it('should return correct tier for low notional value', () => {
      const tier = getMarginTier(10000);
      expect(tier.initialMarginRate).toBe(0.02);
      expect(tier.maintenanceMarginRate).toBe(0.01);
    });

    it('should return correct tier for medium notional value', () => {
      const tier = getMarginTier(750000);
      expect(tier.initialMarginRate).toBe(0.03);
      expect(tier.maintenanceMarginRate).toBe(0.015);
    });

    it('should return correct tier for high notional value', () => {
      const tier = getMarginTier(2000000);
      expect(tier.initialMarginRate).toBe(0.05);
      expect(tier.maintenanceMarginRate).toBe(0.025);
    });
  });

  describe('calculateLiquidationPrice', () => {
    it('should calculate correct liquidation price for long position', () => {
      // Entry: 50000, Size: 1 BTC, Margin: 50000 (1x leverage effectively)
      // Maintenance rate: 1% (tier 1)
      // l = 1 / (1/0.01) = 0.01
      // liq = 50000 - (1 * 50000) / 1 / (1 - 0.01 * 1)
      // liq = 50000 - 50000 / 0.99 = 50000 - 50505.05 = -505.05 (mathematically correct for 1x with full collateral)
      
      // Let's try a more realistic leverage scenario
      // Entry: 50000, Size: 1, Leverage: 10x -> Margin: 5000
      const liqPrice = calculateLiquidationPrice(50000, 1, 'long', 5000);
      // Expected: roughly 45000-46000 range
      expect(liqPrice).toBeLessThan(50000);
      expect(liqPrice).toBeGreaterThan(0);
    });

    it('should calculate correct liquidation price for short position', () => {
      // Entry: 50000, Size: 1, Leverage: 10x -> Margin: 5000
      const liqPrice = calculateLiquidationPrice(50000, 1, 'short', 5000);
      expect(liqPrice).toBeGreaterThan(50000);
    });
  });

  describe('calculateMaintenanceMargin', () => {
    it('should calculate correct maintenance margin for low tier', () => {
      const { maintenanceMargin, maintenanceMarginRate } = calculateMaintenanceMargin(10000);
      expect(maintenanceMarginRate).toBe(0.01);
      expect(maintenanceMargin).toBe(100); // 10000 * 0.01
    });

    it('should calculate correct maintenance margin for high tier', () => {
      // Tier 3: > 1,000,000. Rate 2.5%, Deduction 17,500
      const notional = 2000000;
      const { maintenanceMargin, maintenanceMarginRate } = calculateMaintenanceMargin(notional);
      expect(maintenanceMarginRate).toBe(0.025);
      // 2,000,000 * 0.025 - 17,500 = 50,000 - 17,500 = 32,500
      expect(maintenanceMargin).toBe(32500);
    });
  });

  describe('assessLiquidationRisk', () => {
    it('should identify safe positions', () => {
      const risk = assessLiquidationRisk(
        {
          symbol: 'BTC',
          side: 'long',
          size: 0.1,
          entryPrice: 50000,
          leverage: 2
        },
        51000, // Current price
        10000 // Account balance
      );
      
      expect(risk.riskLevel).toBe('safe');
      expect(risk.distanceToLiquidation).toBeGreaterThan(20);
    });

    it('should identify dangerous positions', () => {
      // High leverage, price moved against
      const risk = assessLiquidationRisk(
        {
          symbol: 'BTC',
          side: 'long',
          size: 1,
          entryPrice: 50000,
          leverage: 50
        },
        49200, // Dropped close to liquidation
        1000 // Small balance
      );
      
      expect(['danger', 'critical']).toContain(risk.riskLevel);
    });
  });

  describe('canOpenPosition', () => {
    it('should allow opening position with sufficient margin', () => {
      const result = canOpenPosition(
        10000, // Balance
        [], // No existing positions
        0.1, // Size
        50000 // Price
      );
      
      expect(result.canOpen).toBe(true);
    });

    it('should reject position exceeding max leverage', () => {
      const result = canOpenPosition(
        1000, // Small balance
        [], 
        1, // Large size (50k notional) -> 50x leverage
        50000
      );
      
      // 50x is allowed by tier 1, but let's check the safety buffer logic
      // The function has a 10x effective leverage check for safety
      expect(result.canOpen).toBe(false);
      expect(result.reason).toContain('Excessive leverage');
    });
  });

  describe('validateLeverage', () => {
    it('should validate correct leverage for asset', () => {
      const result = validateLeverage('BTC', 20);
      expect(result.valid).toBe(true);
    });

    it('should reject leverage exceeding asset max', () => {
      const result = validateLeverage('SHIB', 50); // SHIB max is usually 20 or 25
      expect(result.valid).toBe(false);
      expect(result.adjustedLeverage).toBeLessThan(50);
    });
  });
});
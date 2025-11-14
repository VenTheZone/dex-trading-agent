import { describe, it, expect } from 'vitest';
import {
  getMarginTier,
  calculateLiquidationPrice,
  calculateMaintenanceMargin,
  calculateInitialMargin,
  assessLiquidationRisk,
  canOpenPosition,
  getAssetMaxLeverage,
  validateLeverage,
} from '../liquidation-protection';

describe('Liquidation Protection - Margin Tiers', () => {
  it('should return tier 1 for notional value under $500k', () => {
    const tier = getMarginTier(100000);
    expect(tier.notionalMin).toBe(0);
    expect(tier.notionalMax).toBe(500000);
    expect(tier.initialMarginRate).toBe(0.02);
    expect(tier.maintenanceMarginRate).toBe(0.01);
  });

  it('should return tier 2 for notional value between $500k and $1M', () => {
    const tier = getMarginTier(750000);
    expect(tier.notionalMin).toBe(500000);
    expect(tier.notionalMax).toBe(1000000);
    expect(tier.initialMarginRate).toBe(0.03);
    expect(tier.maintenanceMarginRate).toBe(0.015);
    expect(tier.maintenanceDeduction).toBe(2500);
  });

  it('should return tier 3 for notional value over $1M', () => {
    const tier = getMarginTier(1500000);
    expect(tier.notionalMin).toBe(1000000);
    expect(tier.notionalMax).toBe(Infinity);
    expect(tier.initialMarginRate).toBe(0.05);
    expect(tier.maintenanceMarginRate).toBe(0.025);
    expect(tier.maintenanceDeduction).toBe(17500);
  });
});

describe('Liquidation Protection - Liquidation Price Calculation', () => {
  it('should calculate liquidation price for long position correctly', () => {
    const entryPrice = 50000;
    const positionSize = 1;
    const marginAvailable = 10000;
    
    const liqPrice = calculateLiquidationPrice(
      entryPrice,
      positionSize,
      'long',
      marginAvailable
    );
    
    expect(liqPrice).toBeLessThan(entryPrice);
    expect(liqPrice).toBeGreaterThan(0);
  });

  it('should calculate liquidation price for short position correctly', () => {
    const entryPrice = 50000;
    const positionSize = 1;
    const marginAvailable = 10000;
    
    const liqPrice = calculateLiquidationPrice(
      entryPrice,
      positionSize,
      'short',
      marginAvailable
    );
    
    expect(liqPrice).toBeGreaterThan(entryPrice);
  });

  it('should handle different margin tiers in liquidation calculation', () => {
    // Small position (tier 1)
    const smallLiqPrice = calculateLiquidationPrice(50000, 1, 'long', 5000);
    
    // Large position (tier 3)
    const largeLiqPrice = calculateLiquidationPrice(50000, 25, 'long', 50000);
    
    expect(smallLiqPrice).not.toBe(largeLiqPrice);
  });
});

describe('Liquidation Protection - Maintenance Margin', () => {
  it('should calculate maintenance margin for tier 1 correctly', () => {
    const notionalValue = 100000;
    const { maintenanceMargin, maintenanceMarginRate } = calculateMaintenanceMargin(notionalValue);
    
    expect(maintenanceMarginRate).toBe(0.01);
    expect(maintenanceMargin).toBe(1000); // 100000 * 0.01 - 0
  });

  it('should calculate maintenance margin for tier 2 with deduction', () => {
    const notionalValue = 750000;
    const { maintenanceMargin, maintenanceMarginRate } = calculateMaintenanceMargin(notionalValue);
    
    expect(maintenanceMarginRate).toBe(0.015);
    expect(maintenanceMargin).toBe(8750); // 750000 * 0.015 - 2500
  });

  it('should calculate maintenance margin for tier 3 with deduction', () => {
    const notionalValue = 1500000;
    const { maintenanceMargin, maintenanceMarginRate } = calculateMaintenanceMargin(notionalValue);
    
    expect(maintenanceMarginRate).toBe(0.025);
    expect(maintenanceMargin).toBe(20000); // 1500000 * 0.025 - 17500
  });

  it('should never return negative maintenance margin', () => {
    const notionalValue = 50000;
    const { maintenanceMargin } = calculateMaintenanceMargin(notionalValue);
    
    expect(maintenanceMargin).toBeGreaterThanOrEqual(0);
  });
});

describe('Liquidation Protection - Initial Margin', () => {
  it('should calculate initial margin with 1x leverage', () => {
    const positionSize = 1;
    const markPrice = 50000;
    const leverage = 1;
    
    const initialMargin = calculateInitialMargin(positionSize, markPrice, leverage);
    
    expect(initialMargin).toBe(50000); // Full position value
  });

  it('should calculate initial margin with 10x leverage', () => {
    const positionSize = 1;
    const markPrice = 50000;
    const leverage = 10;
    
    const initialMargin = calculateInitialMargin(positionSize, markPrice, leverage);
    
    expect(initialMargin).toBe(5000); // 50000 / 10
  });

  it('should calculate initial margin with 50x leverage', () => {
    const positionSize = 1;
    const markPrice = 50000;
    const leverage = 50;
    
    const initialMargin = calculateInitialMargin(positionSize, markPrice, leverage);
    
    expect(initialMargin).toBe(1000); // 50000 / 50
  });
});

describe('Liquidation Protection - Risk Assessment', () => {
  it('should assess safe risk level for well-margined position', () => {
    const position = {
      symbol: 'BTC',
      side: 'long' as const,
      size: 0.1,
      entryPrice: 50000,
      leverage: 5,
    };
    const currentPrice = 52000;
    const accountBalance = 20000;
    
    const risk = assessLiquidationRisk(position, currentPrice, accountBalance);
    
    expect(risk.riskLevel).toBe('safe');
    expect(risk.distanceToLiquidation).toBeGreaterThan(20);
    expect(risk.canOpenPosition).toBe(true);
  });

  it('should assess warning risk level for moderately risky position', () => {
    const position = {
      symbol: 'BTC',
      side: 'long' as const,
      size: 0.5,
      entryPrice: 50000,
      leverage: 10,
    };
    const currentPrice = 46000;
    const accountBalance = 5000;
    
    const risk = assessLiquidationRisk(position, currentPrice, accountBalance);
    
    expect(risk.riskLevel).toBe('warning');
    expect(risk.distanceToLiquidation).toBeLessThanOrEqual(20);
    expect(risk.distanceToLiquidation).toBeGreaterThan(10);
  });

  it('should assess danger risk level for high-risk position', () => {
    const position = {
      symbol: 'BTC',
      side: 'long' as const,
      size: 1,
      entryPrice: 50000,
      leverage: 25,
    };
    const currentPrice = 49000;
    const accountBalance = 5000;
    
    const risk = assessLiquidationRisk(position, currentPrice, accountBalance);
    
    expect(risk.riskLevel).toBe('danger');
    expect(risk.distanceToLiquidation).toBeLessThanOrEqual(10);
    expect(risk.distanceToLiquidation).toBeGreaterThan(5);
  });

  it('should calculate liquidation price correctly for short positions', () => {
    const position = {
      symbol: 'ETH',
      side: 'short' as const,
      size: 10,
      entryPrice: 3000,
      leverage: 10,
    };
    const currentPrice = 3100;
    const accountBalance = 5000;
    
    const risk = assessLiquidationRisk(position, currentPrice, accountBalance);
    
    expect(risk.liquidationPrice).toBeGreaterThan(position.entryPrice);
    expect(risk.currentPrice).toBe(currentPrice);
  });

  it('should provide max safe position size', () => {
    const position = {
      symbol: 'SOL',
      side: 'long' as const,
      size: 100,
      entryPrice: 100,
      leverage: 15,
    };
    const currentPrice = 105;
    const accountBalance = 10000;
    
    const risk = assessLiquidationRisk(position, currentPrice, accountBalance);
    
    expect(risk.maxSafePositionSize).toBeGreaterThan(0);
    expect(risk.maxSafePositionSize).toBeLessThan(position.size * 2);
  });
});

describe('Liquidation Protection - Position Opening Validation', () => {
  it('should allow opening position with sufficient margin', () => {
    const accountBalance = 10000;
    const existingPositions: Array<{ size: number; entryPrice: number; leverage: number }> = [];
    const newPositionSize = 0.1;
    const newPositionPrice = 50000;
    
    const result = canOpenPosition(
      accountBalance,
      existingPositions,
      newPositionSize,
      newPositionPrice
    );
    
    expect(result.canOpen).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('should reject position exceeding 90% margin usage', () => {
    const accountBalance = 1000;
    const existingPositions: Array<{ size: number; entryPrice: number; leverage: number }> = [];
    const newPositionSize = 10;
    const newPositionPrice = 50000;
    
    const result = canOpenPosition(
      accountBalance,
      existingPositions,
      newPositionSize,
      newPositionPrice
    );
    
    expect(result.canOpen).toBe(false);
    expect(result.reason).toContain('90% margin usage');
  });

  it('should reject position exceeding 80% margin usage and provide max safe size', () => {
    const accountBalance = 3000;
    const existingPositions: Array<{ size: number; entryPrice: number; leverage: number }> = [];
    const newPositionSize = 5;
    const newPositionPrice = 50000;
    
    const result = canOpenPosition(
      accountBalance,
      existingPositions,
      newPositionSize,
      newPositionPrice
    );
    
    expect(result.canOpen).toBe(false);
    expect(result.reason).toContain('Position size too large');
    expect(result.maxSafeSize).toBeDefined();
    expect(result.maxSafeSize).toBeGreaterThan(0);
  });

  it('should account for existing positions in margin calculation', () => {
    const accountBalance = 10000;
    const existingPositions = [
      { size: 0.5, entryPrice: 50000, leverage: 10 },
    ];
    const newPositionSize = 1;
    const newPositionPrice = 50000;
    
    const result = canOpenPosition(
      accountBalance,
      existingPositions,
      newPositionSize,
      newPositionPrice
    );
    
    // With existing position, should be more restrictive
    expect(result.canOpen).toBeDefined();
  });

  it('should handle multiple existing positions', () => {
    const accountBalance = 20000;
    const existingPositions = [
      { size: 0.2, entryPrice: 50000, leverage: 5 },
      { size: 10, entryPrice: 3000, leverage: 10 },
    ];
    const newPositionSize = 0.5;
    const newPositionPrice = 50000;
    
    const result = canOpenPosition(
      accountBalance,
      existingPositions,
      newPositionSize,
      newPositionPrice
    );
    
    expect(result).toBeDefined();
    expect(result.canOpen).toBeDefined();
  });
});

describe('Liquidation Protection - Asset Max Leverage', () => {
  it('should return 50x for BTC', () => {
    expect(getAssetMaxLeverage('BTC')).toBe(50);
    expect(getAssetMaxLeverage('BTCUSD')).toBe(50);
    expect(getAssetMaxLeverage('BTCUSDC')).toBe(50);
  });

  it('should return 50x for ETH', () => {
    expect(getAssetMaxLeverage('ETH')).toBe(50);
    expect(getAssetMaxLeverage('ETHUSD')).toBe(50);
  });

  it('should return 40x for SOL', () => {
    expect(getAssetMaxLeverage('SOL')).toBe(40);
    expect(getAssetMaxLeverage('SOLUSD')).toBe(40);
  });

  it('should return 25x for DOGE', () => {
    expect(getAssetMaxLeverage('DOGE')).toBe(25);
    expect(getAssetMaxLeverage('DOGEUSD')).toBe(25);
  });

  it('should return 20x for meme coins', () => {
    expect(getAssetMaxLeverage('SHIB')).toBe(20);
    expect(getAssetMaxLeverage('PEPE')).toBe(20);
    expect(getAssetMaxLeverage('WIF')).toBe(20);
    expect(getAssetMaxLeverage('BONK')).toBe(20);
  });

  it('should return default 20x for unknown assets', () => {
    expect(getAssetMaxLeverage('UNKNOWN')).toBe(20);
    expect(getAssetMaxLeverage('NEWCOIN')).toBe(20);
  });
});

describe('Liquidation Protection - Leverage Validation', () => {
  it('should validate leverage within limits for BTC', () => {
    const result = validateLeverage('BTCUSD', 30);
    
    expect(result.valid).toBe(true);
    expect(result.maxLeverage).toBe(50);
    expect(result.adjustedLeverage).toBeUndefined();
  });

  it('should reject leverage exceeding max for BTC', () => {
    const result = validateLeverage('BTCUSD', 60);
    
    expect(result.valid).toBe(false);
    expect(result.maxLeverage).toBe(50);
    expect(result.adjustedLeverage).toBe(50);
  });

  it('should validate leverage within limits for SOL', () => {
    const result = validateLeverage('SOLUSD', 35);
    
    expect(result.valid).toBe(true);
    expect(result.maxLeverage).toBe(40);
  });

  it('should reject leverage exceeding max for SOL', () => {
    const result = validateLeverage('SOLUSD', 45);
    
    expect(result.valid).toBe(false);
    expect(result.maxLeverage).toBe(40);
    expect(result.adjustedLeverage).toBe(40);
  });

  it('should validate leverage for meme coins', () => {
    const result = validateLeverage('PEPE', 15);
    
    expect(result.valid).toBe(true);
    expect(result.maxLeverage).toBe(20);
  });

  it('should reject excessive leverage for meme coins', () => {
    const result = validateLeverage('SHIB', 25);
    
    expect(result.valid).toBe(false);
    expect(result.maxLeverage).toBe(20);
    expect(result.adjustedLeverage).toBe(20);
  });

  it('should handle edge case of 1x leverage', () => {
    const result = validateLeverage('BTCUSD', 1);
    
    expect(result.valid).toBe(true);
    expect(result.maxLeverage).toBe(50);
  });

  it('should handle edge case of max leverage exactly', () => {
    const result = validateLeverage('ETHUSD', 50);
    
    expect(result.valid).toBe(true);
    expect(result.maxLeverage).toBe(50);
  });
});

describe('Liquidation Protection - Edge Cases', () => {
  it('should handle zero account balance gracefully', () => {
    const result = canOpenPosition(0, [], 0.1, 50000);
    
    expect(result.canOpen).toBe(false);
  });

  it('should handle very small position sizes', () => {
    const position = {
      symbol: 'BTC',
      side: 'long' as const,
      size: 0.001,
      entryPrice: 50000,
      leverage: 10,
    };
    const risk = assessLiquidationRisk(position, 50000, 1000);
    
    expect(risk.riskLevel).toBe('safe');
  });

  it('should handle very large position sizes', () => {
    const position = {
      symbol: 'BTC',
      side: 'long' as const,
      size: 100,
      entryPrice: 50000,
      leverage: 20,
    };
    const risk = assessLiquidationRisk(position, 50000, 500000);
    
    expect(risk).toBeDefined();
    expect(risk.liquidationPrice).toBeGreaterThan(0);
  });

  it('should handle price at liquidation level', () => {
    const position = {
      symbol: 'BTC',
      side: 'long' as const,
      size: 1,
      entryPrice: 50000,
      leverage: 50,
    };
    const accountBalance = 1000;
    const risk = assessLiquidationRisk(position, 50000, accountBalance);
    const liqPrice = risk.liquidationPrice;
    
    const riskAtLiq = assessLiquidationRisk(position, liqPrice, accountBalance);
    
    expect(riskAtLiq.distanceToLiquidation).toBeLessThan(1);
    expect(riskAtLiq.riskLevel).toBe('critical');
  });
});

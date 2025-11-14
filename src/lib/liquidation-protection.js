/**
 * Hyperliquid Liquidation Risk Protection
 * Implements proper liquidation price calculation and risk monitoring
 * Based on Hyperliquid's perpetual futures margin system
 */
// Hyperliquid's tiered margin system
const MARGIN_TIERS = [
    {
        notionalMin: 0,
        notionalMax: 500000,
        initialMarginRate: 0.02, // 2% (50x max leverage)
        maintenanceMarginRate: 0.01, // 1%
        maintenanceDeduction: 0,
    },
    {
        notionalMin: 500000,
        notionalMax: 1000000,
        initialMarginRate: 0.03, // 3% (33x max leverage)
        maintenanceMarginRate: 0.015, // 1.5%
        maintenanceDeduction: 2500, // $2,500
    },
    {
        notionalMin: 1000000,
        notionalMax: Infinity,
        initialMarginRate: 0.05, // 5% (20x max leverage)
        maintenanceMarginRate: 0.025, // 2.5%
        maintenanceDeduction: 17500, // $17,500
    },
];
/**
 * Get margin tier based on notional position value
 */
export function getMarginTier(notionalValue) {
    for (const tier of MARGIN_TIERS) {
        if (notionalValue >= tier.notionalMin && notionalValue < tier.notionalMax) {
            return tier;
        }
    }
    return MARGIN_TIERS[MARGIN_TIERS.length - 1];
}
/**
 * Calculate liquidation price using Hyperliquid's formula
 * Formula: liq_price = price - side * margin_available / position_size / (1 - l * side)
 * where l = 1 / MAINTENANCE_LEVERAGE
 */
export function calculateLiquidationPrice(entryPrice, positionSize, side, marginAvailable) {
    const sideMultiplier = side === 'long' ? 1 : -1;
    const notionalValue = entryPrice * positionSize;
    const tier = getMarginTier(notionalValue);
    // Calculate maintenance leverage from maintenance margin rate
    const maintenanceLeverage = 1 / tier.maintenanceMarginRate;
    const l = 1 / maintenanceLeverage;
    // Hyperliquid's liquidation price formula
    const liquidationPrice = entryPrice -
        (sideMultiplier * marginAvailable) / positionSize / (1 - l * sideMultiplier);
    return liquidationPrice;
}
/**
 * Calculate maintenance margin requirement
 */
export function calculateMaintenanceMargin(notionalValue) {
    const tier = getMarginTier(notionalValue);
    const maintenanceMargin = notionalValue * tier.maintenanceMarginRate - tier.maintenanceDeduction;
    return {
        maintenanceMargin: Math.max(0, maintenanceMargin),
        maintenanceMarginRate: tier.maintenanceMarginRate,
    };
}
/**
 * Calculate initial margin requirement
 */
export function calculateInitialMargin(positionSize, markPrice, leverage) {
    return (positionSize * markPrice) / leverage;
}
/**
 * Assess liquidation risk for a position
 */
export function assessLiquidationRisk(position, currentPrice, accountBalance) {
    const notionalValue = position.size * position.entryPrice;
    const marginAvailable = accountBalance;
    // Calculate liquidation price
    const liquidationPrice = calculateLiquidationPrice(position.entryPrice, position.size, position.side, marginAvailable);
    // Calculate maintenance margin
    const { maintenanceMargin, maintenanceMarginRate } = calculateMaintenanceMargin(notionalValue);
    // Calculate distance to liquidation (percentage)
    const distanceToLiquidation = position.side === 'long'
        ? ((currentPrice - liquidationPrice) / currentPrice) * 100
        : ((liquidationPrice - currentPrice) / currentPrice) * 100;
    // Determine risk level
    let riskLevel;
    if (distanceToLiquidation > 20) {
        riskLevel = 'safe';
    }
    else if (distanceToLiquidation > 10) {
        riskLevel = 'warning';
    }
    else if (distanceToLiquidation > 5) {
        riskLevel = 'danger';
    }
    else {
        riskLevel = 'critical';
    }
    // Check if can open new positions (need at least 10% margin buffer)
    const marginUsagePercent = (maintenanceMargin / accountBalance) * 100;
    const canOpenPosition = marginUsagePercent < 80; // 80% threshold
    // Calculate max safe position size (using 50% of available balance)
    const maxSafePositionSize = (accountBalance * 0.5) / currentPrice;
    return {
        liquidationPrice,
        currentPrice,
        distanceToLiquidation,
        maintenanceMargin,
        maintenanceMarginRate,
        riskLevel,
        canOpenPosition,
        maxSafePositionSize,
    };
}
/**
 * Check if opening a new position would exceed safe margin limits
 */
export function canOpenPosition(accountBalance, existingPositions, newPositionSize, newPositionPrice) {
    // Calculate total notional value including new position
    let totalNotional = newPositionSize * newPositionPrice;
    for (const pos of existingPositions) {
        totalNotional += pos.size * pos.entryPrice;
    }
    // Calculate total maintenance margin required
    const { maintenanceMargin } = calculateMaintenanceMargin(totalNotional);
    // Check if account balance covers maintenance margin with buffer
    const marginUsagePercent = (maintenanceMargin / accountBalance) * 100;
    // ADDITIONAL CHECK: Prevent excessive leverage
    // Total notional should not exceed 10x account balance (conservative limit)
    const effectiveLeverage = totalNotional / accountBalance;
    if (effectiveLeverage > 10) {
        // Calculate max safe position size based on 10x leverage limit
        const maxSafeNotional = accountBalance * 10;
        const existingNotional = totalNotional - (newPositionSize * newPositionPrice);
        const maxNewNotional = maxSafeNotional - existingNotional;
        const maxSafeSize = maxNewNotional / newPositionPrice;
        return {
            canOpen: false,
            reason: `Excessive leverage: ${effectiveLeverage.toFixed(1)}x exceeds safe limit of 10x`,
            maxSafeSize: Math.max(0, maxSafeSize),
        };
    }
    if (marginUsagePercent > 90) {
        return {
            canOpen: false,
            reason: 'Insufficient margin: Would exceed 90% margin usage',
        };
    }
    if (marginUsagePercent > 80) {
        // Calculate max safe position size
        const maxSafeNotional = accountBalance * 0.8;
        const existingNotional = totalNotional - (newPositionSize * newPositionPrice);
        const maxNewNotional = maxSafeNotional - existingNotional;
        const maxSafeSize = maxNewNotional / newPositionPrice;
        return {
            canOpen: false,
            reason: 'Position size too large for safe margin levels',
            maxSafeSize: Math.max(0, maxSafeSize),
        };
    }
    return { canOpen: true };
}
/**
 * Get asset-specific max leverage (varies by asset on Hyperliquid)
 * Default values - should be fetched from Hyperliquid API in production
 */
export function getAssetMaxLeverage(symbol) {
    const maxLeverageMap = {
        'BTC': 50,
        'BTCUSD': 50,
        'BTCUSDC': 50,
        'ETH': 50,
        'ETHUSD': 50,
        'ETHUSDC': 50,
        'SOL': 40,
        'SOLUSD': 40,
        'SOLUSDC': 40,
        'DOGE': 25,
        'DOGEUSD': 25,
        'DOGEUSDC': 25,
        'SHIB': 20,
        'SHIBUSD': 20,
        'PEPE': 20,
        'PEPEUSD': 20,
        'WIF': 20,
        'WIFUSD': 20,
        'BONK': 20,
        'BONKUSD': 20,
        // Add more assets as needed
    };
    // Try exact match first
    if (maxLeverageMap[symbol]) {
        return maxLeverageMap[symbol];
    }
    // Try base symbol without USD/USDC suffix
    const baseSymbol = symbol.replace('USD', '').replace('USDC', '').replace('-PERP', '');
    return maxLeverageMap[baseSymbol] || 20; // Default to 20x
}
/**
 * Validate leverage against asset max leverage
 */
export function validateLeverage(symbol, requestedLeverage) {
    const maxLeverage = getAssetMaxLeverage(symbol);
    if (requestedLeverage > maxLeverage) {
        return {
            valid: false,
            maxLeverage,
            adjustedLeverage: maxLeverage,
        };
    }
    return { valid: true, maxLeverage };
}

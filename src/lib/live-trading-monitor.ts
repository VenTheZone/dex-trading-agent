/**
 * Live Trading Monitor
 * Provides active monitoring and execution of TP/SL, trailing stops, and liquidation protection
 * for live and testnet trading modes (mirrors paper trading engine features)
 */

import { pythonApi } from './python-api-client';
import { toast } from 'sonner';
import { assessLiquidationRisk } from './liquidation-protection';

export interface MonitoredPosition {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  leverage: number;
  stopLoss?: number;
  takeProfit?: number;
  trailingStopPercent?: number;
  trailingStopActivationPercent?: number;
  trailingStopActive?: boolean;
  trailingStopPrice?: number;
  highestPrice?: number;
  lowestPrice?: number;
}

export class LiveTradingMonitor {
  private positions: Map<string, MonitoredPosition> = new Map();
  private isMonitoring: boolean = false;
  private monitorInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL = 3000; // 3 seconds

  constructor() {}

  /**
   * Start monitoring positions
   */
  startMonitoring(onPositionClose: (symbol: string, reason: string, price: number) => Promise<void>) {
    if (this.isMonitoring) {
      console.warn('[Live Monitor] Already monitoring');
      return;
    }

    this.isMonitoring = true;
    console.info('[Live Monitor] Started monitoring positions');

    this.monitorInterval = setInterval(async () => {
      await this.checkPositions(onPositionClose);
    }, this.POLL_INTERVAL);
  }

  /**
   * Stop monitoring positions
   */
  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.isMonitoring = false;
    console.info('[Live Monitor] Stopped monitoring positions');
  }

  /**
   * Update or add a position to monitor
   */
  updatePosition(position: MonitoredPosition) {
    const existing = this.positions.get(position.symbol);
    
    // Preserve trailing stop state if updating existing position
    if (existing) {
      position.trailingStopActive = existing.trailingStopActive;
      position.trailingStopPrice = existing.trailingStopPrice;
      position.highestPrice = existing.highestPrice;
      position.lowestPrice = existing.lowestPrice;
    }

    this.positions.set(position.symbol, position);
    console.info(`[Live Monitor] Tracking ${position.symbol}: ${position.side} ${position.size} @ ${position.entryPrice}`);
  }

  /**
   * Remove a position from monitoring
   */
  removePosition(symbol: string) {
    this.positions.delete(symbol);
    console.info(`[Live Monitor] Stopped tracking ${symbol}`);
  }

  /**
   * Set trailing stop parameters for a position
   */
  setTrailingStop(symbol: string, trailingStopPercent: number, activationPercent: number) {
    const position = this.positions.get(symbol);
    if (position) {
      position.trailingStopPercent = trailingStopPercent;
      position.trailingStopActivationPercent = activationPercent;
      position.trailingStopActive = false;
      position.trailingStopPrice = undefined;
      console.info(`[Live Monitor] Trailing stop set for ${symbol}: ${trailingStopPercent}% (activates at ${activationPercent}% profit)`);
    }
  }

  /**
   * Check all monitored positions for TP/SL/trailing stop/liquidation triggers
   */
  private async checkPositions(onPositionClose: (symbol: string, reason: string, price: number) => Promise<void>) {
    for (const [symbol, position] of this.positions.entries()) {
      try {
        // Update price tracking
        if (!position.highestPrice || position.currentPrice > position.highestPrice) {
          position.highestPrice = position.currentPrice;
        }
        if (!position.lowestPrice || position.currentPrice < position.lowestPrice) {
          position.lowestPrice = position.currentPrice;
        }

        // Calculate current P&L
        const pnl = this.calculatePnl(position);
        const pnlPercent = (pnl / (position.entryPrice * position.size)) * 100;

        // LIQUIDATION RISK ASSESSMENT using Hyperliquid's formula
        // Note: We need account balance from the trading hook, so we'll estimate conservatively
        const estimatedBalance = (position.entryPrice * position.size) / position.leverage;
        const riskData = assessLiquidationRisk(
          {
            symbol: position.symbol,
            side: position.side,
            size: position.size,
            entryPrice: position.entryPrice,
            leverage: position.leverage,
          },
          position.currentPrice,
          estimatedBalance
        );

        // Critical liquidation warning
        if (riskData.riskLevel === 'critical') {
          toast.error(`🚨 CRITICAL: ${symbol} near liquidation!`, {
            description: `Liquidation at ${riskData.liquidationPrice.toFixed(2)} (${riskData.distanceToLiquidation.toFixed(1)}% away)`,
            duration: 10000,
          });

          await pythonApi.createTradingLog({
            action: 'liquidation_warning_critical',
            symbol,
            reason: `CRITICAL liquidation risk: ${riskData.distanceToLiquidation.toFixed(1)}% from liquidation price`,
            details: `Liq Price: ${riskData.liquidationPrice.toFixed(2)}, Current: ${position.currentPrice.toFixed(2)}, Maintenance Margin: ${(riskData.maintenanceMarginRate * 100).toFixed(2)}%`,
          });
        } else if (riskData.riskLevel === 'danger') {
          console.warn(`⚠️ ${symbol} liquidation risk: DANGER - ${riskData.distanceToLiquidation.toFixed(1)}% away`);
        }

        // Check trailing stop activation
        if (
          position.trailingStopPercent &&
          position.trailingStopActivationPercent &&
          !position.trailingStopActive &&
          pnlPercent >= position.trailingStopActivationPercent
        ) {
          position.trailingStopActive = true;
          this.updateTrailingStop(position);
          
          toast.info(`🎯 Trailing Stop Activated: ${symbol}`, {
            description: `Profit: ${pnlPercent.toFixed(2)}% - Stop will trail price movements`,
            duration: 5000,
          });

          await pythonApi.createTradingLog({
            action: 'trailing_stop_activated',
            symbol,
            reason: `Trailing stop activated at ${pnlPercent.toFixed(2)}% profit`,
            details: `Entry: ${position.entryPrice}, Current: ${position.currentPrice}, Trail: ${position.trailingStopPercent}%`,
          });
        }

        // Update trailing stop if active
        if (position.trailingStopActive) {
          const previousStop = position.trailingStopPrice;
          this.updateTrailingStop(position);
          
          if (previousStop && position.trailingStopPrice && position.trailingStopPrice !== previousStop) {
            console.info(`[Live Monitor] Trailing stop updated for ${symbol}: ${previousStop.toFixed(2)} → ${position.trailingStopPrice.toFixed(2)}`);
          }
        }

        // Check trailing stop trigger
        if (position.trailingStopActive && position.trailingStopPrice) {
          if (this.shouldTriggerTrailingStop(position)) {
            toast.warning(`🛑 Trailing Stop Triggered: ${symbol}`, {
              description: `Closing position at ${position.currentPrice.toFixed(2)}`,
              duration: 5000,
            });

            await pythonApi.createTradingLog({
              action: 'trailing_stop_triggered',
              symbol,
              reason: `Trailing stop triggered at ${position.currentPrice}`,
              details: `P&L: $${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`,
            });

            await onPositionClose(symbol, 'trailing_stop', position.currentPrice);
            this.removePosition(symbol);
            continue;
          }
        }

        // Check stop loss
        if (position.stopLoss && this.shouldTriggerStopLoss(position)) {
          toast.error(`🛑 Stop Loss Triggered: ${symbol}`, {
            description: `Closing position at ${position.currentPrice.toFixed(2)}`,
            duration: 5000,
          });

          await pythonApi.createTradingLog({
            action: 'stop_loss_triggered',
            symbol,
            reason: `Stop loss triggered at ${position.currentPrice}`,
            details: `SL: ${position.stopLoss}, P&L: $${pnl.toFixed(2)}`,
          });

          await onPositionClose(symbol, 'stop_loss', position.currentPrice);
          this.removePosition(symbol);
          continue;
        }

        // Check take profit
        if (position.takeProfit && this.shouldTriggerTakeProfit(position)) {
          toast.success(`✅ Take Profit Triggered: ${symbol}`, {
            description: `Closing position at ${position.currentPrice.toFixed(2)}`,
            duration: 5000,
          });

          await pythonApi.createTradingLog({
            action: 'take_profit_triggered',
            symbol,
            reason: `Take profit triggered at ${position.currentPrice}`,
            details: `TP: ${position.takeProfit}, P&L: $${pnl.toFixed(2)}`,
          });

          await onPositionClose(symbol, 'take_profit', position.currentPrice);
          this.removePosition(symbol);
          continue;
        }

      } catch (error: any) {
        console.error(`[Live Monitor] Error checking ${symbol}:`, error.message);
      }
    }
  }

  private calculatePnl(position: MonitoredPosition): number {
    const priceDiff = position.currentPrice - position.entryPrice;
    return position.side === 'long' ? priceDiff * position.size : -priceDiff * position.size;
  }

  private shouldTriggerStopLoss(position: MonitoredPosition): boolean {
    if (!position.stopLoss) return false;
    return position.side === 'long' 
      ? position.currentPrice <= position.stopLoss
      : position.currentPrice >= position.stopLoss;
  }

  private shouldTriggerTakeProfit(position: MonitoredPosition): boolean {
    if (!position.takeProfit) return false;
    return position.side === 'long'
      ? position.currentPrice >= position.takeProfit
      : position.currentPrice <= position.takeProfit;
  }

  private shouldTriggerTrailingStop(position: MonitoredPosition): boolean {
    if (!position.trailingStopPrice) return false;
    return position.side === 'long'
      ? position.currentPrice <= position.trailingStopPrice
      : position.currentPrice >= position.trailingStopPrice;
  }

  private updateTrailingStop(position: MonitoredPosition): void {
    if (!position.trailingStopPercent) return;

    const trailingDistance = position.currentPrice * (position.trailingStopPercent / 100);

    if (position.side === 'long') {
      const newTrailingStop = position.currentPrice - trailingDistance;
      if (!position.trailingStopPrice || newTrailingStop > position.trailingStopPrice) {
        position.trailingStopPrice = newTrailingStop;
      }
    } else {
      const newTrailingStop = position.currentPrice + trailingDistance;
      if (!position.trailingStopPrice || newTrailingStop < position.trailingStopPrice) {
        position.trailingStopPrice = newTrailingStop;
      }
    }
  }

  /**
   * Get current monitored positions
   */
  getMonitoredPositions(): MonitoredPosition[] {
    return Array.from(this.positions.values());
  }

  /**
   * Check if monitoring is active
   */
  isActive(): boolean {
    return this.isMonitoring;
  }
}

// Singleton instance
export const liveTradingMonitor = new LiveTradingMonitor();

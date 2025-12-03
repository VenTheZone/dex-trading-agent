/**
 * Live Trading Monitor
 * Provides active monitoring and execution of TP/SL, trailing stops, and liquidation protection
 * for live and testnet trading modes (mirrors paper trading engine features)
 */

import { pythonApi } from './python-api-client';
import { toast } from 'sonner';
import { assessLiquidationRisk } from './liquidation-protection';
import { storage } from './storage';
import { Position } from '@/store/tradingStore';
import { handleError, categorizeError, ERROR_MESSAGES } from './error-handler';

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

export interface PollingCallbacks {
  onPositionUpdate: (position: Position | null) => void;
  onBalanceUpdate: (balance: number) => void;
  onMarginWarning: (warningLevel: 'warning' | 'critical', message: string) => void;
}

export class LiveTradingMonitor {
  private positions: Map<string, MonitoredPosition> = new Map();
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL = 3000; // 3 seconds for monitoring checks
  private readonly POSITION_POLL_INTERVAL = 5000; // 5 seconds for API polling
  private onClosePosition: ((symbol: string, reason: string, price: number) => void) | null = null;
  private marginWarningShown: boolean = false;
  private consecutivePollErrors = 0;

  constructor() {}

  /**
   * Start monitoring positions for TP/SL/Trailing Stop
   */
  startMonitoring(onClosePosition: (symbol: string, reason: string, price: number) => void) {
    this.onClosePosition = onClosePosition;
    this.isMonitoring = true;

    if (this.monitoringInterval) return;
    
    this.monitoringInterval = setInterval(async () => {
      if (this.onClosePosition) {
        await this.checkPositions(this.onClosePosition);
      }
    }, this.POLL_INTERVAL);
    
    console.info('[Live Monitor] Started monitoring positions');
  }

  /**
   * Stop monitoring positions
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    this.onClosePosition = null;
    console.info('[Live Monitor] Stopped monitoring positions');
  }

  /**
   * Start polling for live positions from Hyperliquid
   */
  startPolling(
    callbacks: PollingCallbacks,
    network: 'mainnet' | 'testnet',
    settings: { leverage: number; useTrailingStop: boolean; stopLossPercent: number; takeProfitPercent: number }
  ) {
    if (this.pollingInterval) {
      // If already polling, just update the interval if needed, but for now we'll just return
      // Ideally we might want to update settings if they are used in polling
      return;
    }

    const pollPositions = async () => {
      try {
        const keys = storage.getApiKeys();
        if (!keys?.hyperliquid.apiSecret || !keys?.hyperliquid.walletAddress) return;

        const result = await pythonApi.getHyperliquidPositions(
          keys.hyperliquid.apiSecret,
          keys.hyperliquid.walletAddress,
          network === 'testnet'
        );

        if (result.success && result.data) {
          this.consecutivePollErrors = 0; // Reset error count on success

          // Update balance from margin summary
          if (result.data.marginSummary?.accountValue) {
            const accountValue = parseFloat(result.data.marginSummary.accountValue);
            callbacks.onBalanceUpdate(accountValue);
          }

          // Check margin usage and liquidation risk
          if (result.data.marginSummary) {
            const totalMarginUsed = parseFloat(result.data.marginSummary.totalMarginUsed || "0");
            const accountValue = parseFloat(result.data.marginSummary.accountValue || "0");
            
            if (accountValue > 0) {
              const marginUsagePercent = (totalMarginUsed / accountValue) * 100;
              
              // Liquidation warning at 80% margin usage
              if (marginUsagePercent >= 80) {
                if (!this.marginWarningShown) {
                  callbacks.onMarginWarning('critical', `⚠️ LIQUIDATION WARNING: ${marginUsagePercent.toFixed(1)}% margin usage! Auto-trading paused.`);
                  this.marginWarningShown = true;
                }
              } else if (marginUsagePercent < 70) {
                this.marginWarningShown = false;
              }
              
              // Warning at 60% margin usage
              if (marginUsagePercent >= 60 && marginUsagePercent < 80 && !this.marginWarningShown) {
                callbacks.onMarginWarning('warning', `⚠️ High margin usage: ${marginUsagePercent.toFixed(1)}%`);
              }
            }
          }

          // Update active positions
          if (result.data.assetPositions && result.data.assetPositions.length > 0) {
            const pos = result.data.assetPositions[0];
            const size = parseFloat(pos.position.szi);
            const entryPrice = parseFloat(pos.position.entryPx || "0");
            const unrealizedPnl = parseFloat(pos.position.unrealizedPnl || "0");
            const currentPrice = entryPrice + (unrealizedPnl / size);

            const currentPosition: Position = {
              symbol: pos.position.coin,
              size: Math.abs(size),
              entryPrice,
              currentPrice,
              pnl: unrealizedPnl,
              side: size > 0 ? 'long' : 'short',
              leverage: settings.leverage ?? 1,
              stopLoss: undefined,
              takeProfit: undefined,
            };

            callbacks.onPositionUpdate(currentPosition);

            // Update live trading monitor with current position and price
            this.updatePosition({
              symbol: currentPosition.symbol,
              side: currentPosition.side,
              size: currentPosition.size,
              entryPrice: currentPosition.entryPrice,
              currentPrice,
              leverage: currentPosition.leverage || 1,
              stopLoss: currentPosition.stopLoss,
              takeProfit: currentPosition.takeProfit,
            });

            // Set trailing stop if enabled
            if (settings.useTrailingStop) {
              this.setTrailingStop(
                currentPosition.symbol,
                settings.stopLossPercent / 2, // Trail at half of stop loss %
                settings.takeProfitPercent * 0.5 // Activate at 50% of TP target
              );
            }

            // Record position snapshot
            await pythonApi.recordPositionSnapshot({
              symbol: currentPosition.symbol,
              side: currentPosition.side,
              size: currentPosition.size,
              entry_price: currentPosition.entryPrice,
              current_price: currentPrice,
              unrealized_pnl: currentPosition.pnl,
              leverage: settings.leverage || 1,
              mode: 'live',
            }).catch((error: any) => {
              console.error("Failed to record position snapshot:", error);
            });
          } else {
            callbacks.onPositionUpdate(null);
            // Clear monitored positions when no active positions exist
            this.clearPositions();
          }
        }
      } catch (error) {
        this.consecutivePollErrors++;
        const categorized = categorizeError(error);
        
        // Only notify user if errors persist to avoid spamming on transient network glitches
        if (this.consecutivePollErrors >= 3 || !categorized.isRetryable) {
          handleError(error, {
            ...ERROR_MESSAGES.MONITORING_ERROR,
            description: `Failed to poll positions: ${categorized.message}`
          });
          
          // If not retryable (e.g. auth error), stop polling to prevent endless errors
          if (!categorized.isRetryable) {
            this.stopPolling();
          }
        } else {
          console.warn(`[Live Monitor] Polling error (${this.consecutivePollErrors}/3):`, categorized.message);
        }
      }
    };

    // Initial fetch
    pollPositions();
    
    // Start interval
    this.pollingInterval = setInterval(pollPositions, this.POSITION_POLL_INTERVAL);
    console.info('[Live Monitor] Started polling positions');
  }

  /**
   * Stop polling for positions
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    console.info('[Live Monitor] Stopped polling positions');
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
    // console.debug(`[Live Monitor] Tracking ${position.symbol}: ${position.side} ${position.size} @ ${position.entryPrice}`);
  }

  /**
   * Remove a position from monitoring
   */
  removePosition(symbol: string) {
    this.positions.delete(symbol);
    console.info(`[Live Monitor] Stopped tracking ${symbol}`);
  }

  /**
   * Clear all positions from monitoring
   */
  clearPositions() {
    this.positions.clear();
    console.info('[Live Monitor] Cleared all tracked positions');
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
  private async checkPositions(onClosePosition: (symbol: string, reason: string, price: number) => void) {
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

            await onClosePosition(symbol, 'trailing_stop', position.currentPrice);
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

          await onClosePosition(symbol, 'stop_loss', position.currentPrice);
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

          await onClosePosition(symbol, 'take_profit', position.currentPrice);
          this.removePosition(symbol);
          continue;
        }

      } catch (error: any) {
        handleError(error, {
          title: "Position Check Failed",
          description: `Failed to monitor ${symbol}. Risk protection may be compromised.`,
          logPrefix: `[Live Monitor] Error checking ${symbol}`
        });
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
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { storage } from "@/lib/storage";
import { useTradingStore } from "@/store/tradingStore";
import { toast } from "sonner";
import { useEffect, useRef } from "react";

export function useTrading() {
  const createLog = useMutation(api.tradingLogs.createLog);
  const recordBalance = useMutation(api.balanceHistory.recordBalance);
  const recordPositionSnapshot = useMutation(api.positionSnapshots.recordSnapshot);
  const analyzeMarket = useAction(api.trading.analyzeMarket);
  const analyzeMultiChart = useAction(api.trading.analyzeMultiChart);
  const executeLiveTrade = useAction(api.trading.executeLiveTrade);
  const getHyperliquidPositions = useAction(api.trading.getHyperliquidPositions);
  const { balance, settings, mode, network, chartType, chartInterval, setBalance, setPosition, isAutoTrading, setAutoTrading } = useTradingStore();
  const { user } = useAuth();
  const lastRecordedBalance = useRef(balance);
  const marginWarningShown = useRef(false);

  // Record balance changes
  useEffect(() => {
    if (user && balance !== lastRecordedBalance.current) {
      recordBalance({ balance, mode }).catch((error) => {
        console.error("Failed to record balance:", error);
      });
      lastRecordedBalance.current = balance;
    }
  }, [balance, mode, user, recordBalance]);

  // Poll for live positions if in live mode
  useEffect(() => {
    if (mode !== 'live' || !user) return;

    const pollPositions = async () => {
      try {
        const keys = storage.getApiKeys();
        if (!keys?.hyperliquid.apiSecret || !keys?.hyperliquid.walletAddress) return;

        const result = await getHyperliquidPositions({
          apiSecret: keys.hyperliquid.apiSecret,
          walletAddress: keys.hyperliquid.walletAddress,
          isTestnet: network === 'testnet',
        });

        if (result.success && result.positions) {
          // Update balance from margin summary
          if (result.positions.marginSummary?.accountValue) {
            const accountValue = parseFloat(result.positions.marginSummary.accountValue);
            setBalance(accountValue);
          }

          // Check margin usage and liquidation risk
          if (result.positions.marginSummary) {
            const totalMarginUsed = parseFloat(result.positions.marginSummary.totalMarginUsed || "0");
            const accountValue = parseFloat(result.positions.marginSummary.accountValue || "0");
            
            if (accountValue > 0) {
              const marginUsagePercent = (totalMarginUsed / accountValue) * 100;
              
              // Liquidation warning at 80% margin usage
              if (marginUsagePercent >= 80 && isAutoTrading) {
                if (!marginWarningShown.current) {
                  toast.error(
                    `⚠️ LIQUIDATION WARNING: ${marginUsagePercent.toFixed(1)}% margin usage! Auto-trading paused.`,
                    { duration: 10000 }
                  );
                  marginWarningShown.current = true;
                }
                setAutoTrading(false);
                
                await createLog({
                  action: "auto_pause",
                  symbol: "SYSTEM",
                  reason: `Auto-trading paused due to high margin usage: ${marginUsagePercent.toFixed(1)}%`,
                  details: `Total Margin Used: $${totalMarginUsed}, Account Value: $${accountValue}`,
                });
              } else if (marginUsagePercent < 70) {
                marginWarningShown.current = false;
              }
              
              // Warning at 60% margin usage
              if (marginUsagePercent >= 60 && marginUsagePercent < 80 && !marginWarningShown.current) {
                toast.warning(
                  `⚠️ High margin usage: ${marginUsagePercent.toFixed(1)}%`,
                  { duration: 5000 }
                );
              }
            }
          }

          // Update active positions
          if (result.positions.assetPositions && result.positions.assetPositions.length > 0) {
            const pos = result.positions.assetPositions[0];
            const size = parseFloat(pos.position.szi);
            const entryPrice = parseFloat(pos.position.entryPx || "0");
            const unrealizedPnl = parseFloat(pos.position.unrealizedPnl || "0");

            const currentPosition = {
              symbol: pos.position.coin,
              size: Math.abs(size),
              entryPrice,
              currentPrice: entryPrice + (unrealizedPnl / size),
              pnl: unrealizedPnl,
              side: size > 0 ? 'long' : 'short' as 'long' | 'short',
            };

            setPosition(currentPosition);

            // Record position snapshot
            await recordPositionSnapshot({
              symbol: currentPosition.symbol,
              side: currentPosition.side,
              size: currentPosition.size,
              entryPrice: currentPosition.entryPrice,
              currentPrice: currentPosition.currentPrice,
              unrealizedPnl: currentPosition.pnl,
              leverage: settings.leverage,
              mode,
            }).catch((error) => {
              console.error("Failed to record position snapshot:", error);
            });
          } else {
            setPosition(null);
          }
        }
      } catch (error) {
        console.error("Failed to fetch positions:", error);
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(pollPositions, 5000);
    pollPositions(); // Initial fetch

    return () => clearInterval(interval);
  }, [mode, network, user, getHyperliquidPositions, setBalance, setPosition, isAutoTrading, setAutoTrading, createLog, recordPositionSnapshot, settings.leverage]);

  const runAIAnalysis = async (symbol: string, currentPrice: number) => {
    try {
      toast.info("🤖 AI analyzing market...");
      
      const keys = storage.getApiKeys();
      if (!keys?.openRouter) {
        toast.error("OpenRouter API key not configured");
        return null;
      }

      // Prepare chart data description for AI
      const chartData = `
        Chart Type: ${chartType === 'range' ? 'Range Chart' : 'Time-based Chart'}
        Interval: ${chartInterval}
        Current Price: $${currentPrice}
        Leverage: ${settings.leverage}x ${settings.allowAILeverage ? '(AI can adjust)' : '(fixed)'}
        ${chartType === 'range' ? 
          'Range Analysis: Price movement analyzed by range bars (fixed price movements) rather than time intervals. This provides clearer trend identification and reduces noise from time-based volatility.' : 
          'Time Analysis: Price movement analyzed by fixed time intervals.'
        }
      `;
      
      const analysis = await analyzeMarket({
        symbol,
        chartData,
        userBalance: balance,
        settings: {
          takeProfitPercent: settings.takeProfitPercent,
          stopLossPercent: settings.stopLossPercent,
          useAdvancedStrategy: settings.useAdvancedStrategy,
        },
      });
      
      toast.success("✅ AI analysis complete");
      return analysis;
    } catch (error: any) {
      toast.error(`AI Analysis failed: ${error.message}`);
      throw error;
    }
  };

  const runMultiChartAIAnalysis = async (charts: Array<{ symbol: string; currentPrice: number }>) => {
    try {
      toast.info("🤖 AI analyzing multiple charts...");
      
      const keys = storage.getApiKeys();
      if (!keys?.openRouter) {
        toast.error("OpenRouter API key not configured");
        return null;
      }

      // Prepare multi-chart data for AI
      const multiChartData = charts.map(chart => ({
        symbol: chart.symbol,
        currentPrice: chart.currentPrice,
        chartType: chartType,
        chartInterval: chartInterval,
      }));

      const analysis = await analyzeMultiChart({
        charts: multiChartData,
        userBalance: balance,
        settings: {
          takeProfitPercent: settings.takeProfitPercent,
          stopLossPercent: settings.stopLossPercent,
          useAdvancedStrategy: settings.useAdvancedStrategy,
          leverage: settings.leverage,
          allowAILeverage: settings.allowAILeverage,
        },
      });
      
      toast.success("✅ Multi-chart AI analysis complete");
      return analysis;
    } catch (error: any) {
      toast.error(`Multi-chart AI Analysis failed: ${error.message}`);
      throw error;
    }
  };

  const executeTrade = async (
    symbol: string,
    action: string,
    side: "long" | "short" | undefined,
    price: number,
    size: number,
    stopLoss: number | undefined,
    takeProfit: number | undefined,
    reasoning: string
  ) => {
    try {
      if (mode === "live") {
        const keys = storage.getApiKeys();
        if (!keys?.hyperliquid.apiSecret) {
          toast.error("Hyperliquid API keys not configured");
          return;
        }

        toast.info(`📡 Executing live trade on ${network}...`);
        
        const result = await executeLiveTrade({
          apiSecret: keys.hyperliquid.apiSecret,
          symbol,
          side: side === 'long' ? 'buy' : 'sell',
          size,
          price,
          stopLoss,
          takeProfit,
          leverage: settings.leverage,
          isTestnet: network === 'testnet',
        });

        if (!result.success) {
          throw new Error(result.error || "Trade execution failed");
        }

        toast.success(`✅ Live trade executed on ${network}`);
      } else {
        // Paper trading
        toast.info("📄 Executing paper trade...");
      }

      // Log the trade
      await createLog({
        action,
        symbol,
        side,
        price,
        size,
        reason: reasoning,
        details: stopLoss 
          ? `SL: ${stopLoss}, TP: ${takeProfit}, Leverage: ${settings.leverage}x, Network: ${network}, Chart: ${chartType} ${chartInterval}` 
          : `Leverage: ${settings.leverage}x, Network: ${network}, Chart: ${chartType} ${chartInterval}`,
      });

      toast.success(`Trade executed: ${action.toUpperCase()}`);
    } catch (error: any) {
      toast.error(`Trade execution failed: ${error.message}`);
      throw error;
    }
  };

  return {
    runAIAnalysis,
    runMultiChartAIAnalysis,
    executeTrade,
  };
}
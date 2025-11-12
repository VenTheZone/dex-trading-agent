import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { storage } from "@/lib/storage";
import { useTradingStore } from "@/store/tradingStore";
import { toast } from "sonner";
import { useEffect, useRef } from "react";

export function useTrading() {
  const createLog = useMutation((api as any).tradingLogs.createLog);
  const recordBalance = useMutation((api as any).balanceHistory.recordBalance);
  const recordPositionSnapshot = useMutation((api as any).positionSnapshots.recordSnapshot);
  const analyzeMarket = useAction((api as any).trading.analyzeMarket);
  const analyzeMultiChart = useAction((api as any).trading.analyzeMultiChart);
  const executeLiveTrade = useAction((api as any).trading.executeLiveTrade);
  const getHyperliquidPositions = useAction((api as any).trading.getHyperliquidPositions);
  const { balance, settings, mode, network, chartType, chartInterval, setBalance, setPosition, position, isAutoTrading, setAutoTrading } = useTradingStore();
  const { user } = useAuth();
  const lastRecordedBalance = useRef(balance);
  const marginWarningShown = useRef(false);
  const isRecordingBalance = useRef(false);

  // Record balance changes with debouncing to prevent race conditions
  useEffect(() => {
    if (user && balance !== lastRecordedBalance.current && !isRecordingBalance.current) {
      isRecordingBalance.current = true;
      recordBalance({ balance, mode })
        .then(() => {
          lastRecordedBalance.current = balance;
        })
        .catch((error) => {
          console.error("Failed to record balance:", error);
        })
        .finally(() => {
          isRecordingBalance.current = false;
        });
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
        // Don't show toast on every poll error to avoid spam
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(pollPositions, 5000);
    pollPositions(); // Initial fetch

    return () => clearInterval(interval);
  }, [mode, network, user, getHyperliquidPositions, setBalance, setPosition, isAutoTrading, setAutoTrading, createLog, recordPositionSnapshot, settings.leverage]);

  const closePosition = async (positionToClose: typeof position) => {
    if (!positionToClose) {
      toast.error("No position to close");
      return;
    }

    try {
      toast.info(`Closing ${positionToClose.symbol} position...`);

      if (mode === "live") {
        const keys = storage.getApiKeys();
        if (!keys?.hyperliquid.apiSecret) {
          toast.error("Hyperliquid API keys not configured");
          return;
        }

        const result = await executeLiveTrade({
          apiSecret: keys.hyperliquid.apiSecret,
          symbol: positionToClose.symbol,
          side: positionToClose.side === 'long' ? 'sell' : 'buy',
          size: positionToClose.size,
          price: positionToClose.currentPrice,
          leverage: settings.leverage,
          isTestnet: network === 'testnet',
        });

        if (!result.success) {
          throw new Error(result.error || "Failed to close position");
        }

        toast.success(`✅ Position closed on ${network}`);
      } else {
        toast.success("📄 Paper position closed");
      }

      await createLog({
        action: "close_position",
        symbol: positionToClose.symbol,
        side: positionToClose.side,
        price: positionToClose.currentPrice,
        size: positionToClose.size,
        reason: "Manual close",
        details: `P&L: $${positionToClose.pnl.toFixed(2)}, Mode: ${mode}, Network: ${network}`,
      });

      // Update balance with P&L
      setBalance(balance + positionToClose.pnl);
      setPosition(null);

      return { success: true };
    } catch (error: any) {
      toast.error(`Failed to close position: ${error.message}`);
      throw error;
    }
  };

  const closeAllPositions = async () => {
    try {
      if (!position) {
        toast.info("No open positions to close");
        return;
      }

      const confirmed = window.confirm(
        `⚠️ Close all positions?\n\n` +
        `This will close your ${position.symbol} ${position.side} position.\n` +
        `Current P&L: $${position.pnl.toFixed(2)}\n\n` +
        `Are you sure?`
      );

      if (!confirmed) return;

      toast.info("Closing all positions...");
      await closePosition(position);
      toast.success("✅ All positions closed");

      return { success: true };
    } catch (error: any) {
      toast.error(`Failed to close all positions: ${error.message}`);
      throw error;
    }
  };

  const runAIAnalysis = async (symbol: string, currentPrice: number) => {
    try {
      const isDemoMode = storage.isDemoMode();
      
      if (isDemoMode) {
        toast.info("[DEMO] 🤖 AI analyzing market with DeepSeek V3.1...");
      } else {
        toast.info("🤖 AI analyzing market...");
      }

      const chartData = `
        Chart Type: ${chartType === 'range' ? 'Range Chart' : 'Time-based Chart'}
        Interval: ${chartInterval}
        Current Price: ${currentPrice}
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
        isDemoMode,
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
      const isDemoMode = storage.isDemoMode();
      
      if (isDemoMode) {
        toast.info("[DEMO] 🤖 AI analyzing multiple charts with DeepSeek V3.1...");
      } else {
        toast.info("🤖 AI analyzing multiple charts...");
      }
      
      const allowedCoins = settings.allowedCoins || [];
      const filteredCharts = charts.filter(chart => 
        allowedCoins.length === 0 || allowedCoins.includes(chart.symbol)
      );

      if (filteredCharts.length === 0) {
        toast.error("No allowed coins selected for trading");
        return null;
      }

      const multiChartData = filteredCharts.map(chart => ({
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
        isDemoMode,
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
    reasoning: string,
    skipConfirmation: boolean = false
  ) => {
    try {
      const allowedCoins = settings.allowedCoins || [];
      if (allowedCoins.length > 0 && !allowedCoins.includes(symbol)) {
        toast.error(`${symbol} is not in your allowed coins list`);
        return;
      }

      // Return trade details for confirmation modal if not skipping
      if (!skipConfirmation) {
        return {
          requiresConfirmation: true,
          tradeDetails: {
            symbol,
            action,
            side,
            price,
            size,
            stopLoss,
            takeProfit,
            leverage: settings.leverage,
            mode,
            network,
            reasoning,
          },
        };
      }

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
        toast.info("📄 Executing paper trade...");
      }

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
      return { success: true };
    } catch (error: any) {
      toast.error(`Trade execution failed: ${error.message}`);
      throw error;
    }
  };

  // Real-time auto-trading loop
  useEffect(() => {
    if (!isAutoTrading || !user) return;

    const runAutoTrading = async () => {
      try {
        const isDemoMode = storage.isDemoMode();
        
        // Demo mode: Use real AI with DeepSeek V3.1 free tier
        if (isDemoMode) {
          const allowedCoins = settings.allowedCoins || [];
          if (allowedCoins.length === 0) {
            console.log("[DEMO] No allowed coins selected, skipping auto-trading");
            return;
          }

          // Fetch real market data for demo mode
          const chartData = await Promise.all(
            allowedCoins.map(async (symbol) => {
              try {
                const response = await fetch(
                  `https://api.binance.com/api/v3/ticker/price?symbol=${symbol.replace('USD', 'USDT')}`
                );
                const data = await response.json();
                return {
                  symbol,
                  currentPrice: parseFloat(data.price),
                };
              } catch (error) {
                console.error(`[DEMO] Failed to fetch price for ${symbol}:`, error);
                return null;
              }
            })
          );

          const validCharts = chartData.filter((chart) => chart !== null) as Array<{
            symbol: string;
            currentPrice: number;
          }>;

          if (validCharts.length === 0) {
            console.log("[DEMO] No valid market data, skipping auto-trading");
            return;
          }

          // Run real AI analysis with DeepSeek V3.1 free tier
          const analysis = await runMultiChartAIAnalysis(validCharts);

          if (!analysis) {
            console.log("[DEMO] AI analysis returned no recommendation");
            return;
          }

          // Execute simulated trade based on AI recommendation
          if (analysis.action === "open_long" || analysis.action === "open_short") {
            const side = analysis.action === "open_long" ? "long" : "short";
            
            await executeTrade(
              analysis.recommendedSymbol || validCharts[0].symbol,
              analysis.action,
              side,
              analysis.entryPrice,
              analysis.positionSize,
              analysis.stopLoss,
              analysis.takeProfit,
              `[DEMO] ${analysis.reasoning}`,
              true
            );
          } else if (analysis.action === "close" && position) {
            await executeTrade(
              position.symbol,
              "close_position",
              position.side,
              position.currentPrice,
              position.size,
              undefined,
              undefined,
              `[DEMO] ${analysis.reasoning}`,
              true
            );
          }
          
          return;
        }

        // Live/Paper mode: Requires OpenRouter API key
        const keys = storage.getApiKeys();
        if (!keys?.openRouter) {
          console.log("OpenRouter API key not configured, skipping auto-trading");
          return;
        }

        // Get current prices for all allowed coins
        const allowedCoins = settings.allowedCoins || [];
        if (allowedCoins.length === 0) {
          console.log("No allowed coins selected, skipping auto-trading");
          return;
        }

        // Fetch current market data for allowed coins
        const chartData = await Promise.all(
          allowedCoins.map(async (symbol) => {
            try {
              const response = await fetch(
                `https://api.binance.com/api/v3/ticker/price?symbol=${symbol.replace('USD', 'USDT')}`
              );
              const data = await response.json();
              return {
                symbol,
                currentPrice: parseFloat(data.price),
              };
            } catch (error) {
              console.error(`Failed to fetch price for ${symbol}:`, error);
              return null;
            }
          })
        );

        const validCharts = chartData.filter((chart) => chart !== null) as Array<{
          symbol: string;
          currentPrice: number;
        }>;

        if (validCharts.length === 0) {
          console.log("No valid market data, skipping auto-trading");
          return;
        }

        // Run multi-chart AI analysis
        const analysis = await runMultiChartAIAnalysis(validCharts);

        if (!analysis) {
          console.log("AI analysis returned no recommendation");
          return;
        }

        // Execute trade based on AI recommendation
        if (analysis.action === "open_long" || analysis.action === "open_short") {
          const side = analysis.action === "open_long" ? "long" : "short";
          
          await executeTrade(
            analysis.recommendedSymbol || validCharts[0].symbol,
            analysis.action,
            side,
            analysis.entryPrice,
            analysis.positionSize,
            analysis.stopLoss,
            analysis.takeProfit,
            analysis.reasoning
          );
        } else if (analysis.action === "close" && position) {
          await executeTrade(
            position.symbol,
            "close_position",
            position.side,
            position.currentPrice,
            position.size,
            undefined,
            undefined,
            analysis.reasoning
          );
        }
      } catch (error) {
        console.error("Auto-trading error:", error);
      }
    };

    // Run immediately on enable
    runAutoTrading();

    // Then run every 2 minutes while auto-trading is enabled
    const interval = setInterval(runAutoTrading, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAutoTrading, user, settings.allowedCoins, position, balance, settings, chartType, chartInterval, mode, network]);

  return {
    runAIAnalysis,
    runMultiChartAIAnalysis,
    executeTrade,
    closePosition,
    closeAllPositions,
  };
}
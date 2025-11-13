import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { storage } from "@/lib/storage";
import { useTradingStore } from "@/store/tradingStore";
import { toast } from "sonner";
import { useEffect, useRef, useCallback } from "react";

export function useTrading() {
  const createLog = useMutation((api as any).tradingLogs.createLog);
  const recordBalance = useMutation((api as any).balanceHistory.recordBalance);
  const recordPositionSnapshot = useMutation((api as any).positionSnapshots.recordSnapshot);
  const analyzeMarket = useAction((api as any).trading.analyzeMarket);
  const analyzeMultiChart = useAction((api as any).trading.analyzeMultiChart);
  const executeLiveTrade = useAction((api as any).trading.executeLiveTrade);
  const getHyperliquidPositions = useAction((api as any).trading.getHyperliquidPositions);
  const fetchPriceWithFallback = useAction((api as any).marketData.fetchPriceWithFallback);
  const { balance, settings, mode, network, chartType, chartInterval, setBalance, setPosition, position, isAutoTrading, setAutoTrading, aiModel, customPrompt } = useTradingStore();
  const { user } = useAuth();
  const lastRecordedBalance = useRef(balance);
  const marginWarningShown = useRef(false);
  const isRecordingBalance = useRef(false);
  const balanceRecordTimeout = useRef<NodeJS.Timeout | null>(null);

  // Record balance changes with debouncing to prevent race conditions
  useEffect(() => {
    if (!user) return;
    
    // Clear existing timeout
    if (balanceRecordTimeout.current) {
      clearTimeout(balanceRecordTimeout.current);
    }
    
    // Only record if balance changed significantly (more than $0.01)
    if (Math.abs(balance - lastRecordedBalance.current) < 0.01) {
      return;
    }
    
    // Debounce balance recording by 2 seconds
    balanceRecordTimeout.current = setTimeout(() => {
      if (isRecordingBalance.current) return;
      
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
    }, 2000);
    
    return () => {
      if (balanceRecordTimeout.current) {
        clearTimeout(balanceRecordTimeout.current);
      }
    };
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

  const closePosition = useCallback(async (positionToClose: typeof position) => {
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
  }, [mode, network, settings.leverage, balance, executeLiveTrade, createLog, setBalance, setPosition]);

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
      const keys = storage.getApiKeys();
      const hasOpenRouterKey = keys?.openRouter && keys.openRouter !== 'DEMO_MODE';
      
      const modelName = aiModel === 'qwen/qwen-2.5-72b-instruct' ? 'Qwen' : 'DeepSeek';
      
      if (isDemoMode) {
        if (hasOpenRouterKey) {
          toast.info(`[DEMO] 🤖 AI analyzing with your OpenRouter key (${modelName})...`);
        } else {
          toast.info(`[DEMO] 🤖 AI analyzing market with ${modelName} Free...`);
        }
      } else {
        toast.info(`🤖 AI analyzing market with ${modelName}...`);
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
        aiModel,
        customPrompt,
      });
      
      toast.success(`✅ AI analysis complete: ${analysis.action.toUpperCase()}`);
      
      // Log the AI decision for transparency
      await createLog({
        action: "ai_analysis",
        symbol,
        reason: `AI Decision: ${analysis.action} (Confidence: ${analysis.confidence}%)`,
        details: analysis.reasoning,
      });
      
      return analysis;
    } catch (error: any) {
      toast.error(`❌ AI Analysis failed: ${error.message}`);
      
      // Log the error for debugging
      await createLog({
        action: "ai_error",
        symbol,
        reason: `AI Analysis Error: ${error.message}`,
        details: `Model: ${aiModel}, Demo: ${storage.isDemoMode()}`,
      });
      
      throw error;
    }
  };

  const runMultiChartAIAnalysis = async (charts: Array<{ symbol: string; currentPrice: number }>) => {
    try {
      const isDemoMode = storage.isDemoMode();
      const keys = storage.getApiKeys();
      const hasOpenRouterKey = keys?.openRouter && keys.openRouter !== 'DEMO_MODE';
      
      const modelName = aiModel === 'qwen/qwen-2.5-72b-instruct' ? 'Qwen' : 'DeepSeek';
      
      if (isDemoMode) {
        if (hasOpenRouterKey) {
          toast.info(`[DEMO] 🤖 AI analyzing multiple charts with your OpenRouter key (${modelName})...`);
        } else {
          toast.info(`[DEMO] 🤖 AI analyzing multiple charts with ${modelName} Free...`);
        }
      } else {
        toast.info(`🤖 AI analyzing multiple charts with ${modelName}...`);
      }
      
      const allowedCoins = settings.allowedCoins || [];
      const filteredCharts = charts.filter(chart => 
        allowedCoins.length === 0 || allowedCoins.includes(chart.symbol)
      );

      if (filteredCharts.length === 0) {
        toast.error("❌ No allowed coins selected for trading");
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
        aiModel,
        customPrompt,
      });
      
      toast.success(`✅ Multi-chart AI analysis complete: ${analysis.action.toUpperCase()}`);
      
      // Log the AI decision for transparency
      await createLog({
        action: "ai_multi_analysis",
        symbol: analysis.recommendedSymbol || "MULTI",
        reason: `AI Decision: ${analysis.action} on ${analysis.recommendedSymbol} (Confidence: ${analysis.confidence}%)`,
        details: `${analysis.reasoning}\n\nMarket Context: ${analysis.marketContext || 'N/A'}`,
      });
      
      return analysis;
    } catch (error: any) {
      toast.error(`❌ Multi-chart AI Analysis failed: ${error.message}`);
      
      // Log the error for debugging
      await createLog({
        action: "ai_error",
        symbol: "MULTI",
        reason: `Multi-chart AI Analysis Error: ${error.message}`,
        details: `Model: ${aiModel}, Demo: ${storage.isDemoMode()}, Charts: ${charts.length}`,
      });
      
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

  // Real-time auto-trading loop with improved error handling
  useEffect(() => {
    if (!isAutoTrading || !user) return;

    console.log('[AUTO-TRADING] Loop started', {
      isAutoTrading,
      user: user?._id,
      mode,
      allowedCoins: settings.allowedCoins,
      timestamp: new Date().toISOString()
    });

    let isActive = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const runAutoTrading = async () => {
      if (!isActive) return;
      
      console.log('[AUTO-TRADING] Cycle starting...', {
        mode,
        isDemoMode: storage.isDemoMode(),
        allowedCoins: settings.allowedCoins,
        aiModel,
      });
      
      try {
        const isDemoMode = storage.isDemoMode();
        const allowedCoins = settings.allowedCoins || [];
        
        console.log('[AUTO-TRADING] Validation check', {
          isDemoMode,
          allowedCoinsCount: allowedCoins.length,
          allowedCoins,
        });
        
        // Validation checks with detailed feedback
        if (allowedCoins.length === 0) {
          toast.error("❌ Auto-trading paused: No coins selected", {
            description: "Please select at least 1 coin in Trading Controls",
            duration: 5000,
          });
          
          await createLog({
            action: "auto_pause",
            symbol: "SYSTEM",
            reason: "Auto-trading paused: No allowed coins selected",
            details: "User must select at least one coin for AI trading",
          });
          
          setAutoTrading(false);
          return;
        }
        
        // Validate AI model
        const validModels = ['deepseek/deepseek-chat', 'qwen/qwen-2.5-72b-instruct'];
        if (!validModels.includes(aiModel)) {
          toast.error("❌ Invalid AI model selected", {
            description: "Resetting to default model",
          });
          return;
        }
        
        // Demo mode: Use real AI with DeepSeek V3.1 (free tier or paid if API key provided)
        if (isDemoMode) {
          const keys = storage.getApiKeys();
          const hasOpenRouterKey = keys?.openRouter && keys.openRouter !== 'DEMO_MODE';
          
          console.log('[AUTO-TRADING] Demo mode detected', {
            hasOpenRouterKey,
            coinsToFetch: allowedCoins,
          });
          
          toast.info(`[DEMO] 🔄 Auto-trading cycle started (${allowedCoins.length} coins)`, {
            description: hasOpenRouterKey ? "Using your OpenRouter key" : "Using DeepSeek Free tier",
          });

          // Fetch real market data using Convex action (bypasses CORS)
          console.log('[AUTO-TRADING] Fetching prices for coins:', allowedCoins);
          
          const chartDataPromises = allowedCoins.map(async (symbol) => {
            try {
              console.log(`[AUTO-TRADING] Fetching price for ${symbol}...`);
              const price = await fetchPriceWithFallback({ 
                symbol,
                isTestnet: network === 'testnet'
              });
              console.log(`[AUTO-TRADING] Price fetched for ${symbol}: ${price}`);
              return {
                symbol,
                currentPrice: price,
              };
            } catch (error) {
              console.error(`[AUTO-TRADING] Failed to fetch price for ${symbol}:`, error);
              return null;
            }
          });

          const chartData = await Promise.all(chartDataPromises);
          const validCharts = chartData.filter((chart): chart is { symbol: string; currentPrice: number } => chart !== null);

          console.log('[AUTO-TRADING] Price fetch results', {
            totalCoins: allowedCoins.length,
            successfulFetches: validCharts.length,
            validCharts,
          });

          if (validCharts.length === 0) {
            toast.error("❌ Auto-trading paused: No market data available", {
              description: `Failed to fetch prices for ${allowedCoins.join(', ')}. Check console for details.`,
              duration: 5000,
            });
            
            await createLog({
              action: "auto_pause",
              symbol: "SYSTEM",
              reason: "Auto-trading paused: No valid market data",
              details: `Failed to fetch prices for all selected coins: ${allowedCoins.join(', ')}. Binance API may be unavailable or symbols may be incorrect.`,
            });
            
            return;
          }

          // Log successful data fetch
          if (validCharts.length < allowedCoins.length) {
            const failedCoins = allowedCoins.filter(
              coin => !validCharts.find(chart => chart.symbol === coin)
            );
            toast.warning(`⚠️ Some prices unavailable: ${failedCoins.join(', ')}`, {
              description: `Trading with ${validCharts.length} available coins`,
            });
          }

          // Run real AI analysis with DeepSeek V3.1 free tier
          console.log('[AUTO-TRADING] Running AI analysis with charts:', validCharts);
          
          const analysis = await runMultiChartAIAnalysis(validCharts);

          console.log('[AUTO-TRADING] AI analysis result:', analysis);

          if (!analysis) {
            toast.warning("⚠️ AI returned no recommendation", {
              description: "Waiting for next cycle...",
            });
            return;
          }

          // Execute simulated trade based on AI recommendation
          if (analysis.action === "open_long" || analysis.action === "open_short") {
            const side = analysis.action === "open_long" ? "long" : "short";
            
            toast.info(`[DEMO] 📊 AI recommends ${side.toUpperCase()} on ${analysis.recommendedSymbol}`, {
              description: `Confidence: ${analysis.confidence}%`,
            });
            
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
            toast.info(`[DEMO] 📊 AI recommends closing ${position.symbol}`, {
              description: `Confidence: ${analysis.confidence}%`,
            });
            
            await closePosition(position);
          } else {
            toast.info(`[DEMO] 📊 AI recommends: ${analysis.action.toUpperCase()}`, {
              description: analysis.reasoning.substring(0, 100) + "...",
            });
          }
          
          return;
        }

        // Live/Paper mode: Requires OpenRouter API key
        const keys = storage.getApiKeys();
        if (!keys?.openRouter || keys.openRouter === 'DEMO_MODE') {
          toast.error("❌ Auto-trading paused: OpenRouter API key required", {
            description: "Configure your API key in Settings",
            duration: 5000,
          });
          
          await createLog({
            action: "auto_pause",
            symbol: "SYSTEM",
            reason: "Auto-trading paused: OpenRouter API key not configured",
            details: "Live/Paper mode requires a valid OpenRouter API key",
          });
          
          setAutoTrading(false);
          return;
        }

        toast.info(`🔄 Auto-trading cycle started (${allowedCoins.length} coins)`);

        // Fetch current market data using Convex action (bypasses CORS)
        const chartDataPromises = allowedCoins.map(async (symbol) => {
          try {
            const price = await fetchPriceWithFallback({ 
              symbol,
              isTestnet: network === 'testnet'
            });
            return {
              symbol,
              currentPrice: price,
            };
          } catch (error) {
            console.error(`Failed to fetch price for ${symbol}:`, error);
            return null;
          }
        });

        const chartData = await Promise.all(chartDataPromises);
        const validCharts = chartData.filter((chart) => chart !== null) as Array<{
          symbol: string;
          currentPrice: number;
        }>;

        if (validCharts.length === 0) {
          toast.error("❌ Auto-trading paused: No market data available", {
            description: `Failed to fetch prices for ${allowedCoins.join(', ')}. Check console for details.`,
            duration: 5000,
          });
          
          await createLog({
            action: "auto_pause",
            symbol: "SYSTEM",
            reason: "Auto-trading paused: No valid market data",
            details: `Failed to fetch prices for all selected coins: ${allowedCoins.join(', ')}. Binance API may be unavailable or symbols may be incorrect.`,
          });
          
          return;
        }

        // Log successful data fetch
        if (validCharts.length < allowedCoins.length) {
          const failedCoins = allowedCoins.filter(
            coin => !validCharts.find(chart => chart.symbol === coin)
          );
          toast.warning(`⚠️ Some prices unavailable: ${failedCoins.join(', ')}`, {
            description: `Trading with ${validCharts.length} available coins`,
          });
        }

        // Run multi-chart AI analysis
        const analysis = await runMultiChartAIAnalysis(validCharts);

        if (!analysis) {
          toast.warning("⚠️ AI returned no recommendation", {
            description: "Waiting for next cycle...",
          });
          return;
        }

        // Execute trade based on AI recommendation
        if (analysis.action === "open_long" || analysis.action === "open_short") {
          const side = analysis.action === "open_long" ? "long" : "short";
          
          toast.info(`📊 AI recommends ${side.toUpperCase()} on ${analysis.recommendedSymbol}`, {
            description: `Confidence: ${analysis.confidence}%`,
          });
          
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
          toast.info(`📊 AI recommends closing ${position.symbol}`, {
            description: `Confidence: ${analysis.confidence}%`,
          });
          
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
        } else {
          toast.info(`📊 AI recommends: ${analysis.action.toUpperCase()}`, {
            description: analysis.reasoning.substring(0, 100) + "...",
          });
        }
      } catch (error: any) {
        if (!isActive) return; // Don't show errors if component unmounted
        
        console.error('[AUTO-TRADING] Error in auto-trading loop:', {
          error: error.message,
          stack: error.stack,
          mode,
          isDemoMode: storage.isDemoMode(),
        });
        
        toast.error(`❌ Auto-trading error: ${error.message}`, {
          description: "Check Trading Logs for details",
          duration: 5000,
        });
        
        await createLog({
          action: "auto_error",
          symbol: "SYSTEM",
          reason: `Auto-trading error: ${error.message}`,
          details: `Stack: ${error.stack || 'N/A'}`,
        }).catch(err => console.error("Failed to log error:", err));
      }
    };

    // Run immediately on enable
    runAutoTrading();

    // Then run every 2 minutes while auto-trading is enabled
    const scheduleNext = () => {
      if (isActive) {
        timeoutId = setTimeout(() => {
          runAutoTrading().then(scheduleNext);
        }, 2 * 60 * 1000);
      }
    };
    scheduleNext();

    return () => {
      isActive = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isAutoTrading, user, settings.allowedCoins, position, balance, settings, chartType, chartInterval, mode, network, aiModel, customPrompt, fetchPriceWithFallback, setAutoTrading, createLog, closePosition]);

  return {
    runAIAnalysis,
    runMultiChartAIAnalysis,
    executeTrade,
    closePosition,
    closeAllPositions,
  };
}
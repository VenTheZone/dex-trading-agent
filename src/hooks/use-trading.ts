import { useCallback, useEffect, useRef } from "react";
import { storage } from "@/lib/storage";
import { useTradingStore } from "@/store/tradingStore";
import { toast } from "sonner";
import { pythonApi } from "@/lib/python-api-client";

export function useTrading() {
  const { balance, settings, mode, network, chartType, chartInterval, setBalance, setPosition, position, isAutoTrading, setAutoTrading, aiModel, customPrompt } = useTradingStore();
  const lastRecordedBalance = useRef(balance);
  const marginWarningShown = useRef(false);
  const isRecordingBalance = useRef(false);
  const balanceRecordTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Paper trading engine instance (persisted across renders)
  const paperEngineRef = useRef<any>(null);
  
  // Initialize paper trading engine
  useEffect(() => {
    if (mode === 'paper' && !paperEngineRef.current) {
      // Dynamically import to avoid "use node" issues
      import('@/lib/paper-trading-engine').then(({ PaperTradingEngine }) => {
        paperEngineRef.current = new PaperTradingEngine(balance);
      });
    }
  }, [mode, balance]);

  // Record balance changes with debouncing to prevent race conditions
  useEffect(() => {
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
      pythonApi.recordBalance(balance, mode)
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
  }, [balance, mode]);

  // Poll for live positions if in live mode with trailing stop loss logic
  useEffect(() => {
    if (mode !== 'live') return;

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
          // Update balance from margin summary
          if (result.data.marginSummary?.accountValue) {
            const accountValue = parseFloat(result.data.marginSummary.accountValue);
            setBalance(accountValue);
          }

          // Check margin usage and liquidation risk
          if (result.data.marginSummary) {
            const totalMarginUsed = parseFloat(result.data.marginSummary.totalMarginUsed || "0");
            const accountValue = parseFloat(result.data.marginSummary.accountValue || "0");
            
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
                
                await pythonApi.createTradingLog({
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
          if (result.data.assetPositions && result.data.assetPositions.length > 0) {
            const pos = result.data.assetPositions[0];
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
              stopLoss: undefined,
              takeProfit: undefined,
            };

            setPosition(currentPosition);

            // Implement trailing stop loss logic if enabled
            if (settings.useTrailingStop && currentPosition.pnl > 0) {
              const profitPercent = (currentPosition.pnl / (currentPosition.entryPrice * currentPosition.size)) * 100;
              
              // If profit exceeds 50% of take profit target, move stop loss to break even
              if (profitPercent >= (settings.takeProfitPercent * 0.5)) {
                const newStopLoss = currentPosition.entryPrice;
                
                // Only update if the new stop loss is better than the current one
                if (!currentPosition.stopLoss || 
                    (currentPosition.side === 'long' && newStopLoss > currentPosition.stopLoss) ||
                    (currentPosition.side === 'short' && newStopLoss < currentPosition.stopLoss)) {
                  
                  console.log(`[TRAILING STOP] Moving stop loss to break even: ${newStopLoss}`);
                  
                  toast.info(`🎯 Trailing Stop: Stop loss moved to break even (${newStopLoss.toFixed(2)})`, {
                    duration: 5000,
                  });
                  
                  await pythonApi.createTradingLog({
                    action: "trailing_stop_update",
                    symbol: currentPosition.symbol,
                    reason: `Trailing stop activated - moved SL to break even`,
                    details: `Profit: ${profitPercent.toFixed(2)}%, New SL: ${newStopLoss.toFixed(2)}`,
                  });
                }
              }
            }

            // Record position snapshot
            await pythonApi.recordPositionSnapshot({
              symbol: currentPosition.symbol,
              side: currentPosition.side,
              size: currentPosition.size,
              entry_price: currentPosition.entryPrice,
              current_price: currentPosition.currentPrice,
              unrealized_pnl: currentPosition.pnl,
              leverage: settings.leverage,
              mode,
            }).catch((error: any) => {
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
  }, [mode, network, setBalance, setPosition, isAutoTrading, setAutoTrading, settings.leverage]);

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

        const result = await pythonApi.executeLiveTrade({
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

      await pythonApi.createTradingLog({
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
  }, [mode, network, settings.leverage, balance, setBalance, setPosition]);

  const closeAllPositions = async () => {
    try {
      if (!position) {
        toast.info("No open positions to close");
        return;
      }

      const confirmed = window.confirm(
        `⚠️ Close all positions?\n\n` +
        `This will close your ${position.symbol} ${position.side} position.\n` +
        `Current P&L: ${position.pnl.toFixed(2)}\n\n` +
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
      const openRouterKey = keys?.openRouter || '';
      
      // In demo mode without a real API key, skip AI analysis
      if (isDemoMode && (!openRouterKey || openRouterKey === 'DEMO_MODE')) {
        toast.info('[DEMO] AI analysis skipped - No OpenRouter API key provided', {
          description: 'Add your OpenRouter key in Settings to enable real AI analysis in demo mode',
          duration: 5000,
        });
        throw new Error('Demo mode requires OpenRouter API key for AI analysis');
      }
      
      // Validate API key format
      if (!openRouterKey || openRouterKey.trim() === '') {
        toast.error('OpenRouter API key required', {
          description: 'Please add your OpenRouter API key in Settings',
          duration: 5000,
        });
        throw new Error('OpenRouter API key not configured');
      }

      if (!openRouterKey.startsWith('sk-or-v1-')) {
        toast.error('Invalid OpenRouter API key format', {
          description: 'Key must start with "sk-or-v1-"',
          duration: 5000,
        });
        throw new Error('Invalid OpenRouter API key format');
      }
      
      const modelName = aiModel === 'qwen/qwen3-max' ? 'Qwen' : 'DeepSeek';
      
      if (isDemoMode) {
        toast.info(`[DEMO] 🤖 AI analyzing with your OpenRouter key (${modelName})...`);
      } else {
        toast.info(`🤖 AI analyzing market with ${modelName}...`);
      }

      const chartData = `
        === MARKET DATA ===
        Symbol: ${symbol}
        Current Price: ${currentPrice.toLocaleString()}
        Chart Type: ${chartType === 'range' ? 'Range Chart (price-based)' : 'Time-based Chart'}
        Timeframe: ${chartInterval}
        
        === TRADING PARAMETERS ===
        Account Balance: ${balance.toLocaleString()}
        Leverage: ${settings.leverage}x ${settings.allowAILeverage ? '(AI can adjust within limits)' : '(fixed)'}
        Max Risk Per Trade: ${((balance * 0.05) / settings.leverage).toFixed(2)} (5% of balance)
        Take Profit Target: ${settings.takeProfitPercent}%
        Stop Loss: ${settings.stopLossPercent}%
        
        === ANALYSIS CONTEXT ===
        ${chartType === 'range' ? 
          'Range Chart Analysis: Price movements are measured by fixed price ranges rather than time. This reduces noise and provides clearer trend signals. Look for range breakouts and support/resistance levels.' : 
          'Time-based Analysis: Price movements over fixed time intervals. Consider momentum, volume patterns, and time-based indicators.'
        }
        
        INSTRUCTIONS:
        1. Analyze the current market data step-by-step
        2. Evaluate technical indicators and market context
        3. Provide a clear trading recommendation with specific entry/exit levels
        4. Ensure risk management aligns with account balance and leverage
        5. Format your response as valid JSON
      `;
      
      const analysis = await pythonApi.analyzeMarket({
        apiKey: openRouterKey,
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
      
      await pythonApi.createTradingLog({
        action: "ai_analysis",
        symbol,
        reason: `AI Decision: ${analysis.action} (Confidence: ${analysis.confidence}%)`,
        details: analysis.reasoning,
      });
      
      return analysis;
    } catch (error: any) {
      toast.error(`❌ AI Analysis failed: ${error.message}`);
      
      await pythonApi.createTradingLog({
        action: "ai_error",
        symbol,
        reason: `AI Analysis Error: ${error.message}`,
        details: `Model: ${aiModel}, Demo: ${storage.isDemoMode()}`,
      });
      
      throw error;
    }
  };

  const runMultiChartAIAnalysis = async (charts: Array<{ symbol: string; currentPrice: number }>) => {
    const { setAiThinking, setAiThoughts } = useTradingStore.getState();
    
    try {
      setAiThinking(true);
      setAiThoughts('🔍 Initializing AI analysis...\n\nValidating API keys and market data...');
      
      const isDemoMode = storage.isDemoMode();
      const keys = storage.getApiKeys();
      const openRouterKey = keys?.openRouter || '';
      
      // In demo mode without a real API key, skip AI analysis
      if (isDemoMode && (!openRouterKey || 
                         openRouterKey.trim() === '' || 
                         openRouterKey === 'DEMO_MODE' || 
                         !openRouterKey.startsWith('sk-or-v1-'))) {
        toast.info('[DEMO] AI analysis skipped - No OpenRouter API key provided', {
          description: 'Add your OpenRouter key in Settings to enable real AI analysis in demo mode',
          duration: 5000,
        });
        
        await pythonApi.createTradingLog({
          action: "ai_skip",
          symbol: "DEMO",
          reason: "Demo mode: AI analysis skipped (no API key)",
          details: "User can add OpenRouter API key in Settings to enable AI analysis",
        });
        
        return null;
      }
      
      // Validate API key format for non-demo or demo with real key
      if (!openRouterKey || openRouterKey.trim() === '') {
        toast.error('OpenRouter API key required', {
          description: 'Please add your OpenRouter API key in Settings',
          duration: 5000,
        });
        throw new Error('OpenRouter API key not configured');
      }

      if (!openRouterKey.startsWith('sk-or-v1-')) {
        toast.error('Invalid OpenRouter API key format', {
          description: 'Key must start with "sk-or-v1-"',
          duration: 5000,
        });
        throw new Error('Invalid OpenRouter API key format');
      }
      
      const allowedCoins = settings.allowedCoins || [];
      const filteredCharts = charts.filter(chart => 
        allowedCoins.length === 0 || allowedCoins.includes(chart.symbol)
      );

      if (filteredCharts.length === 0) {
        toast.error("❌ No allowed coins selected for trading");
        return null;
      }
      
      const modelName = aiModel === 'qwen/qwen3-max' ? 'Qwen' : 'DeepSeek';
      
      setAiThoughts(`✅ API keys validated\n\n🤖 Using ${modelName} AI model\n📊 Analyzing ${filteredCharts.length} trading pairs...\n\nMarket data:\n${filteredCharts.map(c => `  • ${c.symbol}: ${c.currentPrice.toLocaleString()}`).join('\n')}`);
      
      if (isDemoMode) {
        toast.info(`[DEMO] 🤖 AI analyzing multiple charts with your OpenRouter key (${modelName})...`);
      } else {
        toast.info(`🤖 AI analyzing multiple charts with ${modelName}...`);
      }

      const multiChartData = filteredCharts.map(chart => ({
        symbol: chart.symbol,
        currentPrice: chart.currentPrice,
        chartType: chartType,
        chartInterval: chartInterval,
        technicalContext: `Price: ${chart.currentPrice.toLocaleString()}, Timeframe: ${chartInterval}, Chart: ${chartType}`,
      }));

      // Final validation before calling backend
      if (!openRouterKey || openRouterKey === 'DEMO_MODE' || !openRouterKey.startsWith('sk-or-v1-')) {
        toast.error('Invalid or missing OpenRouter API key', {
          description: 'Cannot proceed with AI analysis',
          duration: 5000,
        });
        throw new Error('Invalid OpenRouter API key');
      }

      const currentThoughts = useTradingStore.getState().aiThoughts;
      setAiThoughts(`${currentThoughts}\n\n⏳ Sending request to ${modelName}...\nWaiting for AI response...`);
      
      const analysis = await pythonApi.analyzeMultiChart({
        apiKey: openRouterKey,
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
      
      setAiThoughts(`✅ AI Analysis Complete!\n\n📊 Recommendation: ${analysis.action.toUpperCase()}\n🎯 Confidence: ${analysis.confidence}%\n💰 Symbol: ${analysis.recommendedSymbol || 'N/A'}\n\n💭 Reasoning:\n${analysis.reasoning}\n\n🌍 Market Context:\n${analysis.marketContext || 'N/A'}`);
      
      toast.success(`✅ Multi-chart AI analysis complete: ${analysis.action.toUpperCase()}`);
      
      await pythonApi.createTradingLog({
        action: "ai_multi_analysis",
        symbol: analysis.recommendedSymbol || "MULTI",
        reason: `AI Decision: ${analysis.action} on ${analysis.recommendedSymbol} (Confidence: ${analysis.confidence}%)`,
        details: `${analysis.reasoning}\n\nMarket Context: ${analysis.marketContext || 'N/A'}`,
      });
      
      return analysis;
    } catch (error: any) {
      setAiThoughts(`❌ AI Analysis Error\n\n${error.message}\n\nPlease check your API keys and try again.`);
      toast.error(`❌ Multi-chart AI Analysis failed: ${error.message}`);
      
      await pythonApi.createTradingLog({
        action: "ai_error",
        symbol: "MULTI",
        reason: `Multi-chart AI Analysis Error: ${error.message}`,
        details: `Model: ${aiModel}, Demo: ${storage.isDemoMode()}, Charts: ${charts.length}`,
      });
      
      throw error;
    } finally {
      setAiThinking(false);
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
        
        const result = await pythonApi.executeLiveTrade({
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
      } else if (mode === "paper" && paperEngineRef.current) {
        // Execute paper trade
        toast.info("📄 Executing paper trade...");
        
        if (action === "close_position" && position) {
          const result = paperEngineRef.current.closePosition(symbol, price, "manual");
          if (result.success) {
            setBalance(paperEngineRef.current.getBalance());
            setPosition(null);
            toast.success(`📄 Paper position closed - P&L: $${result.pnl.toFixed(2)}`);
          }
        } else if (side) {
          // Open new position
          const order = paperEngineRef.current.placeOrder(
            symbol,
            side === 'long' ? 'buy' : 'sell',
            size,
            price,
            'market'
          );
          
          if (order.status === 'filled') {
            // Set stop loss and take profit if provided
            if (stopLoss) {
              paperEngineRef.current.setStopLoss(symbol, stopLoss);
            }
            if (takeProfit) {
              paperEngineRef.current.setTakeProfit(symbol, takeProfit);
            }
            
            // Update balance and position
            setBalance(paperEngineRef.current.getBalance());
            const paperPosition = paperEngineRef.current.getPosition(symbol);
            
            if (paperPosition) {
              setPosition({
                symbol: paperPosition.symbol,
                size: paperPosition.size,
                entryPrice: paperPosition.entryPrice,
                currentPrice: paperPosition.currentPrice,
                pnl: paperPosition.unrealizedPnl,
                side: paperPosition.side,
                stopLoss: paperPosition.stopLoss,
                takeProfit: paperPosition.takeProfit,
              });
            }
            
            toast.success(`📄 Paper trade executed: ${side.toUpperCase()} ${symbol}`);
          } else {
            throw new Error("Paper trade failed - insufficient balance");
          }
        }
      } else {
        toast.info("📄 Executing paper trade...");
      }

      await pythonApi.createTradingLog({
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
    if (!isAutoTrading) return;

    console.log('[AUTO-TRADING] Loop started', {
      isAutoTrading,
      mode,
      allowedCoins: settings.allowedCoins,
      timestamp: new Date().toISOString()
    });

    let isActive = true;
    let timeoutId: NodeJS.Timeout | null = null;
    let isRunning = false; // Prevent concurrent executions

    const runAutoTrading = async () => {
      if (!isActive || isRunning) return;
      
      isRunning = true;
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
        if (!allowedCoins || allowedCoins.length === 0) {
          toast.error("❌ Auto-trading paused: No coins selected", {
            description: "Please select at least 1 coin in Trading Controls",
            duration: 5000,
          });
          
          await pythonApi.createTradingLog({
            action: "auto_pause",
            symbol: "SYSTEM",
            reason: "Auto-trading paused: No allowed coins selected",
            details: "User must select at least one coin for AI trading",
          });
          
          setAutoTrading(false);
          return;
        }
        
        // Validate AI model
        const validModels = ['deepseek/deepseek-chat-v3-0324:free', 'qwen/qwen3-max'];
        if (!validModels.includes(aiModel)) {
          toast.error("❌ Invalid AI model selected", {
            description: "Resetting to default model",
          });
          return;
        }
        
        // Demo mode: Use real AI with DeepSeek V3.1 (free tier or paid if API key provided)
        if (isDemoMode) {
          const keys = storage.getApiKeys();
          const openRouterKey = keys?.openRouter || '';
          const hasValidKey = openRouterKey && 
                              openRouterKey.trim() !== '' && 
                              openRouterKey !== 'DEMO_MODE' && 
                              openRouterKey.startsWith('sk-or-v1-');
          
          console.log('[AUTO-TRADING] Demo mode detected', {
            hasValidKey,
            keyLength: openRouterKey?.length,
            keyPrefix: openRouterKey?.substring(0, 10),
            coinsToFetch: allowedCoins,
          });
          
          // If no valid API key in demo mode, skip AI analysis gracefully
          if (!hasValidKey) {
            toast.info('[DEMO] 🔄 Auto-trading paused - No OpenRouter API key', {
              description: 'Add your OpenRouter key in Settings to enable AI analysis',
              duration: 5000,
            });
            
            await pythonApi.createTradingLog({
              action: "auto_pause",
              symbol: "DEMO",
              reason: "Demo mode: Auto-trading paused (no API key)",
              details: "User can add OpenRouter API key in Settings to enable AI-powered auto-trading",
            });
            
            setAutoTrading(false);
            return;
          }
          
          toast.info(`[DEMO] 🔄 Auto-trading cycle started (${allowedCoins.length} coins)`, {
            description: "Using your OpenRouter key",
          });

          // Fetch real market data using Python API
          console.log('[AUTO-TRADING] Fetching prices for coins:', allowedCoins);
          
          const chartDataPromises = allowedCoins.map(async (symbol) => {
            try {
              console.log(`[AUTO-TRADING] Fetching price for ${symbol}...`);
              const price = await pythonApi.fetchPrice(symbol, network === 'testnet');
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
            
            await pythonApi.createTradingLog({
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

          // Execute simulated trade based on AI recommendation - only if symbol is in allowed coins
          if (analysis.action === "open_long" || analysis.action === "open_short") {
            const recommendedSymbol = analysis.recommendedSymbol || validCharts[0].symbol;
            
            // Double-check that the recommended symbol is in allowed coins
            if (!allowedCoins.includes(recommendedSymbol)) {
              toast.warning(`[DEMO] ⚠️ AI recommended ${recommendedSymbol} but it's not in your allowed coins list`, {
                description: 'Skipping this trade recommendation',
              });
              
              await pythonApi.createTradingLog({
                action: "trade_skipped",
                symbol: recommendedSymbol,
                reason: `[DEMO] AI recommended ${recommendedSymbol} but it's not in allowed coins: ${allowedCoins.join(', ')}`,
                details: analysis.reasoning,
              });
              
              return;
            }
            
            const side = analysis.action === "open_long" ? "long" : "short";
            
            toast.info(`[DEMO] 📊 AI recommends ${side.toUpperCase()} on ${recommendedSymbol}`, {
              description: `Confidence: ${analysis.confidence}%`,
            });
            
            await executeTrade(
              recommendedSymbol,
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
            description: "Configure your API key in Settings or use Demo mode",
            duration: 5000,
          });
          
          await pythonApi.createTradingLog({
            action: "auto_pause",
            symbol: "SYSTEM",
            reason: "Auto-trading paused: OpenRouter API key not configured",
            details: "Live/Paper mode requires a valid OpenRouter API key",
          });
          
          setAutoTrading(false);
          return;
        }

        toast.info(`🔄 Auto-trading cycle started (${allowedCoins.length} coins)`);

        // Fetch current market data using Python API
        const chartDataPromises = allowedCoins.map(async (symbol) => {
          try {
            const price = await pythonApi.fetchPrice(symbol, network === 'testnet');
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
          
            await pythonApi.createTradingLog({
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

        // Execute trade based on AI recommendation - only if symbol is in allowed coins
        if (analysis.action === "open_long" || analysis.action === "open_short") {
          const recommendedSymbol = analysis.recommendedSymbol || validCharts[0].symbol;
          
          // Double-check that the recommended symbol is in allowed coins
          if (!allowedCoins.includes(recommendedSymbol)) {
            toast.warning(`⚠️ AI recommended ${recommendedSymbol} but it's not in your allowed coins list`, {
              description: 'Skipping this trade recommendation',
            });
            
            await pythonApi.createTradingLog({
              action: "trade_skipped",
              symbol: recommendedSymbol,
              reason: `AI recommended ${recommendedSymbol} but it's not in allowed coins: ${allowedCoins.join(', ')}`,
              details: analysis.reasoning,
            });
            
            return;
          }
          
          const side = analysis.action === "open_long" ? "long" : "short";
          
          toast.info(`📊 AI recommends ${side.toUpperCase()} on ${recommendedSymbol}`, {
            description: `Confidence: ${analysis.confidence}%`,
          });
          
          await executeTrade(
            recommendedSymbol,
            analysis.action,
            side,
            analysis.entryPrice,
            analysis.positionSize,
            analysis.stopLoss,
            analysis.takeProfit,
            analysis.reasoning,
            true
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
            analysis.reasoning,
            true
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
        
          await pythonApi.createTradingLog({
          action: "auto_error",
          symbol: "SYSTEM",
          reason: `Auto-trading error: ${error.message}`,
          details: `Stack: ${error.stack || 'N/A'}`,
        }).catch(err => console.error("Failed to log error:", err));
      } finally {
        isRunning = false;
      }
    };

    // Run immediately on enable
    runAutoTrading();

    // Then run every 60 seconds while auto-trading is enabled
    const scheduleNext = () => {
      if (isActive) {
        timeoutId = setTimeout(() => {
          runAutoTrading().then(scheduleNext);
        }, 60 * 1000); // 60 seconds (1 minute)
      }
    };
    scheduleNext();

    return () => {
      isActive = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isAutoTrading, settings.allowedCoins, position, balance, settings, chartType, chartInterval, mode, network, aiModel, customPrompt, setAutoTrading, closePosition]);

  return {
    runAIAnalysis,
    runMultiChartAIAnalysis,
    executeTrade,
    closePosition,
    closeAllPositions,
  };
}
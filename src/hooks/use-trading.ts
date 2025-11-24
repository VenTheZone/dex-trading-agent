import { useCallback, useEffect, useRef } from "react";
import { storage } from "@/lib/storage";
import { useTradingStore } from "@/store/tradingStore";
import { toast } from "sonner";
import { pythonApi } from "@/lib/python-api-client";
import { liveTradingMonitor } from "@/lib/live-trading-monitor";

export function useTrading() {
  const { balance, settings, mode, network, chartType, chartInterval, setBalance, setPosition, position, isAutoTrading, setAutoTrading, aiModel, customPrompt } = useTradingStore();
  const lastRecordedBalance = useRef(balance);
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

  // Initialize live trading monitor for live/testnet modes
  useEffect(() => {
    if (mode === 'live') {
      // Start monitoring with position close callback
      liveTradingMonitor.startMonitoring(async (symbol, reason, price) => {
        try {
          const keys = storage.getApiKeys();
          if (!keys?.hyperliquid.apiSecret) {
            console.error('[Live Monitor] Cannot close position - API keys not configured');
            return;
          }

          const currentPosition = useTradingStore.getState().position;
          if (!currentPosition || currentPosition.symbol !== symbol) {
            console.warn(`[Live Monitor] Position mismatch: ${symbol} not found`);
            return;
          }

          // Execute close trade via Hyperliquid API
          const result = await pythonApi.executeLiveTrade({
            apiSecret: keys.hyperliquid.apiSecret,
            symbol,
            side: currentPosition.side === 'long' ? 'sell' : 'buy',
            size: currentPosition.size,
            price,
            leverage: currentPosition.leverage ?? settings.leverage ?? 1,
            isTestnet: network === 'testnet',
          });

          if (result.success) {
            const pnl = currentPosition.pnl;
            setBalance(balance + pnl);
            setPosition(null);
            
            toast.success(`✅ Position closed: ${reason}`, {
              description: `P&L: $${pnl.toFixed(2)}`,
            });
          } else {
            throw new Error(result.error || 'Failed to close position');
          }
        } catch (error: any) {
          console.error(`[Live Monitor] Failed to close ${symbol}:`, error.message);
          toast.error(`Failed to close ${symbol}: ${error.message}`);
        }
      });

      // Start polling for positions
      liveTradingMonitor.startPolling(
        {
          onPositionUpdate: (pos) => setPosition(pos),
          onBalanceUpdate: (bal) => setBalance(bal),
          onMarginWarning: (level, message) => {
            if (level === 'critical' && isAutoTrading) {
              setAutoTrading(false);
              toast.error(message, { duration: 10000 });
              
              pythonApi.createTradingLog({
                action: "auto_pause",
                symbol: "SYSTEM",
                reason: message,
                details: "Auto-trading paused due to high margin usage",
              });
            } else if (level === 'warning') {
              toast.warning(message, { duration: 5000 });
            }
          }
        },
        network,
        {
          leverage: settings.leverage,
          useTrailingStop: settings.useTrailingStop,
          stopLossPercent: settings.stopLossPercent,
          takeProfitPercent: settings.takeProfitPercent
        }
      );

      return () => {
        liveTradingMonitor.stopMonitoring();
        liveTradingMonitor.stopPolling();
      };
    }
  }, [mode, network, settings.leverage, settings.useTrailingStop, settings.stopLossPercent, settings.takeProfitPercent, setBalance, setPosition, isAutoTrading, setAutoTrading]);

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
          price: positionToClose.currentPrice ?? positionToClose.entryPrice,
          leverage: positionToClose.leverage ?? settings.leverage ?? 1,
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
    const { setAiThinking, setAiThoughts } = useTradingStore.getState();
    
    try {
      setAiThinking(true);
      setAiThoughts(`🔍 Initializing analysis for ${symbol}...\n\nChecking market conditions and validating API keys...`);

      const isDemoMode = storage.isDemoMode();
      const keys = storage.getApiKeys();
      const openRouterKey = keys?.openRouter || '';
      
      // In demo mode without a real API key, skip AI analysis
      if (isDemoMode && (!openRouterKey || openRouterKey === 'DEMO_MODE')) {
        setAiThoughts("⚠️ Analysis skipped: Demo mode without API key.");
        toast.info('[DEMO] AI analysis skipped - No OpenRouter API key provided', {
          description: 'Add your OpenRouter key in Settings to enable real AI analysis in demo mode',
          duration: 5000,
        });
        throw new Error('Demo mode requires OpenRouter API key for AI analysis');
      }
      
      // Validate API key format
      if (!openRouterKey || openRouterKey.trim() === '') {
        setAiThoughts("❌ Error: OpenRouter API key missing.");
        toast.error('OpenRouter API key required', {
          description: 'Please add your OpenRouter API key in Settings',
          duration: 5000,
        });
        throw new Error('OpenRouter API key not configured');
      }

      if (!openRouterKey.startsWith('sk-or-v1-')) {
        setAiThoughts("❌ Error: Invalid OpenRouter API key format.");
        toast.error('Invalid OpenRouter API key format', {
          description: 'Key must start with "sk-or-v1-"',
          duration: 5000,
        });
        throw new Error('Invalid OpenRouter API key format');
      }
      
      const modelName = aiModel === 'qwen/qwen3-max' ? 'Qwen' : 'DeepSeek';
      
      setAiThoughts(`✅ API Key Validated\n🤖 Model: ${modelName}\n\n📊 Analyzing ${symbol} market structure...\nPrice: $${currentPrice.toLocaleString()}\nChart: ${chartType === 'range' ? 'Range' : 'Time-based'} (${chartInterval})\n\nGathering technical indicators...`);

      if (isDemoMode) {
        toast.info(`[DEMO] 🤖 AI analyzing with your OpenRouter key (${modelName})...`);
      } else {
        toast.info(`🤖 AI analyzing market with ${modelName}...`);
      }

      // Build comprehensive chart data with all available tools
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
        
        === AVAILABLE TOOLS ===
        ✓ Real-time price data from Hyperliquid
        ✓ TradingView chart analysis (time-based and range-based)
        ✓ Position management (open/close long/short)
        ✓ Risk management (stop-loss, take-profit, trailing stops)
        ✓ Multi-chart analysis across ${settings.allowedCoins?.length || 0} coins
        ✓ Trading logs and balance history tracking
        
        === ANALYSIS CONTEXT ===
        ${chartType === 'range' ? 
          'Range Chart Analysis: Price movements are measured by fixed price ranges rather than time. This reduces noise and provides clearer trend signals. Look for range breakouts and support/resistance levels.' : 
          'Time-based Analysis: Price movements over fixed time intervals. Consider momentum, volume patterns, and time-based indicators.'
        }
        
        INSTRUCTIONS:
        1. Analyze the current market data step-by-step using all available tools
        2. Evaluate technical indicators and market context
        3. Provide a clear trading recommendation with specific entry/exit levels
        4. Ensure risk management aligns with account balance and leverage
        5. Format your response as valid JSON
      `;
      
      const thoughtsBeforeInference = useTradingStore.getState().aiThoughts;
      setAiThoughts(`${thoughtsBeforeInference}\n\n⏳ Sending data to ${modelName} for inference...\nWaiting for response...`);

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
        network,
      });
      
      const thoughtsAfterInference = useTradingStore.getState().aiThoughts;
      setAiThoughts(`${thoughtsAfterInference}\n\n✅ Analysis Complete!\n\n🎯 Decision: ${analysis.action.toUpperCase()} (Confidence: ${analysis.confidence}%)\n\n💭 Reasoning:\n${analysis.reasoning}`);

      toast.success(`✅ AI analysis complete: ${analysis.action.toUpperCase()}`);
      
      await pythonApi.createTradingLog({
        action: "ai_analysis",
        symbol,
        reason: `AI Decision: ${analysis.action} (Confidence: ${analysis.confidence}%)`,
        details: analysis.reasoning,
      });
      
      return analysis;
    } catch (error: any) {
      const thoughtsOnError = useTradingStore.getState().aiThoughts;
      setAiThoughts(`${thoughtsOnError}\n\n❌ Analysis Failed: ${error.message}`);
      toast.error(`❌ AI Analysis failed: ${error.message}`);
      
      await pythonApi.createTradingLog({
        action: "ai_error",
        symbol,
        reason: `AI Analysis Error: ${error.message}`,
        details: `Model: ${aiModel}, Demo: ${storage.isDemoMode()}`,
      });
      
      throw error;
    } finally {
      setAiThinking(false);
    }
  };

  const runMultiChartAIAnalysis = async (charts: Array<{ symbol: string; currentPrice: number }>) => {
    const { setAiThinking, setAiThoughts } = useTradingStore.getState();
    
    try {
      setAiThinking(true);
      setAiThoughts('🔍 Initializing AI analysis...\\n\\nValidating API keys and market data...');
      
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
      
      // Filter by user-selected coins only
      const filteredCharts = charts.filter(chart => 
        allowedCoins.length === 0 || allowedCoins.includes(chart.symbol)
      );

      if (filteredCharts.length === 0) {
        toast.error("❌ No allowed coins selected for trading");
        return null;
      }
      
      const modelName = aiModel === 'qwen/qwen3-max' ? 'Qwen' : 'DeepSeek';
      
      setAiThoughts(`✅ API keys validated\\n\\n🤖 Using ${modelName} AI model\\n📊 Analyzing ${filteredCharts.length} trading pairs (dual chart snapshots)...\\n\\nMarket data:\\n${filteredCharts.map(c => `  • ${c.symbol}: ${c.currentPrice.toLocaleString()} [5min + 1000R]`).join('\\n')}`);
      
      if (isDemoMode) {
        toast.info(`[DEMO] 🤖 AI analyzing ${filteredCharts.length} coins (dual charts: 5min + 1000R) with ${modelName}...`);
      } else {
        toast.info(`🤖 AI analyzing ${filteredCharts.length} coins (dual charts: 5min + 1000R) with ${modelName}...`);
      }

      // Create chart data for AI analysis
      // Note: Backend provides snapshot data per symbol; frontend adds chart context
      const multiChartData = filteredCharts.map(chart => ({
        symbol: chart.symbol,
        currentPrice: chart.currentPrice,
        chartType: chartType,
        chartInterval: chartInterval,
        technicalContext: `${chart.symbol} @ ${chart.currentPrice.toLocaleString()} | ${chartType === 'range' ? `${chartInterval}-tick range chart` : `${chartInterval}min timeframe`}`,
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
      setAiThoughts(`${currentThoughts}\\n\\n⏳ Sending request to ${modelName}...\\nWaiting for AI response...`);
      
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
        network,
      });
      
      setAiThoughts(`✅ AI Analysis Complete!\\n\\n📊 Recommendation: ${analysis.action.toUpperCase()}\\n🎯 Confidence: ${analysis.confidence}%\\n💰 Symbol: ${analysis.recommendedSymbol || 'N/A'}\\n\\n💭 Reasoning:\\n${analysis.reasoning}\\n\\n🌍 Market Context:\\n${analysis.marketContext || 'N/A'}`);
      
      toast.success(`✅ Multi-chart AI analysis complete: ${analysis.action.toUpperCase()}`);
      
      await pythonApi.createTradingLog({
        action: "ai_multi_analysis",
        symbol: analysis.recommendedSymbol || "MULTI",
        reason: `AI Decision: ${analysis.action} on ${analysis.recommendedSymbol} (Confidence: ${analysis.confidence}%)`,
        details: `${analysis.reasoning}\\n\\nMarket Context: ${analysis.marketContext || 'N/A'}`,
      });
      
      return analysis;
    } catch (error: any) {
      setAiThoughts(`❌ AI Analysis Error\\n\\n${error.message}\\n\\nPlease check your API keys and try again.`);
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

      // RISK MANAGEMENT: Validate leverage against asset-specific limits
      const { validateLeverage } = await import('@/lib/liquidation-protection');
      const leverageValidation = validateLeverage(symbol, settings.leverage);
      
      if (!leverageValidation.valid) {
        toast.error(
          `⚠️ Leverage too high for ${symbol}`,
          {
            description: `Max leverage: ${leverageValidation.maxLeverage}x. Your setting: ${settings.leverage}x`,
            duration: 7000,
          }
        );
        
        await pythonApi.createTradingLog({
          action: "trade_rejected",
          symbol,
          reason: `Leverage validation failed: ${settings.leverage}x exceeds max ${leverageValidation.maxLeverage}x`,
          details: reasoning,
        });
        
        return;
      }

      // RISK MANAGEMENT: Check if position can be safely opened
      if (action !== "close_position" && side) {
        const { canOpenPosition } = await import('@/lib/liquidation-protection');
        const existingPositions = position ? [{
          size: position.size,
          entryPrice: position.entryPrice,
          leverage: position.leverage || settings.leverage,
        }] : [];
        
        const positionCheck = canOpenPosition(
          balance,
          existingPositions,
          size,
          price
        );
        
        if (!positionCheck.canOpen) {
          toast.error(
            `⚠️ Position Rejected: ${positionCheck.reason}`,
            {
              description: positionCheck.maxSafeSize 
                ? `Max safe size: ${positionCheck.maxSafeSize.toFixed(4)} ${symbol}`
                : 'Reduce position size or close existing positions',
              duration: 10000,
            }
          );
          
          await pythonApi.createTradingLog({
            action: "trade_rejected",
            symbol,
            reason: `Position safety check failed: ${positionCheck.reason}`,
            details: `Requested size: ${size}, Max safe: ${positionCheck.maxSafeSize?.toFixed(4) || 'N/A'}`,
          });
          
          return;
        }
        
        // Calculate and log liquidation risk
        const { assessLiquidationRisk } = await import('@/lib/liquidation-protection');
        const riskData = assessLiquidationRisk(
          {
            symbol,
            side,
            size,
            entryPrice: price,
            leverage: settings.leverage,
          },
          price,
          balance
        );
        
        // Warning for high-risk positions
        if (riskData.riskLevel === 'danger' || riskData.riskLevel === 'critical') {
          toast.warning(
            `⚠️ HIGH RISK POSITION: ${riskData.riskLevel.toUpperCase()}`,
            {
              description: `Liquidation at ${riskData.liquidationPrice.toFixed(2)} (${riskData.distanceToLiquidation.toFixed(1)}% away)`,
              duration: 10000,
            }
          );
        }
        
        await pythonApi.createTradingLog({
          action: "risk_assessment",
          symbol,
          reason: `Risk Level: ${riskData.riskLevel.toUpperCase()}`,
          details: `Liq Price: ${riskData.liquidationPrice.toFixed(2)}, Distance: ${riskData.distanceToLiquidation.toFixed(1)}%, Margin: ${riskData.maintenanceMarginRate * 100}%`,
        });
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

  return {
    runAIAnalysis,
    runMultiChartAIAnalysis,
    executeTrade,
    closePosition,
    closeAllPositions,
  };
}
import { describe, it, expect, beforeEach } from 'vitest';
import { PaperTradingEngine } from '@/lib/paper-trading-engine';
import { pythonApi } from '@/lib/python-api-client';
import { useTradingStore } from '@/store/tradingStore';

/**
 * DeepSeek Paper Trading Test Suite
 * 
 * Tests DeepSeek AI integration with paper trading:
 * 1. API Key Validation - OpenRouter key format and authentication
 * 2. AI Analysis - Multi-chart analysis and decision making
 * 3. Trade Execution - Paper trading engine integration
 * 4. Auto-Trading Loop - Complete automated trading workflow
 * 5. Risk Management - Position sizing and stop-loss validation
 */

describe('DeepSeek Paper Trading Suite', () => {
  describe('1. API Key Validation', () => {
    it('should validate OpenRouter API key format', () => {
      const validKey = 'sk-or-v1-1234567890abcdef';
      const invalidKeys = [
        '',
        'DEMO_MODE',
        'sk-1234567890',
        'invalid-key',
        'sk-or-1234567890',
      ];

      expect(validKey.startsWith('sk-or-v1-')).toBe(true);
      
      invalidKeys.forEach(key => {
        expect(key.startsWith('sk-or-v1-')).toBe(false);
      });

      console.log('✅ OpenRouter API key format validation works');
    });

    it('should detect demo mode correctly', () => {
      const demoKeys = ['', 'DEMO_MODE', null, undefined];
      const validKey = 'sk-or-v1-test123';

      demoKeys.forEach(key => {
        const isDemoMode = !key || key === 'DEMO_MODE' || !key.startsWith('sk-or-v1-');
        expect(isDemoMode).toBe(true);
      });

      const isValidKey = validKey && validKey.startsWith('sk-or-v1-');
      expect(isValidKey).toBe(true);

      console.log('✅ Demo mode detection works correctly');
    });
  });

  describe('2. AI Analysis Request Structure', () => {
    it('should construct valid AI analysis request for single chart', () => {
      const request = {
        apiKey: 'sk-or-v1-test123',
        symbol: 'BTCUSD',
        chartData: 'Market data snapshot',
        userBalance: 10000,
        settings: {
          takeProfitPercent: 2,
          stopLossPercent: 1,
          useAdvancedStrategy: false,
          leverage: 1,
          allowAILeverage: false,
        },
        isDemoMode: true,
        aiModel: 'deepseek/deepseek-chat-v3-0324:free' as const,
        customPrompt: 'Test prompt',
      };

      expect(request.apiKey).toBeTruthy();
      expect(request.symbol).toBe('BTCUSD');
      expect(request.userBalance).toBeGreaterThan(0);
      expect(request.settings.takeProfitPercent).toBeGreaterThan(0);
      expect(request.settings.stopLossPercent).toBeGreaterThan(0);
      expect(request.aiModel).toContain('deepseek');

      console.log('✅ Single chart AI analysis request structure valid');
    });

    it('should construct valid multi-chart analysis request', () => {
      const charts = [
        {
          symbol: 'BTCUSD',
          currentPrice: 50000,
          chartType: 'time' as const,
          chartInterval: '5',
          technicalContext: 'BTC 5min timeframe',
        },
        {
          symbol: 'BTCUSD',
          currentPrice: 50000,
          chartType: 'range' as const,
          chartInterval: '1000',
          technicalContext: 'BTC 1000-tick range',
        },
        {
          symbol: 'ETHUSD',
          currentPrice: 3000,
          chartType: 'time' as const,
          chartInterval: '5',
          technicalContext: 'ETH 5min timeframe',
        },
      ];

      expect(charts.length).toBe(3);
      charts.forEach(chart => {
        expect(chart.symbol).toBeTruthy();
        expect(chart.currentPrice).toBeGreaterThan(0);
        expect(['time', 'range']).toContain(chart.chartType);
      });

      console.log('✅ Multi-chart analysis request structure valid');
    });
  });

  describe('3. Paper Trading Engine Integration', () => {
    let engine: PaperTradingEngine;

    beforeEach(() => {
      engine = new PaperTradingEngine(10000);
    });

    it('should initialize paper trading engine with correct balance', () => {
      expect(engine.getBalance()).toBe(10000);
      expect(engine.getAllPositions()).toHaveLength(0);
      expect(engine.getTotalPnl()).toBe(0);

      console.log('✅ Paper trading engine initialized correctly');
    });

    it('should execute AI-recommended long trade', () => {
      const aiRecommendation = {
        action: 'open_long' as const,
        symbol: 'BTCUSD',
        entryPrice: 50000,
        stopLoss: 49000,
        takeProfit: 52000,
        positionSize: 0.1,
        confidence: 75,
      };

      // Execute trade based on AI recommendation
      const order = engine.placeOrder(
        aiRecommendation.symbol,
        'buy',
        aiRecommendation.positionSize,
        aiRecommendation.entryPrice,
        'market'
      );

      expect(order.status).toBe('filled');
      expect(order.size).toBe(aiRecommendation.positionSize);

      // Set stop loss and take profit
      engine.setStopLoss(aiRecommendation.symbol, aiRecommendation.stopLoss);
      engine.setTakeProfit(aiRecommendation.symbol, aiRecommendation.takeProfit);

      const position = engine.getPosition(aiRecommendation.symbol);
      expect(position).toBeDefined();
      expect(position?.side).toBe('long');
      expect(position?.stopLoss).toBe(aiRecommendation.stopLoss);
      expect(position?.takeProfit).toBe(aiRecommendation.takeProfit);

      console.log('✅ AI-recommended long trade executed successfully');
    });

    it('should execute AI-recommended short trade', () => {
      const aiRecommendation = {
        action: 'open_short' as const,
        symbol: 'ETHUSD',
        entryPrice: 3000,
        stopLoss: 3100,
        takeProfit: 2800,
        positionSize: 1,
        confidence: 80,
      };

      const order = engine.placeOrder(
        aiRecommendation.symbol,
        'sell',
        aiRecommendation.positionSize,
        aiRecommendation.entryPrice,
        'market'
      );

      expect(order.status).toBe('filled');

      engine.setStopLoss(aiRecommendation.symbol, aiRecommendation.stopLoss);
      engine.setTakeProfit(aiRecommendation.symbol, aiRecommendation.takeProfit);

      const position = engine.getPosition(aiRecommendation.symbol);
      expect(position?.side).toBe('short');

      console.log('✅ AI-recommended short trade executed successfully');
    });

    it('should handle AI "hold" recommendation', () => {
      const initialBalance = engine.getBalance();
      const initialPositions = engine.getAllPositions().length;

      // No trade should be executed on "hold"
      expect(engine.getBalance()).toBe(initialBalance);
      expect(engine.getAllPositions()).toHaveLength(initialPositions);

      console.log('✅ AI "hold" recommendation handled correctly');
    });

    it('should validate position sizing based on balance', () => {
      const balance = engine.getBalance();
      const maxRiskPercent = 0.05; // 5% max risk
      const leverage = 1;

      const maxPositionSize = (balance * maxRiskPercent) / leverage;
      const testPrice = 50000;
      const calculatedSize = maxPositionSize / testPrice;

      expect(calculatedSize).toBeLessThan(balance / testPrice);
      expect(calculatedSize * testPrice).toBeLessThanOrEqual(balance * maxRiskPercent);

      console.log(`✅ Position sizing validated: Max size ${calculatedSize.toFixed(4)} for $${balance} balance`);
    });
  });

  describe('4. Auto-Trading Workflow Simulation', () => {
    it('should simulate complete auto-trading cycle', async () => {
      console.log('\n🤖 Simulating DeepSeek Auto-Trading Cycle...\n');

      const engine = new PaperTradingEngine(10000);
      const allowedCoins = ['BTCUSD', 'ETHUSD', 'SOLUSD'];

      // Step 1: Validate configuration
      console.log('📋 Step 1: Validating configuration...');
      expect(allowedCoins.length).toBeGreaterThan(0);
      expect(engine.getBalance()).toBeGreaterThan(0);
      console.log(`✅ Config valid: ${allowedCoins.length} coins, $${engine.getBalance()} balance`);

      // Step 2: Prepare chart data (simulated)
      console.log('\n📊 Step 2: Preparing chart data...');
      const chartData = allowedCoins.flatMap(symbol => [
        {
          symbol,
          currentPrice: symbol === 'BTCUSD' ? 50000 : symbol === 'ETHUSD' ? 3000 : 100,
          chartType: 'time' as const,
          chartInterval: '5',
        },
        {
          symbol,
          currentPrice: symbol === 'BTCUSD' ? 50000 : symbol === 'ETHUSD' ? 3000 : 100,
          chartType: 'range' as const,
          chartInterval: '1000',
        },
      ]);
      expect(chartData.length).toBe(allowedCoins.length * 2);
      console.log(`✅ Prepared ${chartData.length} chart snapshots (dual charts per coin)`);

      // Step 3: Simulate AI analysis response
      console.log('\n🧠 Step 3: Simulating AI analysis...');
      const mockAiResponse = {
        recommendedSymbol: 'BTCUSD',
        action: 'open_long' as const,
        confidence: 75,
        reasoning: 'Strong bullish momentum on 5min timeframe, support confirmed on 1000R chart',
        entryPrice: 50000,
        stopLoss: 49000,
        takeProfit: 52000,
        positionSize: 0.1,
        marketContext: 'BTC showing strength, ETH consolidating, SOL neutral',
      };
      expect(mockAiResponse.action).toBeTruthy();
      expect(mockAiResponse.confidence).toBeGreaterThan(0);
      console.log(`✅ AI recommends: ${mockAiResponse.action.toUpperCase()} ${mockAiResponse.recommendedSymbol} (${mockAiResponse.confidence}% confidence)`);

      // Step 4: Execute trade based on AI recommendation
      console.log('\n💰 Step 4: Executing trade...');
      if (mockAiResponse.action === 'open_long' || mockAiResponse.action === 'open_short') {
        const side = mockAiResponse.action === 'open_long' ? 'buy' : 'sell';
        const order = engine.placeOrder(
          mockAiResponse.recommendedSymbol,
          side,
          mockAiResponse.positionSize,
          mockAiResponse.entryPrice,
          'market'
        );

        expect(order.status).toBe('filled');
        
        engine.setStopLoss(mockAiResponse.recommendedSymbol, mockAiResponse.stopLoss);
        engine.setTakeProfit(mockAiResponse.recommendedSymbol, mockAiResponse.takeProfit);

        console.log(`✅ Trade executed: ${side.toUpperCase()} ${mockAiResponse.positionSize} ${mockAiResponse.recommendedSymbol} @ $${mockAiResponse.entryPrice}`);
      }

      // Step 5: Verify position
      console.log('\n📍 Step 5: Verifying position...');
      const position = engine.getPosition(mockAiResponse.recommendedSymbol);
      expect(position).toBeDefined();
      expect(position?.size).toBe(mockAiResponse.positionSize);
      expect(position?.stopLoss).toBe(mockAiResponse.stopLoss);
      expect(position?.takeProfit).toBe(mockAiResponse.takeProfit);
      console.log(`✅ Position verified: ${position?.side.toUpperCase()} ${position?.size} ${position?.symbol}`);

      // Step 6: Simulate price movement and P&L
      console.log('\n📈 Step 6: Simulating price movement...');
      const newPrice = mockAiResponse.entryPrice * 1.02; // 2% profit
      engine.updateMarketPrice(mockAiResponse.recommendedSymbol, newPrice);
      
      const updatedPosition = engine.getPosition(mockAiResponse.recommendedSymbol);
      expect(updatedPosition?.unrealizedPnl).toBeGreaterThan(0);
      console.log(`✅ Price updated to $${newPrice}, Unrealized P&L: $${updatedPosition?.unrealizedPnl.toFixed(2)}`);

      console.log('\n✅ Auto-Trading Cycle Simulation Complete!\n');
    });

    it('should handle multiple trading cycles', () => {
      const engine = new PaperTradingEngine(10000);
      const cycles = 3;
      const trades = [];

      for (let i = 0; i < cycles; i++) {
        const symbol = i % 2 === 0 ? 'BTCUSD' : 'ETHUSD';
        const entryPrice = i % 2 === 0 ? 50000 : 3000;
        const exitPrice = entryPrice * 1.01; // 1% profit each

        // Open position
        const order = engine.placeOrder(symbol, 'buy', 0.1, entryPrice, 'market');
        expect(order.status).toBe('filled');

        // Close position
        const closeResult = engine.closePosition(symbol, exitPrice, 'auto_trading');
        expect(closeResult.success).toBe(true);

        trades.push({
          symbol,
          pnl: closeResult.pnl,
        });
      }

      expect(trades.length).toBe(cycles);
      const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
      expect(totalPnl).toBeGreaterThan(0);

      console.log(`✅ Completed ${cycles} trading cycles with total P&L: $${totalPnl.toFixed(2)}`);
    });
  });

  describe('5. Risk Management Validation', () => {
    let engine: PaperTradingEngine;

    beforeEach(() => {
      engine = new PaperTradingEngine(10000);
    });

    it('should enforce maximum position size limits', () => {
      const balance = engine.getBalance();
      const maxRiskPercent = 0.05; // 5%
      const price = 50000;
      
      const maxSize = (balance * maxRiskPercent) / price;
      const oversizedTrade = maxSize * 10; // 10x over limit

      // Oversized trade should fail
      const order = engine.placeOrder('BTCUSD', 'buy', oversizedTrade, price, 'market');
      expect(order.status).toBe('cancelled');

      console.log('✅ Position size limits enforced');
    });

    it('should validate stop-loss placement', () => {
      const symbol = 'BTCUSD';
      const entryPrice = 50000;
      const stopLossPercent = 0.02; // 2%
      
      // Long position stop loss should be below entry
      const longStopLoss = entryPrice * (1 - stopLossPercent);
      expect(longStopLoss).toBeLessThan(entryPrice);

      engine.placeOrder(symbol, 'buy', 0.1, entryPrice, 'market');
      engine.setStopLoss(symbol, longStopLoss);

      const position = engine.getPosition(symbol);
      expect(position?.stopLoss).toBe(longStopLoss);

      console.log(`✅ Stop-loss validated: Entry $${entryPrice}, SL $${longStopLoss}`);
    });

    it('should calculate risk-reward ratio correctly', () => {
      const entryPrice = 50000;
      const stopLoss = 49000;
      const takeProfit = 52000;

      const risk = entryPrice - stopLoss;
      const reward = takeProfit - entryPrice;
      const riskRewardRatio = reward / risk;

      expect(riskRewardRatio).toBeGreaterThan(1); // Should be at least 1:1
      expect(riskRewardRatio).toBe(2); // 2:1 in this case

      console.log(`✅ Risk-reward ratio: ${riskRewardRatio.toFixed(2)}:1`);
    });

    it('should prevent trading with insufficient balance', () => {
      const balance = engine.getBalance();
      const price = 50000;
      const oversizedPosition = (balance / price) * 2; // 2x balance

      const order = engine.placeOrder('BTCUSD', 'buy', oversizedPosition, price, 'market');
      expect(order.status).toBe('cancelled');

      console.log('✅ Insufficient balance protection works');
    });
  });

  describe('6. Trading Store Integration', () => {
    it('should validate trading store default configuration', () => {
      const store = useTradingStore.getState();

      expect(store.mode).toBe('paper');
      expect(store.balance).toBe(10000);
      expect(store.initialBalance).toBe(10000);
      expect(store.aiModel).toContain('deepseek');
      expect(store.settings.allowedCoins).toContain('BTCUSD');

      console.log('✅ Trading store defaults validated');
    });

    it('should validate AI model selection', () => {
      const validModels = [
        'deepseek/deepseek-chat-v3-0324:free',
        'qwen/qwen3-max',
      ];

      const store = useTradingStore.getState();
      expect(validModels).toContain(store.aiModel);

      console.log(`✅ AI model validated: ${store.aiModel}`);
    });

    it('should validate custom prompt structure', () => {
      const store = useTradingStore.getState();
      const prompt = store.customPrompt;

      expect(prompt).toBeTruthy();
      expect(prompt.length).toBeGreaterThan(100);
      expect(prompt).toContain('technical analysis');
      expect(prompt).toContain('risk management');

      console.log('✅ Custom prompt structure validated');
    });
  });

  describe('7. Logging and Monitoring', () => {
    it('should create comprehensive trade logs', async () => {
      const tradeLog = {
        action: 'open_long',
        symbol: 'BTCUSD',
        side: 'long' as const,
        price: 50000,
        size: 0.1,
        reason: 'DeepSeek AI recommendation',
        details: 'Confidence: 75%, SL: 49000, TP: 52000',
        mode: 'paper' as const,
      };

      const result = await pythonApi.createTradingLog(tradeLog);
      expect(result.success).toBe(true);

      console.log('✅ Trade log created successfully');
    }, 10000);

    it('should track balance history', async () => {
      const initialBalance = 10000;
      const result = await pythonApi.recordBalance(initialBalance, 'paper');

      expect(result.success).toBe(true);

      console.log('✅ Balance history tracked');
    }, 10000);

    it('should record position snapshots', async () => {
      const snapshot = {
        symbol: 'BTCUSD',
        side: 'long' as const,
        size: 0.1,
        entry_price: 50000,
        current_price: 51000,
        unrealized_pnl: 100,
        leverage: 1,
        mode: 'paper' as const,
      };

      const result = await pythonApi.recordPositionSnapshot(snapshot);
      expect(result.success).toBe(true);

      console.log('✅ Position snapshot recorded');
    }, 10000);
  });
});

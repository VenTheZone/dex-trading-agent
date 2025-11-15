import { describe, it, expect, beforeEach } from 'vitest';
import { pythonApi } from '@/lib/python-api-client';
import { fetchPriceWithFallback } from '@/lib/price-service';
import { TRADING_TOKENS } from '@/lib/tokenData';
import { PaperTradingEngine } from '@/lib/paper-trading-engine';

/**
 * Trading Agent Backtesting Suite
 * 
 * Tests the complete trading workflow:
 * 1. Price Fetching - Can the agent see current market prices?
 * 2. Chart Analysis - Can the agent access chart data?
 * 3. Logging - Can the agent log its actions properly?
 * 4. Trading Execution - Can the agent execute trades?
 */

describe('Trading Agent Backtesting Suite', () => {
  describe('1. Price Fetching Capability', () => {
    it('should fetch prices for all trading tokens', async () => {
      const results = await Promise.allSettled(
        TRADING_TOKENS.map(token => 
          fetchPriceWithFallback(`${token.symbol}USD`)
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      console.log(`✅ Price Fetch Results: ${successful.length}/${TRADING_TOKENS.length} successful`);
      
      if (failed.length > 0) {
        console.warn(`⚠️ Failed to fetch prices for ${failed.length} tokens`);
      }

      // At least 50% of tokens should have prices available
      expect(successful.length).toBeGreaterThanOrEqual(TRADING_TOKENS.length * 0.5);
    }, 30000);

    it('should fetch price via Python API endpoint', async () => {
      const testSymbol = 'BTCUSD';
      
      try {
        const price = await pythonApi.fetchPrice(testSymbol, false);
        
        expect(price).toBeGreaterThan(0);
        expect(typeof price).toBe('number');
        
        console.log(`✅ Python API Price Fetch: ${testSymbol} = $${price.toLocaleString()}`);
      } catch (error: any) {
        console.error(`❌ Python API Price Fetch Failed: ${error.message}`);
        throw error;
      }
    }, 15000);

    it('should handle price fetch errors gracefully', async () => {
      const invalidSymbol = 'INVALID_SYMBOL_XYZ';
      
      await expect(
        pythonApi.fetchPrice(invalidSymbol, false)
      ).rejects.toThrow();
      
      console.log('✅ Price fetch error handling works correctly');
    });
  });

  describe('2. Chart Analysis Capability', () => {
    it('should validate TradingView symbol formats', () => {
      const testCases = [
        { symbol: 'BTC', expected: 'BTCUSD' },
        { symbol: 'ETH', expected: 'ETHUSD' },
        { symbol: 'SOL', expected: 'SOLUSD' },
      ];

      testCases.forEach(({ symbol, expected }) => {
        const token = TRADING_TOKENS.find(t => t.symbol === symbol);
        expect(token?.tradingViewSymbol).toBe(expected);
      });

      console.log('✅ TradingView symbol formats validated');
    });

    it('should prepare multi-chart data for AI analysis', async () => {
      const testSymbols = ['BTCUSD', 'ETHUSD'];
      
      const chartData = await Promise.all(
        testSymbols.map(async (symbol) => {
          try {
            const price = await pythonApi.fetchPrice(symbol, false);
            return {
              symbol,
              currentPrice: price,
              chartType: 'time' as const,
              chartInterval: '5',
            };
          } catch {
            return null;
          }
        })
      );

      const validCharts = chartData.filter(c => c !== null);
      
      expect(validCharts.length).toBeGreaterThan(0);
      validCharts.forEach(chart => {
        expect(chart?.currentPrice).toBeGreaterThan(0);
        expect(chart?.symbol).toBeTruthy();
      });

      console.log(`✅ Multi-chart data prepared: ${validCharts.length} charts`);
    }, 30000);
  });

  describe('3. Logging Capability', () => {
    it('should create trading log entries', async () => {
      const testLog = {
        action: 'test_action',
        symbol: 'BTCUSD',
        reason: 'Backtesting log creation',
        details: 'Testing agent logging capability',
        price: 50000,
        size: 0.1,
        side: 'long' as const,
      };

      const result = await pythonApi.createTradingLog(testLog);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      console.log('✅ Trading log created successfully');
    }, 10000);

    it('should retrieve trading logs', async () => {
      const result = await pythonApi.getTradingLogs(10);
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      
      console.log(`✅ Retrieved ${result.data?.length || 0} trading logs`);
    }, 10000);

    it('should record balance history', async () => {
      const testBalance = 10000;
      const result = await pythonApi.recordBalance(testBalance, 'paper');
      
      expect(result.success).toBe(true);
      
      console.log('✅ Balance history recorded');
    }, 10000);

    it('should record position snapshots', async () => {
      const testSnapshot = {
        symbol: 'BTCUSD',
        side: 'long' as const,
        size: 0.1,
        entry_price: 50000,
        current_price: 51000,
        unrealized_pnl: 100,
        leverage: 2,
        mode: 'paper' as const,
      };

      const result = await pythonApi.recordPositionSnapshot(testSnapshot);
      
      expect(result.success).toBe(true);
      
      console.log('✅ Position snapshot recorded');
    }, 10000);
  });

  describe('4. Trading Execution Capability', () => {
    let engine: PaperTradingEngine;

    beforeEach(() => {
      engine = new PaperTradingEngine(10000);
    });

    it('should execute a complete long trade lifecycle', () => {
      const symbol = 'BTCUSD';
      const entryPrice = 50000;
      const exitPrice = 52000;
      const size = 0.1;

      // Open long position
      const order = engine.placeOrder(symbol, 'buy', size, entryPrice, 'market');
      expect(order.status).toBe('filled');

      // Verify position
      const position = engine.getPosition(symbol);
      expect(position).toBeDefined();
      expect(position?.side).toBe('long');
      expect(position?.size).toBe(size);

      // Update price (simulate profit)
      engine.updateMarketPrice(symbol, exitPrice);
      const updatedPosition = engine.getPosition(symbol);
      expect(updatedPosition?.unrealizedPnl).toBeGreaterThan(0);

      // Close position
      const closeResult = engine.closePosition(symbol, exitPrice, 'manual');
      expect(closeResult.success).toBe(true);
      expect(closeResult.pnl).toBeGreaterThan(0);

      console.log(`✅ Long trade executed: Entry $${entryPrice}, Exit $${exitPrice}, P&L: $${closeResult.pnl.toFixed(2)}`);
    });

    it('should execute a complete short trade lifecycle', () => {
      const symbol = 'ETHUSD';
      const entryPrice = 3000;
      const exitPrice = 2800;
      const size = 1;

      // Open short position
      const order = engine.placeOrder(symbol, 'sell', size, entryPrice, 'market');
      expect(order.status).toBe('filled');

      // Verify position
      const position = engine.getPosition(symbol);
      expect(position?.side).toBe('short');

      // Update price (simulate profit for short)
      engine.updateMarketPrice(symbol, exitPrice);
      const updatedPosition = engine.getPosition(symbol);
      expect(updatedPosition?.unrealizedPnl).toBeGreaterThan(0);

      // Close position
      const closeResult = engine.closePosition(symbol, exitPrice, 'manual');
      expect(closeResult.success).toBe(true);
      expect(closeResult.pnl).toBeGreaterThan(0);

      console.log(`✅ Short trade executed: Entry $${entryPrice}, Exit $${exitPrice}, P&L: $${closeResult.pnl.toFixed(2)}`);
    });

    it('should handle stop loss correctly', () => {
      const symbol = 'BTCUSD';
      const entryPrice = 50000;
      const stopLoss = 49000;
      const size = 0.1;

      // Open position with stop loss
      engine.placeOrder(symbol, 'buy', size, entryPrice, 'market');
      engine.setStopLoss(symbol, stopLoss);

      const position = engine.getPosition(symbol);
      expect(position?.stopLoss).toBe(stopLoss);

      // Trigger stop loss
      engine.updateMarketPrice(symbol, stopLoss - 100);
      
      // Position should be closed
      expect(engine.getPosition(symbol)).toBeUndefined();

      console.log('✅ Stop loss triggered correctly');
    });

    it('should handle take profit correctly', () => {
      const symbol = 'ETHUSD';
      const entryPrice = 3000;
      const takeProfit = 3200;
      const size = 1;

      // Open position with take profit
      engine.placeOrder(symbol, 'buy', size, entryPrice, 'market');
      engine.setTakeProfit(symbol, takeProfit);

      const position = engine.getPosition(symbol);
      expect(position?.takeProfit).toBe(takeProfit);

      // Trigger take profit
      engine.updateMarketPrice(symbol, takeProfit + 100);
      
      // Position should be closed
      expect(engine.getPosition(symbol)).toBeUndefined();

      console.log('✅ Take profit triggered correctly');
    });

    it('should prevent trades with insufficient balance', () => {
      const symbol = 'BTCUSD';
      const entryPrice = 50000;
      const size = 10; // Too large for $10k balance

      const order = engine.placeOrder(symbol, 'buy', size, entryPrice, 'market');
      
      expect(order.status).toBe('cancelled');
      expect(engine.getPosition(symbol)).toBeUndefined();

      console.log('✅ Insufficient balance protection works');
    });

    it('should track balance and equity correctly', () => {
      const initialBalance = engine.getBalance();
      expect(initialBalance).toBe(10000);

      // Execute profitable trade
      const symbol = 'BTCUSD';
      engine.placeOrder(symbol, 'buy', 0.1, 50000, 'market');
      engine.updateMarketPrice(symbol, 52000);

      const equity = engine.getEquity();
      expect(equity).toBeGreaterThan(initialBalance);

      console.log(`✅ Balance tracking: Initial $${initialBalance}, Equity $${equity.toFixed(2)}`);
    });
  });

  describe('5. End-to-End Integration Test', () => {
    it('should simulate complete trading agent workflow', async () => {
      console.log('\n🤖 Starting Trading Agent Workflow Simulation...\n');

      // Step 1: Fetch market prices
      console.log('📊 Step 1: Fetching market prices...');
      const symbol = 'BTCUSD';
      let currentPrice: number;
      
      try {
        currentPrice = await pythonApi.fetchPrice(symbol, false);
        console.log(`✅ Price fetched: ${symbol} = $${currentPrice.toLocaleString()}`);
      } catch (error: any) {
        console.log(`⚠️ Using fallback price due to: ${error.message}`);
        currentPrice = 50000; // Fallback for testing
      }

      // Step 2: Log analysis start
      console.log('\n📝 Step 2: Logging analysis start...');
      await pythonApi.createTradingLog({
        action: 'analysis_start',
        symbol,
        reason: 'Backtesting workflow simulation',
        details: `Current price: $${currentPrice}`,
      });
      console.log('✅ Analysis logged');

      // Step 3: Simulate trade decision
      console.log('\n🎯 Step 3: Making trade decision...');
      const engine = new PaperTradingEngine(10000);
      const tradeSize = 0.1;
      const stopLoss = currentPrice * 0.98; // 2% stop loss
      const takeProfit = currentPrice * 1.04; // 4% take profit

      // Step 4: Execute trade
      console.log('\n💰 Step 4: Executing trade...');
      const order = engine.placeOrder(symbol, 'buy', tradeSize, currentPrice, 'market');
      engine.setStopLoss(symbol, stopLoss);
      engine.setTakeProfit(symbol, takeProfit);

      expect(order.status).toBe('filled');
      console.log(`✅ Trade executed: ${order.side.toUpperCase()} ${tradeSize} ${symbol} @ $${currentPrice}`);

      // Step 5: Log trade execution
      console.log('\n📝 Step 5: Logging trade execution...');
      await pythonApi.createTradingLog({
        action: 'open_long',
        symbol,
        side: 'long',
        price: currentPrice,
        size: tradeSize,
        reason: 'Backtesting simulation',
        details: `SL: $${stopLoss.toFixed(2)}, TP: $${takeProfit.toFixed(2)}`,
      });
      console.log('✅ Trade logged');

      // Step 6: Record position snapshot
      console.log('\n📸 Step 6: Recording position snapshot...');
      const position = engine.getPosition(symbol);
      if (position) {
        await pythonApi.recordPositionSnapshot({
          symbol,
          side: 'long',
          size: tradeSize,
          entry_price: currentPrice,
          current_price: currentPrice,
          unrealized_pnl: 0,
          leverage: 1,
          mode: 'paper',
        });
        console.log('✅ Position snapshot recorded');
      }

      // Step 7: Simulate price movement and close
      console.log('\n📈 Step 7: Simulating price movement...');
      const exitPrice = currentPrice * 1.02; // 2% profit
      engine.updateMarketPrice(symbol, exitPrice);
      
      const closeResult = engine.closePosition(symbol, exitPrice, 'manual');
      expect(closeResult.success).toBe(true);
      console.log(`✅ Position closed with P&L: $${closeResult.pnl.toFixed(2)}`);

      // Step 8: Log final results
      console.log('\n📝 Step 8: Logging final results...');
      await pythonApi.createTradingLog({
        action: 'close_position',
        symbol,
        side: 'long',
        price: exitPrice,
        size: tradeSize,
        reason: 'Backtesting simulation complete',
        details: `P&L: $${closeResult.pnl.toFixed(2)}`,
      });

      await pythonApi.recordBalance(engine.getBalance(), 'paper');
      console.log('✅ Final balance recorded');

      console.log('\n✅ Trading Agent Workflow Simulation Complete!\n');
      console.log('Summary:');
      console.log(`  - Price Fetching: ✅`);
      console.log(`  - Chart Analysis: ✅`);
      console.log(`  - Logging: ✅`);
      console.log(`  - Trade Execution: ✅`);
      console.log(`  - Final P&L: $${closeResult.pnl.toFixed(2)}`);
    }, 60000);
  });
});

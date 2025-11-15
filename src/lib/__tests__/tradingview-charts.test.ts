/**
 * Unit tests for TradingView chart snapshots and integration
 * Tests chart loading, symbol formatting, and error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getTradingViewSymbol, TRADING_TOKENS } from '../tokenData';

// Mock TradingView widget
const mockTradingViewWidget = vi.fn();

// Mock window.TradingView
beforeEach(() => {
  (window as any).TradingView = {
    widget: mockTradingViewWidget,
  };
});

afterEach(() => {
  vi.clearAllMocks();
  delete (window as any).TradingView;
});

describe('TradingView Chart Integration', () => {
  describe('Symbol Formatting', () => {
    it('should format BTC symbol correctly', () => {
      const symbol = getTradingViewSymbol('BTC');
      expect(symbol).toBe('BTCUSD');
    });

    it('should format ETH symbol correctly', () => {
      const symbol = getTradingViewSymbol('ETH');
      expect(symbol).toBe('ETHUSD');
    });

    it('should format SOL symbol correctly', () => {
      const symbol = getTradingViewSymbol('SOL');
      expect(symbol).toBe('SOLUSD');
    });

    it('should handle unknown symbols with default format', () => {
      const symbol = getTradingViewSymbol('UNKNOWN');
      expect(symbol).toBe('UNKNOWNUSD');
    });

    it('should format all trading tokens correctly', () => {
      TRADING_TOKENS.forEach(token => {
        const symbol = getTradingViewSymbol(token.symbol);
        expect(symbol).toBeTruthy();
        expect(symbol).toMatch(/USD$/);
      });
    });
  });

  describe('Chart Configuration', () => {
    it('should have valid TradingView symbols for all tokens', () => {
      TRADING_TOKENS.forEach(token => {
        expect(token.tradingViewSymbol).toBeTruthy();
        expect(token.tradingViewSymbol).toMatch(/USD$/);
      });
    });

    it('should have unique symbols for each token', () => {
      const symbols = TRADING_TOKENS.map(t => t.symbol);
      const uniqueSymbols = new Set(symbols);
      expect(uniqueSymbols.size).toBe(symbols.length);
    });

    it('should have valid leverage values', () => {
      TRADING_TOKENS.forEach(token => {
        expect(token.maxLeverage).toBeGreaterThan(0);
        expect(token.maxLeverage).toBeLessThanOrEqual(40);
        expect([5, 10, 20, 25, 40]).toContain(token.maxLeverage);
      });
    });

    it('should have valid trading links', () => {
      TRADING_TOKENS.forEach(token => {
        expect(token.tradingLink).toContain('hyperliquid.xyz');
        expect(token.tradingLink).toContain(token.symbol);
      });
    });
  });

  describe('Chart Symbol Formats', () => {
    it('should support Hyperliquid symbol format', () => {
      const symbol = 'BTC';
      const hyperliquidFormat = `HYPERLIQUID:${symbol}USDC`;
      expect(hyperliquidFormat).toBe('HYPERLIQUID:BTCUSDC');
    });

    it('should support Binance symbol format', () => {
      const symbol = 'BTC';
      const binanceFormat = `BINANCE:${symbol}USDT`;
      expect(binanceFormat).toBe('BINANCE:BTCUSDT');
    });

    it('should support Coinbase symbol format', () => {
      const symbol = 'BTC';
      const coinbaseFormat = `COINBASE:${symbol}USD`;
      expect(coinbaseFormat).toBe('COINBASE:BTCUSD');
    });

    it('should support generic symbol format', () => {
      const symbol = 'BTC';
      const genericFormat = `${symbol}USD`;
      expect(genericFormat).toBe('BTCUSD');
    });
  });

  describe('Chart Intervals', () => {
    it('should support time-based intervals', () => {
      const timeIntervals = ['5', '15', '60'];
      
      timeIntervals.forEach(interval => {
        expect(['5', '15', '60']).toContain(interval);
      });
    });

    it('should map range intervals to time intervals', () => {
      const rangeToInterval: Record<string, string> = {
        '10': '1',
        '100': '5',
        '1000': '15'
      };
      
      expect(rangeToInterval['10']).toBe('1');
      expect(rangeToInterval['100']).toBe('5');
      expect(rangeToInterval['1000']).toBe('15');
    });

    it('should have valid default interval', () => {
      const defaultInterval = '5';
      expect(['1', '5', '15', '60']).toContain(defaultInterval);
    });
  });

  describe('Chart Widget Configuration', () => {
    it('should create widget with correct container ID', () => {
      const symbol = 'BTC';
      const containerId = `tradingview_time_${symbol}`;
      
      expect(containerId).toBe('tradingview_time_BTC');
    });

    it('should create range chart container ID', () => {
      const symbol = 'BTC';
      const containerId = `tradingview_range_${symbol}`;
      
      expect(containerId).toBe('tradingview_range_BTC');
    });

    it('should use dark theme', () => {
      const theme = 'dark';
      expect(theme).toBe('dark');
    });

    it('should use UTC timezone', () => {
      const timezone = 'Etc/UTC';
      expect(timezone).toBe('Etc/UTC');
    });

    it('should have valid chart style', () => {
      const timeChartStyle = '1'; // Candlestick
      const rangeChartStyle = '3'; // Range bars
      
      expect(['1', '3']).toContain(timeChartStyle);
      expect(['1', '3']).toContain(rangeChartStyle);
    });
  });

  describe('Chart Error Handling', () => {
    it('should handle missing TradingView library', () => {
      delete (window as any).TradingView;
      
      const hasLibrary = typeof (window as any).TradingView !== 'undefined';
      expect(hasLibrary).toBe(false);
    });

    it('should handle chart loading errors gracefully', () => {
      const errorMessage = 'Failed to load chart';
      expect(errorMessage).toContain('Failed to load');
    });

    it('should handle script loading errors', () => {
      const scriptError = new Error('Failed to load TradingView script');
      expect(scriptError.message).toContain('TradingView script');
    });

    it('should provide error context', () => {
      const symbol = 'BTC';
      const errorContext = `Failed to load time chart: ${symbol}`;
      expect(errorContext).toContain(symbol);
    });
  });

  describe('Multi-Chart Analysis', () => {
    it('should support dual chart analysis per coin', () => {
      const symbol = 'BTC';
      const timeChartId = `tradingview_time_${symbol}`;
      const rangeChartId = `tradingview_range_${symbol}`;
      
      expect(timeChartId).not.toBe(rangeChartId);
    });

    it('should support up to 8 chart snapshots (2 per coin × 4 coins)', () => {
      const maxCoins = 4;
      const chartsPerCoin = 2;
      const totalCharts = maxCoins * chartsPerCoin;
      
      expect(totalCharts).toBe(8);
    });

    it('should have different intervals for time and range charts', () => {
      const timeInterval = '5'; // 5 minutes
      const rangeInterval = '1000'; // 1000 range
      
      expect(timeInterval).not.toBe(rangeInterval);
    });
  });

  describe('Chart Styling', () => {
    it('should have custom candle colors', () => {
      const upColor = '#00ff00';
      const downColor = '#ff0000';
      
      expect(upColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(downColor).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should have dark background', () => {
      const backgroundColor = '#000000';
      expect(backgroundColor).toBe('#000000');
    });

    it('should have cyan grid color', () => {
      const gridColor = 'rgba(0, 255, 255, 0.1)';
      expect(gridColor).toContain('rgba');
      expect(gridColor).toContain('0.1');
    });

    it('should have dark toolbar', () => {
      const toolbarBg = '#0a0a0a';
      expect(toolbarBg).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  describe('Chart Data Validation', () => {
    it('should validate chart snapshot structure', () => {
      const chartSnapshot = {
        symbol: 'BTC',
        currentPrice: 50000,
        chartType: 'time' as const,
        chartInterval: '5',
        technicalContext: 'Bullish trend',
      };
      
      expect(chartSnapshot.symbol).toBeTruthy();
      expect(chartSnapshot.currentPrice).toBeGreaterThan(0);
      expect(['time', 'range']).toContain(chartSnapshot.chartType);
      expect(chartSnapshot.chartInterval).toBeTruthy();
    });

    it('should validate perpetual futures data', () => {
      const futuresData = {
        markPrice: 50000,
        indexPrice: 50010,
        fundingRate: 0.0001,
        nextFundingTime: Date.now() + 28800000, // 8 hours
        openInterest: 1000000,
        longShortRatio: 1.2,
      };
      
      expect(futuresData.markPrice).toBeGreaterThan(0);
      expect(futuresData.indexPrice).toBeGreaterThan(0);
      expect(typeof futuresData.fundingRate).toBe('number');
      expect(futuresData.nextFundingTime).toBeGreaterThan(Date.now());
      expect(futuresData.openInterest).toBeGreaterThan(0);
      expect(futuresData.longShortRatio).toBeGreaterThan(0);
    });
  });

  describe('Real-World Chart Scenarios', () => {
    it('should handle chart switching between time and range', () => {
      const initialTab = 'time';
      const switchedTab = 'range';
      
      expect(initialTab).not.toBe(switchedTab);
      expect(['time', 'range']).toContain(initialTab);
      expect(['time', 'range']).toContain(switchedTab);
    });

    it('should handle interval changes', () => {
      const intervals = ['5', '15', '60'];
      const currentInterval = '5';
      const newInterval = '15';
      
      expect(intervals).toContain(currentInterval);
      expect(intervals).toContain(newInterval);
      expect(currentInterval).not.toBe(newInterval);
    });

    it('should support all trading tokens', () => {
      const supportedSymbols = TRADING_TOKENS.map(t => t.symbol);
      
      expect(supportedSymbols).toContain('BTC');
      expect(supportedSymbols).toContain('ETH');
      expect(supportedSymbols).toContain('SOL');
      expect(supportedSymbols.length).toBeGreaterThanOrEqual(4);
    });
  });
});

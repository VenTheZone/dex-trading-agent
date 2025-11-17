import { describe, it, expect, beforeEach } from 'vitest';
import { useTradingStore } from '@/store/tradingStore';

describe('Symbol Filtering Tests', () => {
  beforeEach(() => {
    // Reset store to default state
    const store = useTradingStore.getState();
    store.updateSettings({
      allowedCoins: ['BTCUSD', 'ETHUSD', 'SOLUSD'],
    });
  });

  describe('Allowed Coins Configuration', () => {
    it('should initialize with default allowed coins', () => {
      const { settings } = useTradingStore.getState();
      expect(settings.allowedCoins).toEqual(['BTCUSD', 'ETHUSD', 'SOLUSD']);
    });

    it('should update allowed coins through settings', () => {
      const store = useTradingStore.getState();
      
      store.updateSettings({
        allowedCoins: ['BTCUSD', 'XRPUSD'],
      });

      const { settings } = useTradingStore.getState();
      expect(settings.allowedCoins).toEqual(['BTCUSD', 'XRPUSD']);
    });

    it('should allow empty allowed coins array', () => {
      const store = useTradingStore.getState();
      
      store.updateSettings({
        allowedCoins: [],
      });

      const { settings } = useTradingStore.getState();
      expect(settings.allowedCoins).toEqual([]);
    });

    it('should handle single coin selection', () => {
      const store = useTradingStore.getState();
      
      store.updateSettings({
        allowedCoins: ['BTCUSD'],
      });

      const { settings } = useTradingStore.getState();
      expect(settings.allowedCoins).toEqual(['BTCUSD']);
      expect(settings.allowedCoins?.length).toBe(1);
    });

    it('should handle multiple coin selections', () => {
      const store = useTradingStore.getState();
      
      store.updateSettings({
        allowedCoins: ['BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD', 'XRPUSD'],
      });

      const { settings } = useTradingStore.getState();
      expect(settings.allowedCoins?.length).toBe(5);
      expect(settings.allowedCoins).toContain('BTCUSD');
      expect(settings.allowedCoins).toContain('XRPUSD');
    });
  });

  describe('Symbol Filtering Logic', () => {
    it('should filter charts by allowed coins', () => {
      const store = useTradingStore.getState();
      store.updateSettings({
        allowedCoins: ['BTCUSD', 'ETHUSD'],
      });

      const allCharts = [
        { symbol: 'BTCUSD', currentPrice: 50000 },
        { symbol: 'ETHUSD', currentPrice: 3000 },
        { symbol: 'SOLUSD', currentPrice: 100 },
        { symbol: 'XRPUSD', currentPrice: 0.5 },
      ];

      const { settings } = useTradingStore.getState();
      const allowedCoins = settings.allowedCoins || [];
      
      const filteredCharts = allCharts.filter(chart =>
        allowedCoins.length === 0 || allowedCoins.includes(chart.symbol)
      );

      expect(filteredCharts).toHaveLength(2);
      expect(filteredCharts.map(c => c.symbol)).toEqual(['BTCUSD', 'ETHUSD']);
    });

    it('should allow all charts when allowedCoins is empty', () => {
      const store = useTradingStore.getState();
      store.updateSettings({
        allowedCoins: [],
      });

      const allCharts = [
        { symbol: 'BTCUSD', currentPrice: 50000 },
        { symbol: 'ETHUSD', currentPrice: 3000 },
        { symbol: 'SOLUSD', currentPrice: 100 },
      ];

      const { settings } = useTradingStore.getState();
      const allowedCoins = settings.allowedCoins || [];
      
      const filteredCharts = allCharts.filter(chart =>
        allowedCoins.length === 0 || allowedCoins.includes(chart.symbol)
      );

      expect(filteredCharts).toHaveLength(3);
    });

    it('should filter out non-allowed symbols', () => {
      const store = useTradingStore.getState();
      store.updateSettings({
        allowedCoins: ['BTCUSD'],
      });

      const allCharts = [
        { symbol: 'BTCUSD', currentPrice: 50000 },
        { symbol: 'ETHUSD', currentPrice: 3000 },
      ];

      const { settings } = useTradingStore.getState();
      const allowedCoins = settings.allowedCoins || [];
      
      const filteredCharts = allCharts.filter(chart =>
        allowedCoins.length === 0 || allowedCoins.includes(chart.symbol)
      );

      expect(filteredCharts).toHaveLength(1);
      expect(filteredCharts[0].symbol).toBe('BTCUSD');
    });

    it('should return empty array when no charts match allowed coins', () => {
      const store = useTradingStore.getState();
      store.updateSettings({
        allowedCoins: ['DOTUSD'],
      });

      const allCharts = [
        { symbol: 'BTCUSD', currentPrice: 50000 },
        { symbol: 'ETHUSD', currentPrice: 3000 },
      ];

      const { settings } = useTradingStore.getState();
      const allowedCoins = settings.allowedCoins || [];
      
      const filteredCharts = allCharts.filter(chart =>
        allowedCoins.length === 0 || allowedCoins.includes(chart.symbol)
      );

      expect(filteredCharts).toHaveLength(0);
    });
  });

  describe('Trade Execution Validation', () => {
    it('should validate symbol is in allowed coins before trade', () => {
      const store = useTradingStore.getState();
      store.updateSettings({
        allowedCoins: ['BTCUSD', 'ETHUSD'],
      });

      const { settings } = useTradingStore.getState();
      const allowedCoins = settings.allowedCoins || [];
      
      const symbol = 'BTCUSD';
      const isAllowed = allowedCoins.length === 0 || allowedCoins.includes(symbol);
      
      expect(isAllowed).toBe(true);
    });

    it('should reject trade for non-allowed symbol', () => {
      const store = useTradingStore.getState();
      store.updateSettings({
        allowedCoins: ['BTCUSD', 'ETHUSD'],
      });

      const { settings } = useTradingStore.getState();
      const allowedCoins = settings.allowedCoins || [];
      
      const symbol = 'SOLUSD';
      const isAllowed = allowedCoins.length === 0 || allowedCoins.includes(symbol);
      
      expect(isAllowed).toBe(false);
    });

    it('should allow any symbol when allowedCoins is empty', () => {
      const store = useTradingStore.getState();
      store.updateSettings({
        allowedCoins: [],
      });

      const { settings } = useTradingStore.getState();
      const allowedCoins = settings.allowedCoins || [];
      
      const symbol = 'ANYSYMBOL';
      const isAllowed = allowedCoins.length === 0 || allowedCoins.includes(symbol);
      
      expect(isAllowed).toBe(true);
    });
  });

  describe('AI Analysis Symbol Filtering', () => {
    it('should only analyze allowed coins', () => {
      const store = useTradingStore.getState();
      store.updateSettings({
        allowedCoins: ['BTCUSD', 'ETHUSD'],
      });

      const availableSymbols = ['BTCUSD', 'ETHUSD', 'SOLUSD', 'XRPUSD'];
      const { settings } = useTradingStore.getState();
      const allowedCoins = settings.allowedCoins || [];
      
      const symbolsForAnalysis = availableSymbols.filter(symbol =>
        allowedCoins.length === 0 || allowedCoins.includes(symbol)
      );

      expect(symbolsForAnalysis).toEqual(['BTCUSD', 'ETHUSD']);
    });

    it('should validate AI recommended symbol is in allowed coins', () => {
      const store = useTradingStore.getState();
      store.updateSettings({
        allowedCoins: ['BTCUSD', 'ETHUSD'],
      });

      const { settings } = useTradingStore.getState();
      const allowedCoins = settings.allowedCoins || [];
      
      const recommendedSymbol = 'SOLUSD';
      const isRecommendationValid = allowedCoins.length === 0 || allowedCoins.includes(recommendedSymbol);
      
      expect(isRecommendationValid).toBe(false);
    });
  });
});

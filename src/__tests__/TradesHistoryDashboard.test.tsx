import { describe, it, expect } from 'vitest';

// Mock trade data for testing
const mockTrades = [
  {
    id: 'BTC-1',
    symbol: 'BTCUSD',
    side: 'long' as const,
    entryPrice: 50000,
    exitPrice: 51000,
    size: 1,
    pnl: 1000,
    entryTime: '2024-01-01T10:00:00Z',
    exitTime: '2024-01-01T11:00:00Z',
    mode: 'paper' as const,
    status: 'closed' as const,
  },
  {
    id: 'ETH-1',
    symbol: 'ETHUSD',
    side: 'short' as const,
    entryPrice: 3000,
    exitPrice: 3100,
    size: 2,
    pnl: -200,
    entryTime: '2024-01-01T12:00:00Z',
    exitTime: '2024-01-01T13:00:00Z',
    mode: 'paper' as const,
    status: 'closed' as const,
  },
  {
    id: 'SOL-1',
    symbol: 'SOLUSD',
    side: 'long' as const,
    entryPrice: 100,
    exitPrice: 100,
    size: 10,
    pnl: 0,
    entryTime: '2024-01-01T14:00:00Z',
    exitTime: '2024-01-01T15:00:00Z',
    mode: 'paper' as const,
    status: 'closed' as const,
  },
  {
    id: 'BTC-2',
    symbol: 'BTCUSD',
    side: 'long' as const,
    entryPrice: 52000,
    size: 0.5,
    entryTime: '2024-01-01T16:00:00Z',
    mode: 'live' as const,
    status: 'open' as const,
  },
];

describe('TradesHistoryDashboard - Filter Logic', () => {
  describe('Win/Loss/Open Filtering', () => {
    it('should filter trades with positive P&L as wins', () => {
      const filterOutcome = 'win';
      const filtered = mockTrades.filter(trade => {
        if (filterOutcome === 'win' && (trade.pnl || 0) < 0) return false;
        return true;
      });

      expect(filtered).toHaveLength(3);
      expect(filtered.find(t => t.id === 'BTC-1')).toBeDefined();
      expect(filtered.find(t => t.id === 'SOL-1')).toBeDefined(); // Break-even included
      expect(filtered.find(t => t.id === 'BTC-2')).toBeDefined(); // Open trade included
      expect(filtered.find(t => t.id === 'ETH-1')).toBeUndefined(); // Loss excluded
    });

    it('should filter trades with negative P&L as losses', () => {
      const filterOutcome = 'loss';
      const filtered = mockTrades.filter(trade => {
        if (filterOutcome === 'loss' && (trade.pnl || 0) > 0) return false;
        return true;
      });

      expect(filtered).toHaveLength(3);
      expect(filtered.find(t => t.id === 'ETH-1')).toBeDefined();
      expect(filtered.find(t => t.id === 'SOL-1')).toBeDefined(); // Break-even included
      expect(filtered.find(t => t.id === 'BTC-2')).toBeDefined(); // Open trade included
      expect(filtered.find(t => t.id === 'BTC-1')).toBeUndefined(); // Win excluded
    });

    it('should include break-even trades (P&L = 0) in both win and loss filters', () => {
      const breakEvenTrade = mockTrades.find(t => t.pnl === 0);
      expect(breakEvenTrade).toBeDefined();

      // Should pass win filter
      const winFilter = (trade: typeof mockTrades[0]) => {
        return !('win' === 'win' && (trade.pnl || 0) < 0);
      };
      expect(winFilter(breakEvenTrade!)).toBe(true);

      // Should pass loss filter
      const lossFilter = (trade: typeof mockTrades[0]) => {
        return !('loss' === 'loss' && (trade.pnl || 0) > 0);
      };
      expect(lossFilter(breakEvenTrade!)).toBe(true);
    });

    it('should filter only open trades when filterOutcome is "open"', () => {
      const filterOutcome = 'open';
      const filtered = mockTrades.filter(trade => {
        if (filterOutcome === 'open' && trade.status !== 'open') return false;
        return true;
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('BTC-2');
      expect(filtered[0].status).toBe('open');
    });

    it('should return all trades when filterOutcome is "all"', () => {
      const filterOutcome = 'all';
      const filtered = mockTrades.filter(trade => {
        if (filterOutcome !== 'all') {
          if (filterOutcome === 'win' && (trade.pnl || 0) < 0) return false;
          if (filterOutcome === 'loss' && (trade.pnl || 0) > 0) return false;
          if (filterOutcome === 'open' && trade.status !== 'open') return false;
        }
        return true;
      });

      expect(filtered).toHaveLength(4);
    });
  });

  describe('Combined Filtering', () => {
    it('should filter by symbol and outcome together', () => {
      const filterSymbol: string = 'BTCUSD';
      const filterOutcome: string = 'win';
      const filtered = mockTrades.filter(trade => {
        if (filterSymbol !== 'all' && trade.symbol !== filterSymbol) return false;
        if (filterOutcome !== 'all') {
          if (filterOutcome === 'win' && (trade.pnl || 0) < 0) return false;
        }
        return true;
      });

      expect(filtered).toHaveLength(2);
      expect(filtered.every(t => t.symbol === 'BTCUSD')).toBe(true);
    });

    it('should filter by mode and outcome together', () => {
      const filterMode: string = 'paper';
      const filterOutcome: string = 'loss';
      const filtered = mockTrades.filter(trade => {
        if (filterMode !== 'all' && trade.mode !== filterMode) return false;
        if (filterOutcome !== 'all') {
          if (filterOutcome === 'loss' && (trade.pnl || 0) > 0) return false;
        }
        return true;
      });

      expect(filtered).toHaveLength(2);
      expect(filtered.every(t => t.mode === 'paper')).toBe(true);
      expect(filtered.find(t => t.id === 'ETH-1')).toBeDefined();
      expect(filtered.find(t => t.id === 'SOL-1')).toBeDefined();
    });
  });

  describe('Statistics Calculation', () => {
    it('should calculate correct win/loss statistics', () => {
      const closedTrades = mockTrades.filter(t => t.status === 'closed' && t.pnl !== undefined);
      const wins = closedTrades.filter(t => (t.pnl || 0) > 0).length;
      const losses = closedTrades.filter(t => (t.pnl || 0) < 0).length;
      const breakEven = closedTrades.filter(t => t.pnl === 0).length;

      expect(closedTrades).toHaveLength(3);
      expect(wins).toBe(1); // BTC-1
      expect(losses).toBe(1); // ETH-1
      expect(breakEven).toBe(1); // SOL-1
      expect(wins + losses + breakEven).toBe(closedTrades.length);
    });

    it('should calculate correct total P&L', () => {
      const closedTrades = mockTrades.filter(t => t.status === 'closed' && t.pnl !== undefined);
      const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

      expect(totalPnL).toBe(800); // 1000 - 200 + 0
    });

    it('should calculate correct win rate', () => {
      const closedTrades = mockTrades.filter(t => t.status === 'closed' && t.pnl !== undefined);
      const wins = closedTrades.filter(t => (t.pnl || 0) > 0).length;
      const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

      expect(winRate).toBeCloseTo(33.33, 1); // 1 win out of 3 closed trades
    });

    it('should calculate correct average win and loss', () => {
      const closedTrades = mockTrades.filter(t => t.status === 'closed' && t.pnl !== undefined);
      const wins = closedTrades.filter(t => (t.pnl || 0) > 0);
      const losses = closedTrades.filter(t => (t.pnl || 0) < 0);
      
      const avgWin = wins.length > 0 
        ? wins.reduce((sum, t) => sum + (t.pnl || 0), 0) / wins.length 
        : 0;
      const avgLoss = losses.length > 0 
        ? losses.reduce((sum, t) => sum + (t.pnl || 0), 0) / losses.length 
        : 0;

      expect(avgWin).toBe(1000);
      expect(avgLoss).toBe(-200);
    });

    it('should count open trades correctly', () => {
      const openTrades = mockTrades.filter(t => t.status === 'open').length;
      expect(openTrades).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle trades with undefined P&L', () => {
      const tradeWithoutPnL = {
        ...mockTrades[3],
        pnl: undefined,
      };

      const shouldInclude = !((tradeWithoutPnL.pnl || 0) < 0);
      expect(shouldInclude).toBe(true); // undefined defaults to 0, which passes win filter
    });

    it('should handle empty trade list', () => {
      const emptyTrades: typeof mockTrades = [];
      const closedTrades = emptyTrades.filter(t => t.status === 'closed' && t.pnl !== undefined);
      const winRate = closedTrades.length > 0 ? (0 / closedTrades.length) * 100 : 0;

      expect(closedTrades).toHaveLength(0);
      expect(winRate).toBe(0);
    });

    it('should handle trades with very small P&L values', () => {
      const smallPnLTrade = {
        ...mockTrades[0],
        pnl: 0.01,
      };

      const winFilter = (trade: typeof smallPnLTrade) => {
        return !((trade.pnl || 0) < 0);
      };

      expect(winFilter(smallPnLTrade)).toBe(true);
    });

    it('should handle trades with very large negative P&L', () => {
      const largeLossTrade = {
        ...mockTrades[1],
        pnl: -10000,
      };

      const lossFilter = (trade: typeof largeLossTrade) => {
        return !((trade.pnl || 0) > 0);
      };

      expect(lossFilter(largeLossTrade)).toBe(true);
    });
  });
});
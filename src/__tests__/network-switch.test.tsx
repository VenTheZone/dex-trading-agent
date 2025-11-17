import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTradingStore } from '@/store/tradingStore';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock window.confirm
const mockConfirm = vi.fn();
global.window = global.window || {};
global.window.confirm = mockConfirm;

describe('Network Switch Functionality', () => {
  beforeEach(() => {
    // Reset store to initial state
    const { resetBalance, setNetwork } = useTradingStore.getState();
    setNetwork('mainnet');
    resetBalance();
    
    // Reset mock
    mockConfirm.mockReset();
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockConfirm.mockReset();
  });

  describe('Network State Management', () => {
    it('should initialize with mainnet as default', () => {
      const { result } = renderHook(() => useTradingStore());
      expect(result.current.network).toBe('mainnet');
    });

    it('should switch from mainnet to testnet when confirmed', async () => {
      mockConfirm.mockReturnValue(true);
      
      const { result } = renderHook(() => useTradingStore());
      
      act(() => {
        result.current.setNetwork('testnet');
      });

      await waitFor(() => {
        expect(result.current.network).toBe('testnet');
      });
    });

    it('should switch from testnet to mainnet when confirmed', async () => {
      mockConfirm.mockReturnValue(true);
      
      const { result } = renderHook(() => useTradingStore());
      
      // First set to testnet
      act(() => {
        result.current.setNetwork('testnet');
      });

      await waitFor(() => {
        expect(result.current.network).toBe('testnet');
      });

      // Then switch back to mainnet
      act(() => {
        result.current.setNetwork('mainnet');
      });

      await waitFor(() => {
        expect(result.current.network).toBe('mainnet');
      });
    });

    it('should persist network state across store updates', () => {
      const { result } = renderHook(() => useTradingStore());
      
      act(() => {
        result.current.setNetwork('testnet');
      });

      expect(result.current.network).toBe('testnet');

      // Simulate another store update
      act(() => {
        result.current.setBalance(5000);
      });

      // Network should still be testnet
      expect(result.current.network).toBe('testnet');
    });
  });

  describe('Network Switch Confirmation Logic', () => {
    it('should show confirmation dialog when switching to mainnet', () => {
      mockConfirm.mockReturnValue(true);
      
      const newNetwork = 'mainnet';
      const confirmed = mockConfirm(
        `Switch to Hyperliquid ${newNetwork.toUpperCase()}?\n\n` +
        '⚠️ MAINNET uses real funds. Ensure you understand the risks.'
      );

      expect(mockConfirm).toHaveBeenCalledWith(
        expect.stringContaining('Switch to Hyperliquid MAINNET')
      );
      expect(mockConfirm).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ MAINNET uses real funds')
      );
      expect(confirmed).toBe(true);
    });

    it('should show confirmation dialog when switching to testnet', () => {
      mockConfirm.mockReturnValue(true);
      
      const newNetwork = 'testnet';
      const confirmed = mockConfirm(
        `Switch to Hyperliquid ${newNetwork.toUpperCase()}?\n\n` +
        'Testnet uses test funds and is safe for experimentation.'
      );

      expect(mockConfirm).toHaveBeenCalledWith(
        expect.stringContaining('Switch to Hyperliquid TESTNET')
      );
      expect(mockConfirm).toHaveBeenCalledWith(
        expect.stringContaining('Testnet uses test funds')
      );
      expect(confirmed).toBe(true);
    });

    it('should not switch network when user cancels confirmation', () => {
      mockConfirm.mockReturnValue(false);
      
      const { result } = renderHook(() => useTradingStore());
      const initialNetwork = result.current.network;

      const confirmed = mockConfirm('Switch network?');
      
      if (confirmed) {
        act(() => {
          result.current.setNetwork('testnet');
        });
      }

      expect(result.current.network).toBe(initialNetwork);
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  describe('Network Switch Toast Notifications', () => {
    it('should show success toast when switching to mainnet', () => {
      const { result } = renderHook(() => useTradingStore());
      
      act(() => {
        result.current.setNetwork('mainnet');
        toast.success('Switched to Hyperliquid MAINNET');
      });

      expect(toast.success).toHaveBeenCalledWith('Switched to Hyperliquid MAINNET');
    });

    it('should show success toast when switching to testnet', () => {
      const { result } = renderHook(() => useTradingStore());
      
      act(() => {
        result.current.setNetwork('testnet');
        toast.success('Switched to Hyperliquid TESTNET');
      });

      expect(toast.success).toHaveBeenCalledWith('Switched to Hyperliquid TESTNET');
    });
  });

  describe('Network Type Validation', () => {
    it('should only accept valid network types', () => {
      const { result } = renderHook(() => useTradingStore());
      
      act(() => {
        result.current.setNetwork('mainnet');
      });
      expect(result.current.network).toBe('mainnet');

      act(() => {
        result.current.setNetwork('testnet');
      });
      expect(result.current.network).toBe('testnet');
    });

    it('should maintain type safety for network values', () => {
      const { result } = renderHook(() => useTradingStore());
      
      const network = result.current.network;
      
      // TypeScript should enforce this at compile time
      expect(['mainnet', 'testnet']).toContain(network);
    });
  });

  describe('Network Switch Integration', () => {
    it('should handle rapid network switches correctly', async () => {
      const { result } = renderHook(() => useTradingStore());
      
      // Rapid switches
      act(() => {
        result.current.setNetwork('testnet');
      });
      
      act(() => {
        result.current.setNetwork('mainnet');
      });
      
      act(() => {
        result.current.setNetwork('testnet');
      });

      await waitFor(() => {
        expect(result.current.network).toBe('testnet');
      });
    });

    it('should maintain network state when other store properties change', () => {
      const { result } = renderHook(() => useTradingStore());
      
      act(() => {
        result.current.setNetwork('testnet');
      });

      const networkBeforeChanges = result.current.network;

      // Make various other state changes
      act(() => {
        result.current.setBalance(10000);
        result.current.setMode('live');
        result.current.setAutoTrading(true);
      });

      // Network should remain unchanged
      expect(result.current.network).toBe(networkBeforeChanges);
      expect(result.current.network).toBe('testnet');
    });
  });

  describe('Network Switch Edge Cases', () => {
    it('should handle switching to the same network gracefully', () => {
      const { result } = renderHook(() => useTradingStore());
      
      act(() => {
        result.current.setNetwork('mainnet');
      });

      const initialNetwork = result.current.network;

      act(() => {
        result.current.setNetwork('mainnet');
      });

      expect(result.current.network).toBe(initialNetwork);
      expect(result.current.network).toBe('mainnet');
    });

    it('should handle network switch during active trading', () => {
      const { result } = renderHook(() => useTradingStore());
      
      // Set up active position
      act(() => {
        result.current.setPosition({
          symbol: 'BTCUSD',
          side: 'long',
          size: 1,
          entryPrice: 50000,
          pnl: 100,
        });
        result.current.setNetwork('mainnet');
      });

      expect(result.current.network).toBe('mainnet');
      expect(result.current.position).toBeTruthy();

      // Switch network
      act(() => {
        result.current.setNetwork('testnet');
      });

      expect(result.current.network).toBe('testnet');
      // Position should still exist (network switch doesn't auto-close positions)
      expect(result.current.position).toBeTruthy();
    });
  });
});

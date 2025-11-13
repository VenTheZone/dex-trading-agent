import { useState, useEffect, useCallback } from 'react';
import { pythonApi, ApiResponse } from '@/lib/python-api-client';

/**
 * Hook for fetching trading logs from Python backend
 */
export function useTradingLogs(limit: number = 50) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const response = await pythonApi.getTradingLogs(limit);
    if (response.success && response.data) {
      setLogs(response.data);
      setError(null);
    } else {
      setError(response.error || 'Failed to fetch logs');
    }
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    fetchLogs();
    // Poll every 5 seconds for updates
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const clearLogs = useCallback(async () => {
    const response = await pythonApi.clearTradingLogs();
    if (response.success) {
      setLogs([]);
      return true;
    }
    return false;
  }, []);

  return { logs, loading, error, refetch: fetchLogs, clearLogs };
}

/**
 * Hook for fetching balance history from Python backend
 */
export function useBalanceHistory(limit: number = 100) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const response = await pythonApi.getBalanceHistory(limit);
    if (response.success && response.data) {
      setHistory(response.data);
      setError(null);
    } else {
      setError(response.error || 'Failed to fetch balance history');
    }
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    fetchHistory();
    // Poll every 10 seconds for updates
    const interval = setInterval(fetchHistory, 10000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  return { history, loading, error, refetch: fetchHistory };
}

/**
 * Hook for fetching position snapshots from Python backend
 */
export function usePositionHistory(symbol?: string, limit: number = 100) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const response = await pythonApi.getPositionHistory(symbol, limit);
    if (response.success && response.data) {
      setHistory(response.data);
      setError(null);
    } else {
      setError(response.error || 'Failed to fetch position history');
    }
    setLoading(false);
  }, [symbol, limit]);

  useEffect(() => {
    fetchHistory();
    // Poll every 10 seconds for updates
    const interval = setInterval(fetchHistory, 10000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  return { history, loading, error, refetch: fetchHistory };
}

/**
 * Hook for WebSocket real-time updates
 */
export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    const ws = pythonApi.connectWebSocket(
      (data) => {
        setLastMessage(data);
        setConnected(true);
      },
      () => {
        setConnected(false);
      }
    );

    return () => {
      ws.close();
    };
  }, []);

  return { connected, lastMessage };
}

/**
 * Python FastAPI Backend Client
 * Replaces Convex backend calls with HTTP requests to FastAPI
 */

const API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TradingLog {
  id: number;
  action: string;
  symbol: string;
  reason: string;
  details?: string;
  price?: number;
  size?: number;
  side?: 'long' | 'short';
  created_at: string;
}

export interface BalanceHistory {
  id: number;
  balance: number;
  mode: 'paper' | 'live';
  created_at: string;
}

export interface PositionSnapshot {
  id: number;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entry_price: number;
  current_price: number;
  unrealized_pnl: number;
  leverage: number;
  mode: 'paper' | 'live';
  created_at: string;
}

export interface AIAnalysisRequest {
  apiKey: string;
  charts: Array<{
    symbol: string;
    currentPrice: number;
    chartType: 'time' | 'range';
    chartInterval: string;
  }>;
  userBalance: number;
  settings: {
    takeProfitPercent: number;
    stopLossPercent: number;
    useAdvancedStrategy: boolean;
    leverage: number;
    allowAILeverage: boolean;
  };
  isDemoMode?: boolean;
  aiModel?: string;
  customPrompt?: string;
}

export interface AIAnalysisResponse {
  recommendedSymbol: string;
  action: 'open_long' | 'open_short' | 'close' | 'hold';
  confidence: number;
  reasoning: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
}

class PythonApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error(`API request failed [${endpoint}]:`, error);
      return { success: false, error: error.message };
    }
  }

  // Trading Logs
  async getTradingLogs(limit: number = 50): Promise<ApiResponse<TradingLog[]>> {
    return this.request<TradingLog[]>(`/api/trading-logs?limit=${limit}`);
  }

  async createTradingLog(log: Omit<TradingLog, 'id' | 'created_at'>): Promise<ApiResponse<TradingLog>> {
    return this.request<TradingLog>('/api/trading-logs', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  }

  async clearTradingLogs(): Promise<ApiResponse<void>> {
    return this.request<void>('/api/trading-logs', {
      method: 'DELETE',
    });
  }

  // Balance History
  async getBalanceHistory(limit: number = 100): Promise<ApiResponse<BalanceHistory[]>> {
    return this.request<BalanceHistory[]>(`/api/balance-history?limit=${limit}`);
  }

  async recordBalance(balance: number, mode: 'paper' | 'live'): Promise<ApiResponse<BalanceHistory>> {
    return this.request<BalanceHistory>('/api/balance-history', {
      method: 'POST',
      body: JSON.stringify({ balance, mode }),
    });
  }

  // Position Snapshots
  async getPositionHistory(symbol?: string, limit: number = 100): Promise<ApiResponse<PositionSnapshot[]>> {
    const params = new URLSearchParams();
    if (symbol) params.append('symbol', symbol);
    params.append('limit', limit.toString());
    return this.request<PositionSnapshot[]>(`/api/position-snapshots?${params}`);
  }

  async recordPositionSnapshot(snapshot: Omit<PositionSnapshot, 'id' | 'created_at'>): Promise<ApiResponse<PositionSnapshot>> {
    return this.request<PositionSnapshot>('/api/position-snapshots', {
      method: 'POST',
      body: JSON.stringify(snapshot),
    });
  }

  // AI Trading Analysis
  async analyzeMultipleCharts(request: AIAnalysisRequest): Promise<ApiResponse<AIAnalysisResponse>> {
    return this.request<AIAnalysisResponse>('/api/ai/analyze-multi-chart', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Hyperliquid Integration
  async testHyperliquidConnection(isTestnet: boolean = false): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/hyperliquid/test-connection?isTestnet=${isTestnet}`);
  }

  async getHyperliquidAccountInfo(walletAddress: string, isTestnet: boolean = false): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/hyperliquid/account-info?walletAddress=${walletAddress}&isTestnet=${isTestnet}`);
  }

  async getOrderBook(coin: string, isTestnet: boolean = false): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/hyperliquid/orderbook?coin=${coin}&isTestnet=${isTestnet}`);
  }

  // Paper Trading
  async executePaperTrade(trade: {
    symbol: string;
    side: 'buy' | 'sell';
    size: number;
    price: number;
    type: 'market' | 'limit';
    stopLoss?: number;
    takeProfit?: number;
    leverage: number;
  }): Promise<ApiResponse<any>> {
    return this.request<any>('/api/paper-trading/execute', {
      method: 'POST',
      body: JSON.stringify(trade),
    });
  }

  async getPaperPositions(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/paper-trading/positions');
  }

  async closePaperPosition(symbol: string, price: number, reason: string): Promise<ApiResponse<any>> {
    return this.request<any>('/api/paper-trading/close-position', {
      method: 'POST',
      body: JSON.stringify({ symbol, price, reason }),
    });
  }

  // WebSocket connection for real-time updates
  connectWebSocket(onMessage: (data: any) => void, onError?: (error: Event) => void): WebSocket {
    const wsUrl = this.baseUrl.replace('http', 'ws') + '/ws';
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (onError) onError(error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return ws;
  }
}

export const pythonApi = new PythonApiClient();

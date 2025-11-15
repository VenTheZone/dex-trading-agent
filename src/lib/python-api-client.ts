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
  mode?: 'paper' | 'live' | 'demo';
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
  symbol?: string;
  chartData?: string;
  charts?: Array<{
    symbol: string;
    currentPrice: number;
    chartType: 'time' | 'range';
    chartInterval: string;
    technicalContext?: string;
    // Perpetual futures specific data
    markPrice?: number;
    indexPrice?: number;
    fundingRate?: number;
    nextFundingTime?: number;
    openInterest?: number;
    longShortRatio?: number;
  }>;
  userBalance: number;
  settings: {
    takeProfitPercent: number;
    stopLossPercent: number;
    useAdvancedStrategy: boolean;
    leverage?: number;
    allowAILeverage?: boolean;
  };
  isDemoMode?: boolean;
  aiModel?: string;
  customPrompt?: string;
}

export interface AIAnalysisResponse {
  recommendedSymbol?: string;
  action: 'open_long' | 'open_short' | 'close' | 'hold';
  confidence: number;
  reasoning: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
  marketContext?: string;
  // Perpetual futures specific recommendations
  liquidationPrice?: number;
  estimatedFundingCost?: number;
  riskRewardRatio?: number;
}

export interface HyperliquidConnectionTestResponse {
  success: boolean;
  message: string;
  apiEndpoint?: string;
  appUrl?: string;
  assetsCount?: number;
  availableAssets?: string;
  error?: string;
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
      console.info(`[API] ${options.method || 'GET'} ${endpoint}`);
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.detail || `HTTP ${response.status}: ${response.statusText}`;
        console.error(`[API Error] ${endpoint}:`, errorMsg);
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.info(`[API Success] ${endpoint}`);
      return { success: true, data };
    } catch (error: any) {
      console.error(`[API Failed] ${endpoint}:`, error.message);
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

  async recordBalance(balance: number, mode: 'paper' | 'live' | 'demo'): Promise<ApiResponse<BalanceHistory>> {
    // Convert demo to paper for backend compatibility
    const backendMode = mode === 'demo' ? 'paper' : mode;
    return this.request<BalanceHistory>('/api/balance-history', {
      method: 'POST',
      body: JSON.stringify({ balance, mode: backendMode }),
    });
  }

  // Position Snapshots
  async getPositionHistory(symbol?: string, limit: number = 100): Promise<ApiResponse<PositionSnapshot[]>> {
    const params = new URLSearchParams();
    if (symbol) params.append('symbol', symbol);
    params.append('limit', limit.toString());
    return this.request<PositionSnapshot[]>(`/api/v1/positions/history?${params}`);
  }

  async recordPositionSnapshot(snapshot: {
    symbol: string;
    side: 'long' | 'short';
    size: number;
    entry_price: number;
    current_price: number;
    unrealized_pnl: number;
    leverage: number;
    mode: 'paper' | 'live' | 'demo';
  }): Promise<ApiResponse<PositionSnapshot>> {
    // Convert demo to paper for backend compatibility
    const backendMode = snapshot.mode === 'demo' ? 'paper' : snapshot.mode;
    return this.request<PositionSnapshot>('/api/v1/positions/snapshot', {
      method: 'POST',
      body: JSON.stringify({ ...snapshot, mode: backendMode }),
    });
  }

  // AI Trading Analysis - Single Chart
  async analyzeMarket(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const response = await this.request<AIAnalysisResponse>('/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'AI analysis failed');
    }
    return response.data;
  }

  // AI Trading Analysis - Multi Chart
  async analyzeMultiChart(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const response = await this.request<AIAnalysisResponse>('/api/ai/analyze-multi-chart', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Multi-chart AI analysis failed');
    }
    return response.data;
  }

  // Hyperliquid Integration
  async testHyperliquidConnection(isTestnet: boolean = false): Promise<HyperliquidConnectionTestResponse> {
    const response = await this.request<HyperliquidConnectionTestResponse>(`/api/hyperliquid/test-connection?isTestnet=${isTestnet}`);
    return response.data || { success: false, message: response.error || 'Connection test failed' };
  }

  async getHyperliquidPositions(apiSecret: string, walletAddress: string, isTestnet: boolean = false): Promise<ApiResponse<any>> {
    return this.request<any>('/api/hyperliquid/positions', {
      method: 'POST',
      body: JSON.stringify({ apiSecret, walletAddress, isTestnet }),
    });
  }

  async getOrderBook(coin: string, isTestnet: boolean = false): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/hyperliquid/orderbook?coin=${coin}&isTestnet=${isTestnet}`);
  }

  async getAccountInfo(params: { walletAddress: string; isTestnet: boolean }): Promise<ApiResponse<any>> {
    return this.request('/api/hyperliquid/account-info', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async fetchCryptoNews(params: { filter: string; currencies: string[]; limit: number }): Promise<ApiResponse<any>> {
    return this.request('/api/news/crypto', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Live Trading
  async executeLiveTrade(trade: {
    apiSecret: string;
    symbol: string;
    side: 'buy' | 'sell';
    size: number;
    price: number;
    stopLoss?: number;
    takeProfit?: number;
    leverage: number;
    isTestnet: boolean;
  }): Promise<ApiResponse<any>> {
    return this.request<any>('/api/hyperliquid/execute-trade', {
      method: 'POST',
      body: JSON.stringify(trade),
    });
  }

  // Price Fetching
  async fetchPrice(symbol: string, isTestnet: boolean = false): Promise<number> {
    const response = await this.request<{ price: number }>(`/api/market/price?symbol=${symbol}&isTestnet=${isTestnet}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || `Failed to fetch price for ${symbol}`);
    }
    return response.data.price;
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
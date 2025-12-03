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
  network?: 'mainnet' | 'testnet';
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

export interface BacktestLog {
  timestamp: string;
  event_type: string;
  message: string;
  data: any;
}

export type SnapshotType = 'fast' | 'full';

import type { NetworkType } from './constants';

interface SnapshotCache {
  data: any;
  timestamp: number;
  symbols: string[];
  type: SnapshotType; // Track snapshot type
  network: NetworkType; // Track network to prevent cross-network cache pollution
}

interface SnapshotCacheMetrics {
  hits: number;
  misses: number;
  invalidations: number;
  lastReset: number;
  fastSnapshots: number; // Track fast snapshot usage
  fullSnapshots: number; // Track full snapshot usage
}

const SNAPSHOT_CACHE_DURATION = 5000; // 5 seconds cache
let snapshotCache: SnapshotCache | null = null;
const snapshotMetrics: SnapshotCacheMetrics = {
  hits: 0,
  misses: 0,
  invalidations: 0,
  lastReset: Date.now(),
  fastSnapshots: 0,
  fullSnapshots: 0,
};

import { validateNetwork, networkToBoolean, validateSymbol, validateAddress, validateApiKey } from './constants';

class PythonApiClient {
  private baseUrl: string;
  private defaultTimeout: number = 30000; // 30 seconds default timeout

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const method = options.method || 'GET';
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout);
    
    try {
      console.info(`[API Request] ${method} ${endpoint}`, {
        timestamp: new Date().toISOString(),
        hasBody: !!options.body,
      });
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.detail || `HTTP ${response.status}: ${response.statusText}`;
        
        console.error(`[API Error] ${method} ${endpoint}`, {
          status: response.status,
          statusText: response.statusText,
          error: errorMsg,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
          endpoint,
          method,
        });
        
        throw new Error(errorMsg);
      }

      const data = await response.json();
      
      console.info(`[API Success] ${method} ${endpoint}`, {
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });
      
      return { success: true, data };
    } catch (error: any) {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      
      // Handle timeout specifically
      if (error.name === 'AbortError') {
        console.error(`[API Timeout] ${method} ${endpoint}`, {
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        });
        return { success: false, error: 'Request timed out' };
      }
      
      console.error(`[API Failed] ${method} ${endpoint}`, {
        error: error.message,
        errorType: error.name,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        endpoint,
        method,
        stack: error.stack,
      });
      
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
    // Validation
    if (!request.apiKey && !request.isDemoMode) {
      // API key might be optional if handled by backend env, but usually required for client requests if not proxied with auth
      // checking if empty string if provided
    }
    if (request.userBalance < 0) {
      throw new Error('Invalid user balance: must be non-negative');
    }
    if (request.settings.leverage && (request.settings.leverage < 1 || request.settings.leverage > 100)) {
      throw new Error('Invalid leverage: must be between 1 and 100');
    }

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
    // Validation
    if (!request.charts || request.charts.length === 0) {
      throw new Error('Invalid request: No charts provided for multi-chart analysis');
    }
    if (request.userBalance < 0) {
      throw new Error('Invalid user balance: must be non-negative');
    }

    const response = await this.request<AIAnalysisResponse>('/api/ai/analyze-multi-chart', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Multi-chart AI analysis failed');
    }
    return response.data;
  }

  // Hyperliquid Integration - Mainnet
  async testHyperliquidConnection(isTestnet: boolean = false): Promise<HyperliquidConnectionTestResponse> {
    try {
      // Validate network parameter
      const network = validateNetwork(isTestnet);
      const isTestnetValidated = networkToBoolean(network);
      
      console.info(`[Hyperliquid Connection Test] Starting test for ${network}`, {
        network,
        isTestnet: isTestnetValidated,
        timestamp: new Date().toISOString(),
      });
      
      const endpoint = isTestnetValidated 
        ? '/api/hyperliquid/testnet/test-connection'
        : '/api/hyperliquid/mainnet/test-connection';
      const response = await this.request<HyperliquidConnectionTestResponse>(endpoint);
      
      if (!response.success) {
        console.error(`[Hyperliquid Connection Test] Failed for ${network}`, {
          network,
          error: response.error,
          endpoint,
          timestamp: new Date().toISOString(),
        });
        
        return { 
          success: false, 
          message: response.error || 'Connection test failed',
          error: response.error 
        };
      }
      
      console.info(`[Hyperliquid Connection Test] Success for ${network}`, {
        network,
        assetsCount: response.data?.assetsCount,
        timestamp: new Date().toISOString(),
      });
      
      return response.data || { success: false, message: 'No data returned from connection test' };
    } catch (error: any) {
      console.error('[Hyperliquid Connection Test] Exception', {
        error: error.message,
        errorType: error.name,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
      
      return { 
        success: false, 
        message: 'Connection test failed with exception',
        error: error.message 
      };
    }
  }

  async getHyperliquidPositions(apiSecret: string, walletAddress: string, isTestnet: boolean = false): Promise<ApiResponse<any>> {
    try {
      // Validate inputs using centralized validators
      try {
        validateApiKey(apiSecret);
        validateAddress(walletAddress);
      } catch (validationError: any) {
        console.error('[Get Positions] Validation failed', { error: validationError.message });
        return { success: false, error: validationError.message };
      }
      
      // Validate network parameter
      const network = validateNetwork(isTestnet);
      const isTestnetValidated = networkToBoolean(network);
      
      console.info('[Get Positions] Fetching positions', {
        network,
        walletAddress: `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`,
        timestamp: new Date().toISOString(),
      });
      
      const endpoint = isTestnetValidated
        ? '/api/hyperliquid/testnet/positions'
        : '/api/hyperliquid/mainnet/positions';
      
      const response = await this.request<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify({ apiSecret, walletAddress }),
      });
      
      if (!response.success) {
        console.error(`[Get Positions] Failed for ${network}`, {
          network,
          error: response.error,
          endpoint,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.info(`[Get Positions] Success for ${network}`, {
          network,
          positionsCount: response.data?.assetPositions?.length || 0,
          timestamp: new Date().toISOString(),
        });
      }
      
      return response;
    } catch (error: any) {
      console.error('[Get Positions] Exception', {
        error: error.message,
        errorType: error.name,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
      return { success: false, error: `Failed to fetch positions: ${error.message}` };
    }
  }

  async getOrderBook(coin: string, isTestnet: boolean = false): Promise<ApiResponse<any>> {
    try {
      validateSymbol(coin);
    } catch (e: any) {
      return { success: false, error: e.message };
    }
    
    // Validate network parameter
    const network = validateNetwork(isTestnet);
    const isTestnetValidated = networkToBoolean(network);
    
    const endpoint = isTestnetValidated
      ? `/api/hyperliquid/testnet/orderbook?coin=${encodeURIComponent(coin)}`
      : `/api/hyperliquid/mainnet/orderbook?coin=${encodeURIComponent(coin)}`;
    return this.request<any>(endpoint);
  }

  async getAccountInfo(params: { walletAddress: string; isTestnet: boolean }): Promise<ApiResponse<any>> {
    try {
      validateAddress(params.walletAddress);
    } catch (e: any) {
      return { success: false, error: e.message };
    }
    
    // Validate network parameter
    const network = validateNetwork(params.isTestnet);
    const isTestnetValidated = networkToBoolean(network);
    
    const endpoint = isTestnetValidated
      ? '/api/hyperliquid/testnet/account-info'
      : '/api/hyperliquid/mainnet/account-info';
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify({ walletAddress: params.walletAddress }),
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
    try {
      // Validate trade parameters
      try {
        validateApiKey(trade.apiSecret);
        validateSymbol(trade.symbol);
      } catch (validationError: any) {
        return { success: false, error: validationError.message };
      }
      
      if (!['buy', 'sell'].includes(trade.side)) {
        return { success: false, error: 'Invalid side: must be "buy" or "sell"' };
      }
      
      if (typeof trade.size !== 'number' || trade.size <= 0) {
        return { success: false, error: 'Invalid size: must be a positive number' };
      }
      
      if (typeof trade.price !== 'number' || trade.price <= 0) {
        return { success: false, error: 'Invalid price: must be a positive number' };
      }
      
      if (typeof trade.leverage !== 'number' || trade.leverage < 1 || trade.leverage > 50) {
        return { success: false, error: 'Invalid leverage: must be between 1 and 50' };
      }
      
      // Validate network parameter
      const network = validateNetwork(trade.isTestnet);
      const isTestnetValidated = networkToBoolean(network);
      
      console.info(`[Execute Trade] Executing trade`, {
        side: trade.side.toUpperCase(),
        size: trade.size,
        symbol: trade.symbol,
        price: trade.price,
        leverage: trade.leverage,
        network,
        hasStopLoss: !!trade.stopLoss,
        hasTakeProfit: !!trade.takeProfit,
        timestamp: new Date().toISOString(),
      });
      
      const endpoint = isTestnetValidated
        ? '/api/hyperliquid/testnet/execute-trade'
        : '/api/hyperliquid/mainnet/execute-trade';
      
      // Remove isTestnet from the body since it's now in the endpoint
      const { isTestnet, ...tradeData } = trade;
      
      const response = await this.request<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify(tradeData),
      });
      
      if (!response.success) {
        console.error(`[Execute Trade] Failed on ${network}`, {
          network,
          symbol: trade.symbol,
          side: trade.side,
          error: response.error,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.info(`[Execute Trade] Success on ${network}`, {
          network,
          symbol: trade.symbol,
          side: trade.side,
          timestamp: new Date().toISOString(),
        });
      }
      
      return response;
    } catch (error: any) {
      console.error('[Execute Trade] Exception', {
        error: error.message,
        errorType: error.name,
        symbol: trade.symbol,
        side: trade.side,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
      return { success: false, error: `Trade execution failed: ${error.message}` };
    }
  }

  // Price Fetching
  async fetchPrice(symbol: string, isTestnet: boolean = false): Promise<number> {
    try {
      // Validate symbol parameter
      validateSymbol(symbol);
      
      // Validate network parameter
      const network = validateNetwork(isTestnet);
      const isTestnetValidated = networkToBoolean(network);
      
      console.info('[Fetch Price] Fetching price', {
        symbol,
        network,
        timestamp: new Date().toISOString(),
      });
      
      const endpoint = isTestnetValidated
        ? `/api/v1/market/testnet/price?symbol=${encodeURIComponent(symbol)}`
        : `/api/v1/market/mainnet/price?symbol=${encodeURIComponent(symbol)}`;
      
      const response = await this.request<{ price: number }>(endpoint);
      
      if (!response.success || !response.data) {
        console.error(`[Fetch Price] Failed for ${symbol} on ${network}`, {
          symbol,
          network,
          error: response.error,
          hasData: !!response.data,
          timestamp: new Date().toISOString(),
        });
        throw new Error(response.error || `Failed to fetch price for ${symbol}`);
      }
      
      if (typeof response.data.price !== 'number' || response.data.price <= 0) {
        console.error(`[Fetch Price] Invalid price data for ${symbol}`, {
          symbol,
          network,
          price: response.data.price,
          priceType: typeof response.data.price,
          timestamp: new Date().toISOString(),
        });
        throw new Error(`Invalid price data received for ${symbol}`);
      }
      
      console.info('[Fetch Price] Success', {
        symbol,
        network,
        price: response.data.price,
        timestamp: new Date().toISOString(),
      });
      
      return response.data.price;
    } catch (error: any) {
      console.error(`[Fetch Price] Exception for ${symbol}`, {
        symbol,
        error: error.message,
        errorType: error.name,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to fetch price for ${symbol}: ${error.message}`);
    }
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
    // Validation
    if (!trade.symbol) throw new Error('Invalid symbol');
    if (trade.size <= 0) throw new Error('Invalid size: must be positive');
    if (trade.price <= 0) throw new Error('Invalid price: must be positive');
    if (trade.leverage < 1) throw new Error('Invalid leverage: must be at least 1x');
    if (!['buy', 'sell'].includes(trade.side)) throw new Error('Invalid side');

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

  // Chart Snapshots with optimized fast/full strategy
  async getLatestSnapshots(params: {
    symbols?: string[];
    snapshotType?: SnapshotType;
    limit?: number;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params.symbols) queryParams.append('symbols', params.symbols.join(','));
    if (params.snapshotType) queryParams.append('snapshot_type', params.snapshotType);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    
    // Track snapshot type usage
    if (params.snapshotType === 'fast') {
      snapshotMetrics.fastSnapshots++;
    } else if (params.snapshotType === 'full') {
      snapshotMetrics.fullSnapshots++;
    }
    
    return this.request<any>(`/api/v1/snapshots/latest?${queryParams}`);
  }

  async getSnapshotsForAI(symbols: string[], snapshotType: SnapshotType = 'fast', network: NetworkType = 'mainnet'): Promise<any> {
    // Check cache first
    if (snapshotCache) {
      const age = Date.now() - snapshotCache.timestamp;
      const symbolsMatch = 
        snapshotCache.symbols.length === symbols.length &&
        snapshotCache.symbols.every(s => symbols.includes(s));
      const typeMatch = snapshotCache.type === snapshotType;
      const networkMatch = snapshotCache.network === network;
      
      if (age < SNAPSHOT_CACHE_DURATION && symbolsMatch && typeMatch && networkMatch) {
        snapshotMetrics.hits++;
        console.info(`[Snapshot Cache] HIT (age: ${age}ms, type: ${snapshotType}, symbols: ${symbols.join(',')})`, {
          cacheAge: age,
          snapshotType,
          symbolCount: symbols.length,
          timestamp: new Date().toISOString(),
        });
        return snapshotCache.data;
      } else {
        snapshotMetrics.invalidations++;
        const reason = !symbolsMatch ? 'symbols changed' : !typeMatch ? 'type changed' : !networkMatch ? 'network changed' : 'expired';
        console.info(`[Snapshot Cache] INVALIDATED (reason: ${reason})`, {
          reason,
          age,
          requestedType: snapshotType,
          cachedType: snapshotCache.type,
          requestedNetwork: network,
          cachedNetwork: snapshotCache.network,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Cache miss
    snapshotMetrics.misses++;
    console.info(`[Snapshot Cache] MISS (type: ${snapshotType}, network: ${network}, symbols: ${symbols.join(',')})`, {
      snapshotType,
      network,
      symbolCount: symbols.length,
      symbols,
      timestamp: new Date().toISOString(),
    });

    const isTestnet = networkToBoolean(network);
    const networkPath = isTestnet ? 'testnet' : 'mainnet';
    const response = await this.request<any>(
      `/api/v1/snapshots/${networkPath}/ai-analysis?symbols=${symbols.join(',')}&snapshot_type=${snapshotType}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch snapshots for AI analysis');
    }
    
    // Cache the result with type and network
    snapshotCache = {
      data: response.data,
      timestamp: Date.now(),
      symbols: [...symbols],
      type: snapshotType,
      network,
    };
    
    // Track snapshot type
    if (snapshotType === 'fast') {
      snapshotMetrics.fastSnapshots++;
    } else {
      snapshotMetrics.fullSnapshots++;
    }
    
    return response.data;
  }

  // Backtesting
  async runBacktest(params: {
    symbol: string;
    startDate: string;
    endDate: string;
    intervalMinutes: number;
    initialBalance: number;
    settings: any;
    priceData: any[];
  }): Promise<ApiResponse<any>> {
    // Validation
    if (!params.symbol) throw new Error('Invalid symbol');
    if (params.initialBalance <= 0) throw new Error('Initial balance must be positive');
    if (!params.priceData || params.priceData.length === 0) throw new Error('No price data provided for backtest');
    if (new Date(params.startDate) >= new Date(params.endDate)) throw new Error('Start date must be before end date');

    return this.request<any>('/api/backtest/run', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getBacktestSampleData(symbol: string, days: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/backtest/sample-data?symbol=${symbol}&days=${days}`);
  }

  async getBacktestLogs(): Promise<ApiResponse<BacktestLog[]>> {
    return this.request<BacktestLog[]>('/api/backtest/logs');
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

// Export cache control functions
export function clearSnapshotCache() {
  snapshotCache = null;
  console.info('[Snapshot Cache] Cleared');
}

export function getSnapshotCacheAge(): number | null {
  return snapshotCache ? Date.now() - snapshotCache.timestamp : null;
}

/**
 * Get snapshot cache performance metrics with enhanced tracking
 */
export function getSnapshotCacheMetrics(): SnapshotCacheMetrics & { 
  hitRate: number; 
  totalRequests: number;
  fastSnapshotRate: number;
  fullSnapshotRate: number;
} {
  const totalRequests = snapshotMetrics.hits + snapshotMetrics.misses;
  const hitRate = totalRequests > 0 ? (snapshotMetrics.hits / totalRequests) * 100 : 0;
  const totalSnapshots = snapshotMetrics.fastSnapshots + snapshotMetrics.fullSnapshots;
  const fastSnapshotRate = totalSnapshots > 0 ? (snapshotMetrics.fastSnapshots / totalSnapshots) * 100 : 0;
  const fullSnapshotRate = totalSnapshots > 0 ? (snapshotMetrics.fullSnapshots / totalSnapshots) * 100 : 0;
  
  return {
    ...snapshotMetrics,
    hitRate: Math.round(hitRate * 100) / 100,
    totalRequests,
    fastSnapshotRate: Math.round(fastSnapshotRate * 100) / 100,
    fullSnapshotRate: Math.round(fullSnapshotRate * 100) / 100,
  };
}

/**
 * Reset snapshot cache metrics
 */
export function resetSnapshotCacheMetrics() {
  snapshotMetrics.hits = 0;
  snapshotMetrics.misses = 0;
  snapshotMetrics.invalidations = 0;
  snapshotMetrics.fastSnapshots = 0;
  snapshotMetrics.fullSnapshots = 0;
  snapshotMetrics.lastReset = Date.now();
  console.info('[Snapshot Cache Metrics] Reset');
}

/**
 * Log snapshot cache performance summary with enhanced metrics
 */
export function logSnapshotCachePerformance() {
  const metrics = getSnapshotCacheMetrics();
  const uptime = Math.round((Date.now() - metrics.lastReset) / 1000);
  
  console.info('[Snapshot Cache Performance]', {
    uptime: `${uptime}s`,
    hits: metrics.hits,
    misses: metrics.misses,
    invalidations: metrics.invalidations,
    hitRate: `${metrics.hitRate}%`,
    totalRequests: metrics.totalRequests,
    fastSnapshots: metrics.fastSnapshots,
    fullSnapshots: metrics.fullSnapshots,
    fastSnapshotRate: `${metrics.fastSnapshotRate}%`,
    fullSnapshotRate: `${metrics.fullSnapshotRate}%`,
  });
}
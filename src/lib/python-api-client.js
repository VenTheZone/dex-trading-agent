/**
 * Python FastAPI Backend Client
 * Replaces Convex backend calls with HTTP requests to FastAPI
 */
const API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';
class PythonApiClient {
    baseUrl;
    constructor(baseUrl = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }
    async request(endpoint, options = {}) {
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
        }
        catch (error) {
            console.error(`API request failed [${endpoint}]:`, error);
            return { success: false, error: error.message };
        }
    }
    // Trading Logs
    async getTradingLogs(limit = 50) {
        return this.request(`/api/trading-logs?limit=${limit}`);
    }
    async createTradingLog(log) {
        return this.request('/api/trading-logs', {
            method: 'POST',
            body: JSON.stringify(log),
        });
    }
    async clearTradingLogs() {
        return this.request('/api/trading-logs', {
            method: 'DELETE',
        });
    }
    // Balance History
    async getBalanceHistory(limit = 100) {
        return this.request(`/api/balance-history?limit=${limit}`);
    }
    async recordBalance(balance, mode) {
        // Convert demo to paper for backend compatibility
        const backendMode = mode === 'demo' ? 'paper' : mode;
        return this.request('/api/balance-history', {
            method: 'POST',
            body: JSON.stringify({ balance, mode: backendMode }),
        });
    }
    // Position Snapshots
    async getPositionHistory(symbol, limit = 100) {
        const params = new URLSearchParams();
        if (symbol)
            params.append('symbol', symbol);
        params.append('limit', limit.toString());
        return this.request(`/api/position-snapshots?${params}`);
    }
    async recordPositionSnapshot(snapshot) {
        // Convert demo to paper for backend compatibility
        const backendMode = snapshot.mode === 'demo' ? 'paper' : snapshot.mode;
        return this.request('/api/position-snapshots', {
            method: 'POST',
            body: JSON.stringify({ ...snapshot, mode: backendMode }),
        });
    }
    // AI Trading Analysis - Single Chart
    async analyzeMarket(request) {
        const response = await this.request('/api/ai/analyze', {
            method: 'POST',
            body: JSON.stringify(request),
        });
        if (!response.success || !response.data) {
            throw new Error(response.error || 'AI analysis failed');
        }
        return response.data;
    }
    // AI Trading Analysis - Multi Chart
    async analyzeMultiChart(request) {
        const response = await this.request('/api/ai/analyze-multi-chart', {
            method: 'POST',
            body: JSON.stringify(request),
        });
        if (!response.success || !response.data) {
            throw new Error(response.error || 'Multi-chart AI analysis failed');
        }
        return response.data;
    }
    // Hyperliquid Integration
    async testHyperliquidConnection(isTestnet = false) {
        const response = await this.request(`/api/hyperliquid/test-connection?isTestnet=${isTestnet}`);
        return response.data || { success: false, message: response.error || 'Connection test failed' };
    }
    async getHyperliquidPositions(apiSecret, walletAddress, isTestnet = false) {
        return this.request('/api/hyperliquid/positions', {
            method: 'POST',
            body: JSON.stringify({ apiSecret, walletAddress, isTestnet }),
        });
    }
    async getOrderBook(coin, isTestnet = false) {
        return this.request(`/api/hyperliquid/orderbook?coin=${coin}&isTestnet=${isTestnet}`);
    }
    async getAccountInfo(params) {
        return this.request('/api/hyperliquid/account-info', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }
    async fetchCryptoNews(params) {
        return this.request('/api/news/crypto', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }
    // Live Trading
    async executeLiveTrade(trade) {
        return this.request('/api/hyperliquid/execute-trade', {
            method: 'POST',
            body: JSON.stringify(trade),
        });
    }
    // Price Fetching
    async fetchPrice(symbol, isTestnet = false) {
        const response = await this.request(`/api/market/price?symbol=${symbol}&isTestnet=${isTestnet}`);
        if (!response.success || !response.data) {
            throw new Error(response.error || `Failed to fetch price for ${symbol}`);
        }
        return response.data.price;
    }
    // Paper Trading
    async executePaperTrade(trade) {
        return this.request('/api/paper-trading/execute', {
            method: 'POST',
            body: JSON.stringify(trade),
        });
    }
    async getPaperPositions() {
        return this.request('/api/paper-trading/positions');
    }
    async closePaperPosition(symbol, price, reason) {
        return this.request('/api/paper-trading/close-position', {
            method: 'POST',
            body: JSON.stringify({ symbol, price, reason }),
        });
    }
    // WebSocket connection for real-time updates
    connectWebSocket(onMessage, onError) {
        const wsUrl = this.baseUrl.replace('http', 'ws') + '/ws';
        const ws = new WebSocket(wsUrl);
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            }
            catch (error) {
                console.error('WebSocket message parse error:', error);
            }
        };
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            if (onError)
                onError(error);
        };
        ws.onclose = () => {
            console.log('WebSocket connection closed');
        };
        return ws;
    }
}
export const pythonApi = new PythonApiClient();

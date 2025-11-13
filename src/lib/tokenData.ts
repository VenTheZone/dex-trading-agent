export interface TokenData {
  symbol: string;
  pair: string;
  tradingLink: string;
  maxLeverage: number;
  tradingViewSymbol?: string; // Optional TradingView-specific symbol
}

export const TRADING_TOKENS: TokenData[] = [
  {
    symbol: 'BTC',
    pair: 'BTC-USDC',
    tradingLink: 'https://app.hyperliquid.xyz/trade/BTC',
    maxLeverage: 40,
    tradingViewSymbol: 'BTCUSD',
  },
  {
    symbol: 'ETH',
    pair: 'ETH-USDC',
    tradingLink: 'https://app.hyperliquid.xyz/trade/ETH',
    maxLeverage: 25,
    tradingViewSymbol: 'ETHUSD',
  },
  {
    symbol: 'SOL',
    pair: 'SOL-USDC',
    tradingLink: 'https://app.hyperliquid.xyz/trade/SOL',
    maxLeverage: 20,
    tradingViewSymbol: 'SOLUSD',
  },
  {
    symbol: 'ZEC',
    pair: 'ZEC-USDC',
    tradingLink: 'https://app.hyperliquid.xyz/trade/ZEC',
    maxLeverage: 10,
    tradingViewSymbol: 'ZECUSD',
  },
  {
    symbol: 'HYPE',
    pair: 'HYPE-USDC',
    tradingLink: 'https://app.hyperliquid.xyz/trade/HYPE',
    maxLeverage: 10,
    tradingViewSymbol: 'HYPEUSD',
  },
  {
    symbol: 'XRP',
    pair: 'XRP-USDC',
    tradingLink: 'https://app.hyperliquid.xyz/trade/XRP',
    maxLeverage: 20,
    tradingViewSymbol: 'XRPUSD',
  },
  {
    symbol: 'PUMP',
    pair: 'PUMP-USDC',
    tradingLink: 'https://app.hyperliquid.xyz/trade/PUMP',
    maxLeverage: 10,
    tradingViewSymbol: 'PUMPUSD',
  },
  {
    symbol: 'UNI',
    pair: 'UNI-USDC',
    tradingLink: 'https://app.hyperliquid.xyz/trade/UNI',
    maxLeverage: 10,
    tradingViewSymbol: 'UNIUSD',
  },
  {
    symbol: 'ASTER',
    pair: 'ASTER-USDC',
    tradingLink: 'https://app.hyperliquid.xyz/trade/ASTER',
    maxLeverage: 5,
    tradingViewSymbol: 'ASTERUSD',
  },
];

// Helper function to get TradingView symbol
export const getTradingViewSymbol = (symbol: string): string => {
  const token = TRADING_TOKENS.find(t => t.symbol === symbol);
  return token?.tradingViewSymbol || `${symbol}USD`;
};
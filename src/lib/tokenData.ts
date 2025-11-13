export interface TokenData {
  symbol: string;
  pair: string;
  tradingLink: string;
  maxLeverage: number;
}

export const TRADING_TOKENS: TokenData[] = [
  {
    symbol: 'BTC',
    pair: 'BTC-USDC',
    tradingLink: 'https://app.hyperliquid.xyz/trade/BTC',
    maxLeverage: 40,
  },
  {
    symbol: 'ETH',
    pair: 'ETH-USDC',
    tradingLink: 'https://app.hyperliquid.xyz/trade/ETH',
    maxLeverage: 25,
  },
  {
    symbol: 'SOL',
    pair: 'SOL-USDC',
    tradingLink: 'https://app.hyperliquid.xyz/trade/SOL',
    maxLeverage: 20,
  },
  {
    symbol: 'ZEC',
    pair: 'ZEC-USDC',
    tradingLink: 'https://app.hyperliquid.xyz/trade/ZEC',
    maxLeverage: 10,
  },
  {
    symbol: 'HYPE',
    pair: 'HYPE-USDC',
    tradingLink: 'https://app.hyperliquid.xyz/trade/HYPE',
    maxLeverage: 10,
  },
  {
    symbol: 'XRP',
    pair: 'XRP-USDC',
    tradingLink: 'https://app.hyperliquid.xyz/trade/XRP',
    maxLeverage: 20,
  },
  {
    symbol: 'PUMP',
    pair: 'PUMP-USDC',
    tradingLink: 'https://app.hyperliquid.xyz/trade/PUMP',
    maxLeverage: 10,
  },
  {
    symbol: 'UNI',
    pair: 'UNI-USDC',
    tradingLink: 'https://app.hyperliquid.xyz/trade/UNI',
    maxLeverage: 10,
  },
  {
    symbol: 'ASTER',
    pair: 'ASTER-USDC',
    tradingLink: 'https://app.hyperliquid.xyz/trade/ASTER',
    maxLeverage: 5,
  },
];

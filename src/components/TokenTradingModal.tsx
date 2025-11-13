import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { TrendingUp, BarChart3, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TokenData {
  symbol: string;
  pair: string;
  tradingLink: string;
  maxLeverage: number;
  tradingViewSymbol?: string;
}

interface TokenTradingModalProps {
  token: TokenData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TokenTradingModal({ token, isOpen, onClose }: TokenTradingModalProps) {
  const [timeInterval, setTimeInterval] = useState('15');
  const [rangeInterval, setRangeInterval] = useState('100');
  const [iframeError, setIframeError] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  if (!token) return null;

  const hyperliquidEmbedUrl = `${token.tradingLink}?embed=true`;

  const handleIframeError = () => {
    setIframeError(true);
    toast.error('Failed to load Hyperliquid trading interface', {
      description: 'Please check your internet connection or try again later.',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] bg-black/95 border-cyan-500/50 p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-cyan-500/30">
          <DialogTitle className="text-cyan-400 font-mono text-2xl flex items-center gap-3">
            <TrendingUp className="h-6 w-6" />
            {token.pair}
            <Badge variant="outline" className="ml-2 text-lg px-3 py-1 bg-purple-500/20 text-purple-400 border-purple-500">
              {token.maxLeverage}x Leverage
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6 overflow-auto custom-scrollbar" style={{ maxHeight: 'calc(95vh - 100px)' }}>
          {/* Hyperliquid Trading Interface */}
          <Card className="bg-black/80 border-cyan-500/30 overflow-hidden">
            <div className="p-4 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
              <h3 className="text-cyan-400 font-mono font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Live Trading Data - Volume & Orderbook
              </h3>
            </div>
            <div className="relative w-full" style={{ height: '600px' }}>
              {iframeError ? (
                <Alert className="m-4 bg-red-500/10 border-red-500/50">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-200">
                    <strong>Failed to load trading interface</strong>
                    <p className="mt-2 text-sm">
                      Unable to connect to Hyperliquid. Please check your internet connection or visit{' '}
                      <a href={token.tradingLink} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                        {token.tradingLink}
                      </a>{' '}
                      directly.
                    </p>
                  </AlertDescription>
                </Alert>
              ) : (
                <iframe
                  src={hyperliquidEmbedUrl}
                  className="w-full h-full border-0"
                  title={`${token.symbol} Trading Interface`}
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  onError={handleIframeError}
                />
              )}
            </div>
          </Card>

          {/* Chart Error Alert */}
          {chartError && (
            <Alert className="bg-yellow-500/10 border-yellow-500/50">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-200">
                <strong>Chart Loading Issue</strong>
                <p className="mt-1 text-sm">{chartError}</p>
              </AlertDescription>
            </Alert>
          )}

          {/* Chart Tabs */}
          <Card className="bg-black/80 border-cyan-500/30">
            <Tabs defaultValue="time" className="w-full">
              <div className="p-4 border-b border-cyan-500/30">
                <TabsList className="grid w-full grid-cols-2 bg-black/50">
                  <TabsTrigger 
                    value="time" 
                    className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-mono"
                  >
                    ⏱️ Time Charts
                  </TabsTrigger>
                  <TabsTrigger 
                    value="range" 
                    className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-mono"
                  >
                    📊 Range Charts
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Time-Based Charts */}
              <TabsContent value="time" className="p-4 space-y-4">
                <div className="flex gap-2 mb-4">
                  {['5', '15', '60'].map((interval) => (
                    <button
                      key={interval}
                      onClick={() => setTimeInterval(interval)}
                      className={`px-4 py-2 rounded font-mono text-sm transition-all ${
                        timeInterval === interval
                          ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(0,255,255,0.5)]'
                          : 'bg-black/50 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20'
                      }`}
                    >
                      {interval === '5' ? '5M' : interval === '15' ? '15M' : '1H'}
                    </button>
                  ))}
                </div>
                <div className="relative w-full bg-black/50 rounded-lg overflow-hidden border border-cyan-500/30" style={{ height: '500px' }}>
                  <div id={`tradingview_time_${token.symbol}`} className="w-full h-full" />
                  <TimeChart symbol={token.symbol} interval={timeInterval} onError={setChartError} />
                </div>
              </TabsContent>

              {/* Range-Based Charts */}
              <TabsContent value="range" className="p-4 space-y-4">
                <div className="flex gap-2 mb-4">
                  {['10', '100', '1000'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setRangeInterval(range)}
                      className={`px-4 py-2 rounded font-mono text-sm transition-all ${
                        rangeInterval === range
                          ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(0,255,255,0.5)]'
                          : 'bg-black/50 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20'
                      }`}
                    >
                      {range}R
                    </button>
                  ))}
                </div>
                <div className="relative w-full bg-black/50 rounded-lg overflow-hidden border border-cyan-500/30" style={{ height: '500px' }}>
                  <div id={`tradingview_range_${token.symbol}`} className="w-full h-full" />
                  <RangeChart symbol={token.symbol} range={rangeInterval} onError={setChartError} />
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Time-based chart component
function TimeChart({ symbol, interval, onError }: { symbol: string; interval: string; onError: (error: string | null) => void }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    
    script.onload = () => {
      try {
        if (typeof window.TradingView !== 'undefined') {
          const symbolFormats = [
            `HYPERLIQUID:${symbol}USDC`,
            `BINANCE:${symbol}USDT`,
            `COINBASE:${symbol}USD`,
            `${symbol}USD`
          ];
          
          new window.TradingView.widget({
            autosize: true,
            symbol: symbolFormats[0],
            interval: interval,
            timezone: 'Etc/UTC',
            theme: 'dark',
            style: '1',
            locale: 'en',
            toolbar_bg: '#0a0a0a',
            enable_publishing: false,
            hide_side_toolbar: false,
            allow_symbol_change: true,
            container_id: `tradingview_time_${symbol}`,
            backgroundColor: '#000000',
            gridColor: 'rgba(0, 255, 255, 0.1)',
          });
          onError(null);
        } else {
          throw new Error('TradingView library not available');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error loading chart';
        console.error('TradingView TimeChart error:', errorMessage);
        onError(`Failed to load time chart: ${errorMessage}`);
        toast.error('Chart loading failed', {
          description: 'Unable to load TradingView chart. Please refresh the page.',
        });
      }
    };
    
    script.onerror = () => {
      const errorMessage = 'Failed to load TradingView script';
      console.error(errorMessage);
      onError(errorMessage);
      toast.error('Chart script failed to load', {
        description: 'Please check your internet connection and try again.',
      });
    };
    
    document.head.appendChild(script);
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [symbol, interval, onError]);

  return null;
}

// Range-based chart component
function RangeChart({ symbol, range, onError }: { symbol: string; range: string; onError: (error: string | null) => void }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    
    script.onload = () => {
      try {
        if (typeof window.TradingView !== 'undefined') {
          const rangeToInterval: Record<string, string> = {
            '10': '1',
            '100': '5',
            '1000': '15'
          };
          
          const tvInterval = rangeToInterval[range] || '5';
          
          const symbolFormats = [
            `BINANCE:${symbol}USDT`,
            `HYPERLIQUID:${symbol}USDC`,
            `COINBASE:${symbol}USD`,
            `${symbol}PERP`
          ];
          
          new window.TradingView.widget({
            autosize: true,
            symbol: symbolFormats[0],
            interval: tvInterval,
            timezone: 'Etc/UTC',
            theme: 'dark',
            style: '3',
            locale: 'en',
            toolbar_bg: '#0a0a0a',
            enable_publishing: false,
            hide_side_toolbar: false,
            allow_symbol_change: true,
            container_id: `tradingview_range_${symbol}`,
            backgroundColor: '#000000',
            gridColor: 'rgba(0, 255, 255, 0.1)',
            studies: ['Volume@tv-basicstudies'],
          });
          onError(null);
        } else {
          throw new Error('TradingView library not available');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error loading chart';
        console.error('TradingView RangeChart error:', errorMessage);
        onError(`Failed to load range chart: ${errorMessage}`);
        toast.error('Chart loading failed', {
          description: 'Unable to load TradingView range chart. Please refresh the page.',
        });
      }
    };
    
    script.onerror = () => {
      const errorMessage = 'Failed to load TradingView script';
      console.error(errorMessage);
      onError(errorMessage);
      toast.error('Chart script failed to load', {
        description: 'Please check your internet connection and try again.',
      });
    };
    
    document.head.appendChild(script);
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [symbol, range, onError]);

  return null;
}
import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useTradingStore } from '@/store/tradingStore';
import { Badge } from '@/components/ui/badge';

interface TradingChartProps {
  symbol: string;
  theme?: 'light' | 'dark';
  chartId?: string;
}

export const TradingChart = ({ symbol, chartId = 'tradingview_chart' }: TradingChartProps) => {
  const container = useRef<HTMLDivElement>(null);
  const { chartType, chartInterval, position } = useTradingStore();
  const [previousBalance, setPreviousBalance] = useState(0);
  const [, setBalanceChange] = useState(0);
  
  // Track balance changes for visual feedback
  useEffect(() => {
    if (previousBalance !== 0) {
      const change = previousBalance - 0;
      setBalanceChange(change);
      setPreviousBalance(0);
      
      // Clear the change indicator after 3 seconds
      const timeout = setTimeout(() => setBalanceChange(0), 3000);
      return () => clearTimeout(timeout);
    }
  }, [previousBalance]);
  
  useEffect(() => {
    if (!container.current) return;
    
    // Clear container to prevent duplicate widgets
    container.current.innerHTML = '';
    
    const initWidget = () => {
      if (typeof window.TradingView !== 'undefined' && container.current) {
        // Double check container is empty before creating widget
        container.current.innerHTML = '';

        new window.TradingView.widget({
          autosize: true,
          symbol: `BINANCE:${symbol}USDT`,
          interval: '15',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#0a0a0a',
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          container_id: `tradingview_${chartId}`,
          backgroundColor: '#000000',
          gridColor: 'rgba(0, 255, 255, 0.1)',
          studies: [
            'RSI@tv-basicstudies',
            'MASimple@tv-basicstudies'
          ],
          overrides: {
            "mainSeriesProperties.candleStyle.upColor": "#00ff00",
            "mainSeriesProperties.candleStyle.downColor": "#ff0000",
            "paneProperties.background": "#000000",
            "paneProperties.vertGridProperties.color": "rgba(0, 255, 255, 0.1)",
            "paneProperties.horzGridProperties.color": "rgba(0, 255, 255, 0.1)",
          },
        });
      }
    };

    // Check if script is already loaded
    if (document.getElementById('tradingview-widget-script')) {
      if (typeof window.TradingView !== 'undefined') {
        initWidget();
      } else {
        // Script exists but might not be fully loaded, wait for it
        const checkInterval = setInterval(() => {
          if (typeof window.TradingView !== 'undefined') {
            clearInterval(checkInterval);
            initWidget();
          }
        }, 100);
        return () => clearInterval(checkInterval);
      }
      return;
    }
    
    const script = document.createElement('script');
    script.id = 'tradingview-widget-script';
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = initWidget;
    
    document.head.appendChild(script);
    
    // Don't remove the script on unmount as it might be used by other components
    // Just ensure we clean up the widget container
    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbol, chartInterval, chartType, chartId, position]);

  return (
    <Card className="h-full bg-black/80 border-cyan-500/30 overflow-hidden relative">
      {position && position.symbol === symbol && (
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          <Badge 
            variant={position.side === 'long' ? 'default' : 'destructive'}
            className="font-mono"
          >
            {position.side.toUpperCase()} {position.size}
          </Badge>
          <Badge 
            variant="outline"
            className={`font-mono ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}
          >
            PnL: ${position.pnl.toFixed(2)}
          </Badge>
        </div>
      )}
      
      <div 
        id={`tradingview_${chartId}`} 
        ref={container}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
      
      {position && position.symbol === symbol && (
        <div className="absolute bottom-2 left-2 z-10 bg-black/80 border border-cyan-500/50 rounded p-2">
          <p className="text-xs text-cyan-400 font-mono mb-1">Position Active</p>
          <div className="flex gap-2 text-xs font-mono">
            <span className="text-gray-400">Entry: ${position.entryPrice.toFixed(2)}</span>
            {position.stopLoss && (
              <span className="text-red-400">SL: ${position.stopLoss.toFixed(2)}</span>
            )}
            {position.takeProfit && (
              <span className="text-green-400">TP: ${position.takeProfit.toFixed(2)}</span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

// Extend Window interface for TradingView
declare global {
  interface Window {
    TradingView: any;
  }
}
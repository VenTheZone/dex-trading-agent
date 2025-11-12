import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { useTradingStore } from '@/store/tradingStore';

interface TradingChartProps {
  symbol: string;
  chartId: number;
}

export function TradingChart({ symbol, chartId }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { chartInterval, chartType } = useTradingStore();
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear previous widget
    containerRef.current.innerHTML = '';
    
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof window.TradingView !== 'undefined') {
        new window.TradingView.widget({
          autosize: true,
          symbol: symbol,
          interval: chartInterval,
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: chartType === 'range' ? '3' : '1',
          locale: 'en',
          toolbar_bg: '#0a0a0a',
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          container_id: `tradingview_${chartId}`,
          backgroundColor: '#000000',
          gridColor: 'rgba(0, 255, 255, 0.1)',
          studies: [],
        });
      }
    };
    
    document.head.appendChild(script);
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [symbol, chartInterval, chartType, chartId]);
  
  return (
    <Card className="h-full bg-black/80 border-cyan-500/30 overflow-hidden">
      <div 
        id={`tradingview_${chartId}`} 
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
    </Card>
  );
}

// Extend Window interface for TradingView
declare global {
  interface Window {
    TradingView: any;
  }
}

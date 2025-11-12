import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useTradingStore } from '@/store/tradingStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';

interface TradingChartProps {
  symbol: string;
  chartId: number;
}

export function TradingChart({ symbol, chartId }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const { chartInterval, chartType, position, mode } = useTradingStore();
  const [stopLoss, setStopLoss] = useState<number | null>(null);
  const [takeProfit, setTakeProfit] = useState<number | null>(null);
  const createLog = useMutation((api as any).tradingLogs.createLog);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    containerRef.current.innerHTML = '';
    
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof window.TradingView !== 'undefined') {
        widgetRef.current = new window.TradingView.widget({
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
          studies: chartType === 'range' ? ['Volume@tv-basicstudies'] : [],
          drawings_access: { type: 'black', tools: [{ name: 'LineToolHorzLine' }] },
          datafeed: undefined,
          library_path: undefined,
        });

        // Use iframe API to access chart when ready
        if (widgetRef.current && widgetRef.current.headerReady) {
          widgetRef.current.headerReady().then(() => {
            const iframe = widgetRef.current.iframe;
            if (iframe && iframe.contentWindow) {
              // Chart is ready, but we can't directly manipulate it without advanced API
              console.log(`Chart ready for ${symbol} with interval ${chartInterval}`);
              
              // Note: Drawing position lines requires TradingView's advanced charting library
              // For now, we'll just log the position data
              if (position && position.symbol === symbol) {
                console.log('Active position:', position);
              }
            }
          }).catch((err: any) => {
            console.error('Chart initialization error:', err);
          });
        }
      }
    };
    
    document.head.appendChild(script);
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [symbol, chartInterval, chartType, chartId, position]);

  const handleUpdateStopLoss = async (newPrice: number) => {
    if (!position) return;

    try {
      await createLog({
        action: "update_stop_loss",
        symbol: position.symbol,
        reason: `Stop loss updated to $${newPrice.toFixed(2)}`,
        price: newPrice,
        size: position.size,
        side: position.side,
      });
      
      setStopLoss(newPrice);
      toast.success(`Stop loss updated to $${newPrice.toFixed(2)}`);
    } catch (error: any) {
      toast.error(`Failed to update stop loss: ${error.message}`);
    }
  };
  
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
        ref={containerRef}
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
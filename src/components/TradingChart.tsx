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
  const createLog = useMutation(api.tradingLogs.createLog);
  
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
          studies: [],
          // Enable drawing tools for stop loss/take profit
          drawings_access: { type: 'black', tools: [{ name: 'LineToolHorzLine' }] },
        });

        // Listen for widget ready event
        widgetRef.current.onChartReady(() => {
          const chart = widgetRef.current.chart();
          
          // Add position lines if there's an active position
          if (position && position.symbol === symbol) {
            // Entry line
            chart.createShape(
              { price: position.entryPrice },
              {
                shape: 'horizontal_line',
                overrides: {
                  linecolor: '#00ffff',
                  linewidth: 2,
                  linestyle: 0,
                  showLabel: true,
                  text: `Entry: $${position.entryPrice}`,
                },
              }
            );

            // Stop loss line (draggable)
            if (position.stopLoss) {
              const slLine = chart.createShape(
                { price: position.stopLoss },
                {
                  shape: 'horizontal_line',
                  lock: false,
                  disableSelection: false,
                  disableSave: false,
                  overrides: {
                    linecolor: '#ff0000',
                    linewidth: 2,
                    linestyle: 0,
                    showLabel: true,
                    text: `SL: $${position.stopLoss}`,
                  },
                }
              );
              
              setStopLoss(position.stopLoss);
            }

            // Take profit line (draggable)
            if (position.takeProfit) {
              chart.createShape(
                { price: position.takeProfit },
                {
                  shape: 'horizontal_line',
                  lock: false,
                  disableSelection: false,
                  disableSave: false,
                  overrides: {
                    linecolor: '#00ff00',
                    linewidth: 2,
                    linestyle: 0,
                    showLabel: true,
                    text: `TP: $${position.takeProfit}`,
                  },
                }
              );
              
              setTakeProfit(position.takeProfit);
            }
          }
        });
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
      
      {position && position.symbol === symbol && stopLoss && (
        <div className="absolute bottom-2 left-2 z-10 bg-black/80 border border-cyan-500/50 rounded p-2">
          <p className="text-xs text-cyan-400 font-mono mb-1">Drag lines on chart to adjust</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-red-500/50 text-red-400"
              onClick={() => {
                const newSL = prompt(`Enter new stop loss price (current: $${stopLoss}):`, stopLoss.toString());
                if (newSL) handleUpdateStopLoss(parseFloat(newSL));
              }}
            >
              Update SL
            </Button>
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
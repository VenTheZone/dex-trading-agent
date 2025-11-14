import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useTradingStore } from '@/store/tradingStore';
import { Badge } from '@/components/ui/badge';
export function TradingChart({ symbol, chartId }) {
    const containerRef = useRef(null);
    const widgetRef = useRef(null);
    const { chartInterval, chartType, position, balance } = useTradingStore();
    const [previousBalance, setPreviousBalance] = useState(balance);
    const [, setBalanceChange] = useState(0);
    // Track balance changes for visual feedback
    useEffect(() => {
        if (balance !== previousBalance) {
            const change = balance - previousBalance;
            setBalanceChange(change);
            setPreviousBalance(balance);
            // Clear the change indicator after 3 seconds
            const timeout = setTimeout(() => setBalanceChange(0), 3000);
            return () => clearTimeout(timeout);
        }
    }, [balance, previousBalance]);
    useEffect(() => {
        if (!containerRef.current)
            return;
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
                });
                // Log chart initialization
                console.log(`TradingView chart initialized for ${symbol}`);
                if (position && position.symbol === symbol) {
                    console.log('Active position:', position);
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
    return (<Card className="h-full bg-black/80 border-cyan-500/30 overflow-hidden relative">
      {position && position.symbol === symbol && (<div className="absolute top-2 right-2 z-10 flex gap-2">
          <Badge variant={position.side === 'long' ? 'default' : 'destructive'} className="font-mono">
            {position.side.toUpperCase()} {position.size}
          </Badge>
          <Badge variant="outline" className={`font-mono ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            PnL: ${position.pnl.toFixed(2)}
          </Badge>
        </div>)}
      
      <div id={`tradingview_${chartId}`} ref={containerRef} className="w-full h-full" style={{ minHeight: '400px' }}/>
      
      {position && position.symbol === symbol && (<div className="absolute bottom-2 left-2 z-10 bg-black/80 border border-cyan-500/50 rounded p-2">
          <p className="text-xs text-cyan-400 font-mono mb-1">Position Active</p>
          <div className="flex gap-2 text-xs font-mono">
            <span className="text-gray-400">Entry: ${position.entryPrice.toFixed(2)}</span>
            {position.stopLoss && (<span className="text-red-400">SL: ${position.stopLoss.toFixed(2)}</span>)}
            {position.takeProfit && (<span className="text-green-400">TP: ${position.takeProfit.toFixed(2)}</span>)}
          </div>
        </div>)}
    </Card>);
}

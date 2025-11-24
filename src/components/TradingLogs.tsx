import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Trash2, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { sanitizeText } from '@/lib/utils';
import { useTradingLogs } from '@/hooks/use-python-api';

export function TradingLogs() {
  const { logs, loading, clearLogs } = useTradingLogs(100);

  const handleClearLogs = async () => {
    const confirmed = window.confirm('Are you sure you want to clear all logs?');
    if (!confirmed) return;
    
    try {
      const success = await clearLogs();
      if (success) {
        toast.success('Logs cleared');
      } else {
        toast.error('Failed to clear logs');
      }
    } catch (error) {
      toast.error('Failed to clear logs');
    }
  };

  const getActionIcon = (action: string) => {
    if (action.toLowerCase().includes('open')) return <TrendingUp className="h-4 w-4" />;
    if (action.toLowerCase().includes('close')) return <TrendingDown className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.toLowerCase().includes('open')) return 'text-green-400';
    if (action.toLowerCase().includes('close')) return 'text-red-400';
    return 'text-cyan-400';
  };

  return (
    <Card className="bg-black/90 border-cyan-500/50 h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-cyan-400 font-mono">Trading Logs</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearLogs}
          className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="text-center text-gray-500 py-8 font-mono">
              Loading logs...
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="text-center text-gray-500 py-8 font-mono">
              No trading logs yet
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log: any, index: number) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-black/50 border border-cyan-500/30 rounded-lg p-3 hover:border-cyan-500/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1">
                      <div className={`mt-1 ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold font-mono ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                          <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 font-mono">
                            {log.symbol}
                          </Badge>
                          {log.side && (
                            <Badge 
                              variant={log.side === 'long' ? 'default' : 'destructive'}
                              className="font-mono"
                            >
                              {log.side.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-cyan-100 mt-1 font-mono">
                          <span className="text-cyan-400">Reason:</span> {sanitizeText(log.reason, 500)}
                        </p>
                        
                        {log.details && (
                          <p className="text-xs text-gray-400 mt-1 font-mono">
                            {sanitizeText(log.details, 500)}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 font-mono">
                          {log.price && (
                            <span>Price: ${log.price.toLocaleString()}</span>
                          )}
                          {log.size && (
                            <span>Size: {log.size}</span>
                          )}
                          <span>
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Terminal, 
  X, 
  Minimize2, 
  Maximize2, 
  Trash2,
  Download,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useTradingLogs } from '@/hooks/use-python-api';

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  source: string;
  message: string;
}

export function FloatingLogViewer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const { logs: tradingLogs, loading, clearLogs } = useTradingLogs(100);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Capture console logs
  useEffect(() => {
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
    };

    const addSystemLog = (level: SystemLog['level'], source: string, ...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      const log: SystemLog = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toISOString(),
        level,
        source,
        message,
      };

      setSystemLogs(prev => [...prev.slice(-99), log]); // Keep last 100 logs
    };

    console.log = (...args) => {
      originalConsole.log(...args);
      addSystemLog('info', 'Console', ...args);
    };

    console.warn = (...args) => {
      originalConsole.warn(...args);
      addSystemLog('warning', 'Console', ...args);
    };

    console.error = (...args) => {
      originalConsole.error(...args);
      addSystemLog('error', 'Console', ...args);
    };

    console.info = (...args) => {
      originalConsole.info(...args);
      addSystemLog('info', 'Console', ...args);
    };

    return () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.info = originalConsole.info;
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current && !isMinimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [systemLogs, isMinimized]);

  const getLevelIcon = (level: SystemLog['level']) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      default:
        return <Info className="h-4 w-4 text-cyan-400" />;
    }
  };

  const getLevelColor = (level: SystemLog['level']) => {
    switch (level) {
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'success':
        return 'text-green-400';
      default:
        return 'text-cyan-400';
    }
  };

  const handleClearSystemLogs = () => {
    setSystemLogs([]);
    toast.success('System logs cleared');
  };

  const handleDownloadLogs = () => {
    const logsData = {
      systemLogs,
      tradingLogs,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(logsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dex-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Logs downloaded');
  };

  const errorCount = systemLogs.filter(log => log.level === 'error').length;
  const warningCount = systemLogs.filter(log => log.level === 'warning').length;

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-6 left-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="relative bg-cyan-500 hover:bg-cyan-600 text-black font-bold font-mono shadow-[0_0_30px_rgba(0,255,255,0.6)] hover:shadow-[0_0_40px_rgba(0,255,255,0.8)] transition-all rounded-full h-16 w-16 p-0"
            >
              <Terminal className="h-6 w-6" />
              {(errorCount > 0 || warningCount > 0) && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                  {errorCount + warningCount}
                </span>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log Viewer Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className={`fixed ${isMinimized ? 'bottom-6 left-6' : 'bottom-6 left-6'} z-50 ${
              isMinimized ? 'w-80' : 'w-[800px] h-[600px]'
            }`}
          >
            <Card className="bg-black/95 border-cyan-500/50 shadow-[0_0_40px_rgba(0,255,255,0.3)] backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-cyan-500/30">
                <div className="flex items-center gap-3">
                  <Terminal className="h-5 w-5 text-cyan-400" />
                  <CardTitle className="text-cyan-400 font-mono">System Logs</CardTitle>
                  {errorCount > 0 && (
                    <Badge variant="destructive" className="font-mono">
                      {errorCount} Errors
                    </Badge>
                  )}
                  {warningCount > 0 && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 font-mono">
                      {warningCount} Warnings
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDownloadLogs}
                    className="text-cyan-400 hover:bg-cyan-500/20"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="text-cyan-400 hover:bg-cyan-500/20"
                  >
                    {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="text-cyan-400 hover:bg-cyan-500/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              {!isMinimized && (
                <CardContent className="p-0">
                  <Tabs defaultValue="system" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-black/50 rounded-none border-b border-cyan-500/30">
                      <TabsTrigger 
                        value="system" 
                        className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-mono"
                      >
                        🖥️ System Logs ({systemLogs.length})
                      </TabsTrigger>
                      <TabsTrigger 
                        value="trading" 
                        className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-mono"
                      >
                        📊 Trading Logs ({tradingLogs?.length || 0})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="system" className="m-0">
                      <div className="flex items-center justify-between p-3 border-b border-cyan-500/30">
                        <span className="text-xs text-gray-400 font-mono">
                          Showing last {systemLogs.length} system events
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearSystemLogs}
                          className="text-red-400 hover:bg-red-500/20 font-mono text-xs"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      </div>
                      <ScrollArea className="h-[460px]" ref={scrollRef}>
                        <div className="p-4 space-y-2">
                          {systemLogs.length === 0 ? (
                            <div className="text-center text-gray-500 py-8 font-mono text-sm">
                              No system logs yet
                            </div>
                          ) : (
                            systemLogs.map((log) => (
                              <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-black/50 border border-cyan-500/20 rounded p-2 hover:border-cyan-500/40 transition-all"
                              >
                                <div className="flex items-start gap-2">
                                  {getLevelIcon(log.level)}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`text-xs font-bold font-mono ${getLevelColor(log.level)}`}>
                                        {log.level.toUpperCase()}
                                      </span>
                                      <span className="text-xs text-gray-500 font-mono">
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                      </span>
                                      <Badge variant="outline" className="text-xs font-mono border-cyan-500/30">
                                        {log.source}
                                      </Badge>
                                    </div>
                                    <pre className="text-xs text-cyan-100 font-mono whitespace-pre-wrap break-words">
                                      {log.message}
                                    </pre>
                                  </div>
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="trading" className="m-0">
                      <div className="flex items-center justify-between p-3 border-b border-cyan-500/30">
                        <span className="text-xs text-gray-400 font-mono">
                          Trading activity logs
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const success = await clearLogs();
                            if (success) {
                              toast.success('Trading logs cleared');
                            }
                          }}
                          className="text-red-400 hover:bg-red-500/20 font-mono text-xs"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      </div>
                      <ScrollArea className="h-[460px]">
                        <div className="p-4 space-y-2">
                          {loading ? (
                            <div className="text-center text-gray-500 py-8 font-mono text-sm">
                              Loading trading logs...
                            </div>
                          ) : !tradingLogs || tradingLogs.length === 0 ? (
                            <div className="text-center text-gray-500 py-8 font-mono text-sm">
                              No trading logs yet
                            </div>
                          ) : (
                            tradingLogs.map((log: any) => (
                              <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-black/50 border border-cyan-500/20 rounded p-2 hover:border-cyan-500/40 transition-all"
                              >
                                <div className="flex items-start gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <span className="text-xs font-bold font-mono text-cyan-400">
                                        {log.action}
                                      </span>
                                      <Badge variant="outline" className="text-xs font-mono border-cyan-500/30">
                                        {log.symbol}
                                      </Badge>
                                      {log.side && (
                                        <Badge 
                                          variant={log.side === 'long' ? 'default' : 'destructive'}
                                          className="text-xs font-mono"
                                        >
                                          {log.side.toUpperCase()}
                                        </Badge>
                                      )}
                                      <span className="text-xs text-gray-500 font-mono">
                                        {new Date(log.created_at).toLocaleTimeString()}
                                      </span>
                                    </div>
                                    <p className="text-xs text-cyan-100 font-mono">
                                      {log.reason}
                                    </p>
                                    {log.details && (
                                      <p className="text-xs text-gray-400 font-mono mt-1">
                                        {log.details}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

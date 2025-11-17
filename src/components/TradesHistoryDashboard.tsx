import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Clock, DollarSign, Target, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTradingLogs } from '@/hooks/use-python-api';
import { useState, useMemo, useEffect } from 'react';

interface TradeEntry {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice?: number;
  size: number;
  pnl?: number;
  entryTime: string;
  exitTime?: string;
  mode: 'paper' | 'live' | 'demo';
  status: 'open' | 'closed';
}

type SortField = 'entryTime' | 'exitTime' | 'pnl' | 'symbol' | 'size';
type SortDirection = 'asc' | 'desc';

export function TradesHistoryDashboard() {
  const { logs, loading, error, refetch } = useTradingLogs(500);
  const [filterSymbol, setFilterSymbol] = useState<string>('all');
  const [filterOutcome, setFilterOutcome] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [hoveredTrade, setHoveredTrade] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('entryTime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Parse logs into trade entries
  const trades = useMemo(() => {
    const tradeMap = new Map<string, TradeEntry>();
    const openTradesBySymbol = new Map<string, TradeEntry[]>();
    
    logs.forEach((log: any) => {
      // Validate log has required fields
      if (!log.symbol || !log.created_at || !log.action) {
        console.warn('Invalid log entry:', log);
        return;
      }
      
      const key = `${log.symbol}-${log.created_at}`;
      
      if (log.action.toLowerCase().includes('open')) {
        const trade: TradeEntry = {
          id: key,
          symbol: log.symbol,
          side: log.side || 'long',
          entryPrice: log.price || 0,
          size: log.size || 0,
          entryTime: log.created_at,
          mode: log.mode || 'paper',
          status: 'open',
        };
        
        tradeMap.set(key, trade);
        
        // Track open trades by symbol for efficient matching
        if (!openTradesBySymbol.has(log.symbol)) {
          openTradesBySymbol.set(log.symbol, []);
        }
        openTradesBySymbol.get(log.symbol)!.push(trade);
        
      } else if (log.action.toLowerCase().includes('close')) {
        // Find the oldest open trade for this symbol (FIFO)
        const openTrades = openTradesBySymbol.get(log.symbol);
        const existingTrade = openTrades?.find(t => t.status === 'open');
        
        if (existingTrade) {
          existingTrade.exitPrice = log.price;
          existingTrade.exitTime = log.created_at;
          existingTrade.status = 'closed';
          
          // Calculate P&L
          if (existingTrade.entryPrice && log.price) {
            const priceDiff = existingTrade.side === 'long' 
              ? log.price - existingTrade.entryPrice
              : existingTrade.entryPrice - log.price;
            existingTrade.pnl = priceDiff * existingTrade.size;
          }
          
          // Remove from open trades list
          const index = openTrades!.indexOf(existingTrade);
          if (index > -1) {
            openTrades!.splice(index, 1);
          }
        } else {
          console.warn(`No open trade found for close action: ${log.symbol} at ${log.created_at}`);
        }
      }
    });
    
    return Array.from(tradeMap.values()).reverse();
  }, [logs]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterSymbol, filterOutcome, filterMode, sortField, sortDirection]);

  // Filter and sort trades
  const filteredAndSortedTrades = useMemo(() => {
    let filtered = trades.filter(trade => {
      if (filterSymbol !== 'all' && trade.symbol !== filterSymbol) return false;
      if (filterMode !== 'all' && trade.mode !== filterMode) return false;
      if (filterOutcome !== 'all') {
        if (filterOutcome === 'win' && (trade.pnl || 0) < 0) return false;
        if (filterOutcome === 'loss' && (trade.pnl || 0) > 0) return false;
        if (filterOutcome === 'open' && trade.status !== 'open') return false;
      }
      return true;
    });

    // Sort trades
    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'entryTime':
          comparison = new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime();
          break;
        case 'exitTime':
          const aTime = a.exitTime ? new Date(a.exitTime).getTime() : 0;
          const bTime = b.exitTime ? new Date(b.exitTime).getTime() : 0;
          comparison = aTime - bTime;
          break;
        case 'pnl':
          comparison = (a.pnl || 0) - (b.pnl || 0);
          break;
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [trades, filterSymbol, filterOutcome, filterMode, sortField, sortDirection]);

  // Paginate trades
  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedTrades.slice(startIndex, endIndex);
  }, [filteredAndSortedTrades, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedTrades.length / itemsPerPage);

  // Calculate statistics
  const stats = useMemo(() => {
    const closedTrades = filteredAndSortedTrades.filter(t => t.status === 'closed' && t.pnl !== undefined);
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const wins = closedTrades.filter(t => (t.pnl || 0) > 0).length;
    const losses = closedTrades.filter(t => (t.pnl || 0) < 0).length;
    const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;
    const avgWin = wins > 0 ? closedTrades.filter(t => (t.pnl || 0) > 0).reduce((sum, t) => sum + (t.pnl || 0), 0) / wins : 0;
    const avgLoss = losses > 0 ? closedTrades.filter(t => (t.pnl || 0) < 0).reduce((sum, t) => sum + (t.pnl || 0), 0) / losses : 0;
    
    return {
      totalTrades: closedTrades.length,
      totalPnL,
      wins,
      losses,
      winRate,
      avgWin,
      avgLoss,
      openTrades: filteredAndSortedTrades.filter(t => t.status === 'open').length,
    };
  }, [filteredAndSortedTrades]);

  // Get unique symbols for filter
  const symbols = useMemo(() => {
    return Array.from(new Set(trades.map(t => t.symbol)));
  }, [trades]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => {
    const isActive = sortField === field;
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleSort(field)}
        className={`font-mono text-xs ${
          isActive 
            ? 'text-cyan-400 bg-cyan-500/20 border border-cyan-500/50' 
            : 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10'
        } transition-all`}
      >
        {label}
        {isActive ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="ml-1 h-3 w-3" />
          ) : (
            <ArrowDown className="ml-1 h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
        )}
      </Button>
    );
  };

  return (
    <Card className="bg-black/90 border-cyan-500/50 h-full shadow-[0_0_30px_rgba(0,255,255,0.3)] hover:shadow-[0_0_40px_rgba(0,255,255,0.4)] transition-all duration-300">
      <CardHeader className="pb-3 border-b border-cyan-500/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-cyan-400 font-mono text-xl flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              💼
            </motion.div>
            Trades History Dashboard
          </CardTitle>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-cyan-500/10 to-black/50 border-cyan-500/40 hover:border-cyan-400 transition-all duration-300 shadow-[0_0_15px_rgba(0,255,255,0.2)]">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <Target className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-mono">Total Trades</p>
                    <p className="text-lg font-bold text-cyan-100 font-mono">{stats.totalTrades}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className={`bg-gradient-to-br ${stats.totalPnL >= 0 ? 'from-green-500/10' : 'from-red-500/10'} to-black/50 border-${stats.totalPnL >= 0 ? 'green' : 'red'}-500/40 hover:border-${stats.totalPnL >= 0 ? 'green' : 'red'}-400 transition-all duration-300 shadow-[0_0_15px_rgba(${stats.totalPnL >= 0 ? '0,255,0' : '255,0,0'},0.2)]`}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 ${stats.totalPnL >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'} rounded-lg`}>
                    <DollarSign className={`h-4 w-4 ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-mono">Total P&L</p>
                    <p className={`text-lg font-bold font-mono ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-green-500/10 to-black/50 border-green-500/40 hover:border-green-400 transition-all duration-300 shadow-[0_0_15px_rgba(0,255,0,0.2)]">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-mono">Win Rate</p>
                    <p className="text-lg font-bold text-green-400 font-mono">{stats.winRate.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-yellow-500/10 to-black/50 border-yellow-500/40 hover:border-yellow-400 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,0,0.2)]">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Clock className="h-4 w-4 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-mono">Open Trades</p>
                    <p className="text-lg font-bold text-yellow-400 font-mono">{stats.openTrades}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters and Sorting */}
        <motion.div 
          className="space-y-3 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {/* Filters Row */}
          <div className="flex flex-wrap gap-2">
            <Select value={filterSymbol} onValueChange={setFilterSymbol}>
              <SelectTrigger className="w-[140px] bg-black/50 border-cyan-500/30 text-cyan-100 font-mono hover:bg-cyan-500/10 hover:border-cyan-400 transition-all">
                <SelectValue placeholder="Symbol" />
              </SelectTrigger>
              <SelectContent className="bg-black/95 border-cyan-500/50 backdrop-blur-sm">
                <SelectItem value="all">All Symbols</SelectItem>
                {symbols.map(symbol => (
                  <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterOutcome} onValueChange={setFilterOutcome}>
              <SelectTrigger className="w-[140px] bg-black/50 border-cyan-500/30 text-cyan-100 font-mono hover:bg-cyan-500/10 hover:border-cyan-400 transition-all">
                <SelectValue placeholder="Outcome" />
              </SelectTrigger>
              <SelectContent className="bg-black/95 border-cyan-500/50 backdrop-blur-sm">
                <SelectItem value="all">All Trades</SelectItem>
                <SelectItem value="win">Wins Only</SelectItem>
                <SelectItem value="loss">Losses Only</SelectItem>
                <SelectItem value="open">Open Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterMode} onValueChange={setFilterMode}>
              <SelectTrigger className="w-[140px] bg-black/50 border-cyan-500/30 text-cyan-100 font-mono hover:bg-cyan-500/10 hover:border-cyan-400 transition-all">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent className="bg-black/95 border-cyan-500/50 backdrop-blur-sm">
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="paper">Paper</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="demo">Demo</SelectItem>
              </SelectContent>
            </Select>

            {(filterSymbol !== 'all' || filterOutcome !== 'all' || filterMode !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterSymbol('all');
                  setFilterOutcome('all');
                  setFilterMode('all');
                }}
                className="text-cyan-400 hover:bg-cyan-500/20 font-mono border-cyan-500/30 hover:border-cyan-400 transition-all"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Sorting Row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-mono">Sort by:</span>
            <SortButton field="entryTime" label="Entry Time" />
            <SortButton field="exitTime" label="Exit Time" />
            <SortButton field="pnl" label="P&L" />
            <SortButton field="symbol" label="Symbol" />
            <SortButton field="size" label="Size" />
          </div>
        </motion.div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {error ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 px-4"
            >
              <div className="bg-red-500/20 border-2 border-red-500/50 rounded-lg p-6 max-w-md">
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle className="h-6 w-6 text-red-400 animate-pulse" />
                  <h3 className="text-lg font-bold text-red-400 font-mono">Failed to Load Trades</h3>
                </div>
                <p className="text-sm text-red-300 font-mono mb-4">{error}</p>
                <Button
                  onClick={() => refetch()}
                  className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 font-mono"
                >
                  Retry
                </Button>
              </div>
            </motion.div>
          ) : loading ? (
            <div className="text-center text-gray-500 py-8 font-mono">
              Loading trades...
            </div>
          ) : filteredAndSortedTrades.length === 0 ? (
            <div className="text-center text-gray-500 py-8 font-mono">
              No trades found
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedTrades.map((trade, index) => (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onHoverStart={() => setHoveredTrade(trade.id)}
                  onHoverEnd={() => setHoveredTrade(null)}
                  className={`bg-gradient-to-r ${
                    trade.pnl !== undefined 
                      ? trade.pnl >= 0 
                        ? 'from-green-500/5 to-black/50' 
                        : 'from-red-500/5 to-black/50'
                      : 'from-yellow-500/5 to-black/50'
                  } border ${
                    hoveredTrade === trade.id 
                      ? 'border-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.4)]' 
                      : 'border-cyan-500/30'
                  } rounded-lg p-4 hover:border-cyan-500/70 transition-all duration-300 cursor-pointer`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 font-mono bg-cyan-500/10 shadow-[0_0_10px_rgba(0,255,255,0.3)]">
                          {trade.symbol}
                        </Badge>
                        <Badge 
                          variant={trade.side === 'long' ? 'default' : 'destructive'}
                          className={`font-mono ${trade.side === 'long' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-red-500/20 text-red-400 border-red-500/50'}`}
                        >
                          {trade.side.toUpperCase()}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={`font-mono ${
                            trade.mode === 'live' ? 'border-red-500/50 text-red-400' :
                            trade.mode === 'paper' ? 'border-cyan-500/50 text-cyan-400' :
                            'border-yellow-500/50 text-yellow-400'
                          }`}
                        >
                          {trade.mode.toUpperCase()}
                        </Badge>
                        {trade.status === 'open' && (
                          <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 font-mono bg-yellow-500/10 animate-pulse">
                            OPEN
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                        <div>
                          <span className="text-gray-400">Entry:</span>
                          <span className="text-cyan-100 ml-2">${trade.entryPrice.toLocaleString()}</span>
                        </div>
                        {trade.exitPrice && (
                          <div>
                            <span className="text-gray-400">Exit:</span>
                            <span className="text-cyan-100 ml-2">${trade.exitPrice.toLocaleString()}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-400">Size:</span>
                          <span className="text-cyan-100 ml-2">{trade.size}</span>
                        </div>
                        {trade.pnl !== undefined && (
                          <div>
                            <span className="text-gray-400">P&L:</span>
                            <span className={`ml-2 font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 font-mono">
                        <span>Entry: {new Date(trade.entryTime).toLocaleString()}</span>
                        {trade.exitTime && (
                          <span>Exit: {new Date(trade.exitTime).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      {trade.pnl !== undefined ? (
                        trade.pnl >= 0 ? (
                          <TrendingUp className="h-6 w-6 text-green-400" />
                        ) : (
                          <TrendingDown className="h-6 w-6 text-red-400" />
                        )
                      ) : (
                        <AlertCircle className="h-6 w-6 text-yellow-400" />
                      )}
                    </div>
                  </div>
                </motion.div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between mt-6 pt-4 border-t border-cyan-500/30"
                >
                  <div className="text-sm text-gray-400 font-mono">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedTrades.length)} of {filteredAndSortedTrades.length} trades
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-30 disabled:cursor-not-allowed font-mono"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 p-0 font-mono ${
                              currentPage === pageNum
                                ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.5)]'
                                : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
                            }`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-30 disabled:cursor-not-allowed font-mono"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
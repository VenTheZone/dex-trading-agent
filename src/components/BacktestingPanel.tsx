import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Activity, Download, BarChart3, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { TRADING_TOKENS } from "@/lib/tokenData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BacktestResult {
  startDate: string;
  endDate: string;
  initialBalance: number;
  finalBalance: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnl: number;
  totalPnlPercent: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  trades: any[];
  equityCurve: Array<{ timestamp: string; balance: number; position_value: number }>;
}

interface ParameterSet {
  id: string;
  leverage: number;
  takeProfitPercent: number;
  stopLossPercent: number;
  result?: BacktestResult;
}

export function BacktestingPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [parameterSets, setParameterSets] = useState<ParameterSet[]>([]);
  
  // Backtest parameters
  const [symbol, setSymbol] = useState('BTCUSD');
  const [days, setDays] = useState(30);
  const [initialBalance, setInitialBalance] = useState(10000);
  const [leverage, setLeverage] = useState(1);
  const [takeProfitPercent, setTakeProfitPercent] = useState(5);
  const [stopLossPercent, setStopLossPercent] = useState(2);

  const runBacktest = async (params?: Partial<ParameterSet>) => {
    setIsRunning(true);

    try {
      toast.info('Fetching historical data...');
      
      const dataResponse = await fetch(
        `${import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000'}/api/backtest/sample-data?symbol=${symbol}&days=${days}`
      );
      const dataResult = await dataResponse.json();
      
      if (!dataResult.success) {
        throw new Error(dataResult.error || 'Failed to fetch historical data');
      }

      toast.info('Running backtest simulation...');

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const testParams = params || {
        leverage,
        takeProfitPercent,
        stopLossPercent,
      };

      const backtestResponse = await fetch(
        `${import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000'}/api/backtest/run`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            intervalMinutes: 60,
            initialBalance,
            settings: {
              leverage: testParams.leverage,
              takeProfitPercent: testParams.takeProfitPercent,
              stopLossPercent: testParams.stopLossPercent,
              maxPositionSize: 0.5,
            },
            priceData: dataResult.priceData,
          }),
        }
      );

      const backtestResult = await backtestResponse.json();

      if (!backtestResult.success) {
        throw new Error(backtestResult.error || 'Backtest failed');
      }

      setResult(backtestResult.result);
      toast.success('Backtest completed!');
      
      return backtestResult.result;
    } catch (error: any) {
      console.error('Backtest error:', error);
      toast.error(`Backtest failed: ${error.message}`);
      return null;
    } finally {
      setIsRunning(false);
    }
  };

  const runParameterTuning = async () => {
    setIsRunning(true);
    const newParameterSets: ParameterSet[] = [];

    try {
      toast.info('Running parameter tuning...');
      
      // Test different parameter combinations
      const leverageValues = [1, 2, 3];
      const tpValues = [3, 5, 7];
      const slValues = [1, 2, 3];

      for (const lev of leverageValues) {
        for (const tp of tpValues) {
          for (const sl of slValues) {
            const paramSet: ParameterSet = {
              id: `L${lev}_TP${tp}_SL${sl}`,
              leverage: lev,
              takeProfitPercent: tp,
              stopLossPercent: sl,
            };
            
            toast.info(`Testing: Leverage ${lev}x, TP ${tp}%, SL ${sl}%`);
            const result = await runBacktest(paramSet);
            
            if (result) {
              paramSet.result = result;
              newParameterSets.push(paramSet);
            }
          }
        }
      }

      setParameterSets(newParameterSets);
      
      // Find best performing set
      const bestSet = newParameterSets.reduce((best, current) => 
        (current.result?.totalPnlPercent || 0) > (best.result?.totalPnlPercent || 0) ? current : best
      );
      
      toast.success(`Parameter tuning complete! Best: ${bestSet.id} with ${bestSet.result?.totalPnlPercent.toFixed(2)}% return`);
    } catch (error: any) {
      console.error('Parameter tuning error:', error);
      toast.error(`Parameter tuning failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const exportResults = () => {
    if (!result) return;
    
    const exportData = {
      backtest_config: {
        symbol,
        days,
        initialBalance,
        leverage,
        takeProfitPercent,
        stopLossPercent,
      },
      results: result,
      timestamp: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backtest_${symbol}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Results exported!');
  };

  // Calculate drawdown curve from equity curve
  const drawdownData = result?.equityCurve.map((point, index) => {
    const peak = Math.max(...result.equityCurve.slice(0, index + 1).map(p => p.balance));
    const drawdown = ((peak - point.balance) / peak) * 100;
    return {
      timestamp: point.timestamp,
      drawdown: -drawdown,
    };
  }) || [];

  // Trade distribution data
  const tradeDistribution = result ? [
    { name: 'Winning', value: result.winningTrades, color: '#00ff00' },
    { name: 'Losing', value: result.losingTrades, color: '#ff0000' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card className="bg-black/80 border-cyan-500/50">
        <CardHeader>
          <CardTitle className="text-cyan-400 font-mono flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Backtest Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-cyan-400 font-mono text-sm">Trading Pair</Label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger className="bg-black/50 border-cyan-500/30 text-cyan-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-cyan-500/50">
                  {TRADING_TOKENS.map((token) => (
                    <SelectItem key={token.symbol} value={`${token.symbol}USD`}>
                      {token.pair}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-cyan-400 font-mono text-sm">Period (Days)</Label>
              <Input
                type="number"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                className="bg-black/50 border-cyan-500/30 text-cyan-100"
                min={1}
                max={365}
              />
            </div>

            <div>
              <Label className="text-cyan-400 font-mono text-sm">Initial Balance ($)</Label>
              <Input
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(parseFloat(e.target.value))}
                className="bg-black/50 border-cyan-500/30 text-cyan-100"
                min={100}
              />
            </div>

            <div>
              <Label className="text-cyan-400 font-mono text-sm">Leverage</Label>
              <Input
                type="number"
                value={leverage}
                onChange={(e) => setLeverage(parseInt(e.target.value))}
                className="bg-black/50 border-cyan-500/30 text-cyan-100"
                min={1}
                max={20}
              />
            </div>

            <div>
              <Label className="text-cyan-400 font-mono text-sm">Take Profit (%)</Label>
              <Input
                type="number"
                value={takeProfitPercent}
                onChange={(e) => setTakeProfitPercent(parseFloat(e.target.value))}
                className="bg-black/50 border-cyan-500/30 text-cyan-100"
                min={0.1}
                step={0.1}
              />
            </div>

            <div>
              <Label className="text-cyan-400 font-mono text-sm">Stop Loss (%)</Label>
              <Input
                type="number"
                value={stopLossPercent}
                onChange={(e) => setStopLossPercent(parseFloat(e.target.value))}
                className="bg-black/50 border-cyan-500/30 text-cyan-100"
                min={0.1}
                step={0.1}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => runBacktest()}
              disabled={isRunning}
              className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black font-bold font-mono"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Activity className="mr-2 h-4 w-4" />
                  Run Backtest
                </>
              )}
            </Button>
            
            <Button
              onClick={runParameterTuning}
              disabled={isRunning}
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-black font-bold font-mono"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Parameter Tuning
            </Button>
            
            {result && (
              <Button
                onClick={exportResults}
                variant="outline"
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 font-mono"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Tabs defaultValue="metrics" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-black/50">
              <TabsTrigger value="metrics" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-mono text-xs">
                📊 Metrics
              </TabsTrigger>
              <TabsTrigger value="charts" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-mono text-xs">
                📈 Charts
              </TabsTrigger>
              <TabsTrigger value="trades" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-mono text-xs">
                💼 Trades
              </TabsTrigger>
              <TabsTrigger value="compare" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-mono text-xs">
                🔄 Compare
              </TabsTrigger>
            </TabsList>

            <TabsContent value="metrics" className="space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-black/80 border-cyan-500/50">
                  <CardContent className="p-4">
                    <div className="text-xs text-cyan-400 font-mono mb-1">Final Balance</div>
                    <div className="text-xl font-bold text-cyan-100 font-mono">
                      ${result.finalBalance.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card className={`bg-black/80 ${result.totalPnl >= 0 ? 'border-green-500/50' : 'border-red-500/50'}`}>
                  <CardContent className="p-4">
                    <div className="text-xs text-cyan-400 font-mono mb-1">Total P&L</div>
                    <div className={`text-xl font-bold font-mono ${result.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {result.totalPnl >= 0 ? '+' : ''}${result.totalPnl.toFixed(2)} ({result.totalPnlPercent.toFixed(2)}%)
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/80 border-cyan-500/50">
                  <CardContent className="p-4">
                    <div className="text-xs text-cyan-400 font-mono mb-1">Win Rate</div>
                    <div className="text-xl font-bold text-cyan-100 font-mono">
                      {result.winRate.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/80 border-cyan-500/50">
                  <CardContent className="p-4">
                    <div className="text-xs text-cyan-400 font-mono mb-1">Total Trades</div>
                    <div className="text-xl font-bold text-cyan-100 font-mono">
                      {result.totalTrades}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/80 border-green-500/50">
                  <CardContent className="p-4">
                    <div className="text-xs text-green-400 font-mono mb-1">Winning Trades</div>
                    <div className="text-xl font-bold text-green-400 font-mono">
                      {result.winningTrades}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/80 border-red-500/50">
                  <CardContent className="p-4">
                    <div className="text-xs text-red-400 font-mono mb-1">Losing Trades</div>
                    <div className="text-xl font-bold text-red-400 font-mono">
                      {result.losingTrades}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/80 border-cyan-500/50">
                  <CardContent className="p-4">
                    <div className="text-xs text-cyan-400 font-mono mb-1">Max Drawdown</div>
                    <div className="text-xl font-bold text-red-400 font-mono">
                      {result.maxDrawdownPercent.toFixed(2)}%
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/80 border-cyan-500/50">
                  <CardContent className="p-4">
                    <div className="text-xs text-cyan-400 font-mono mb-1">Sharpe Ratio</div>
                    <div className="text-xl font-bold text-cyan-100 font-mono">
                      {result.sharpeRatio.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="charts" className="space-y-4">
              {/* Equity Curve */}
              <Card className="bg-black/80 border-cyan-500/50">
                <CardHeader>
                  <CardTitle className="text-cyan-400 font-mono">Equity Curve</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={result.equityCurve}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#0ff3" />
                      <XAxis 
                        dataKey="timestamp" 
                        stroke="#0ff"
                        tick={{ fill: '#0ff', fontSize: 10 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis 
                        stroke="#0ff"
                        tick={{ fill: '#0ff', fontSize: 10 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#000', 
                          border: '1px solid #0ff',
                          borderRadius: '4px'
                        }}
                        labelStyle={{ color: '#0ff' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#0ff" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Drawdown Chart */}
              <Card className="bg-black/80 border-cyan-500/50">
                <CardHeader>
                  <CardTitle className="text-cyan-400 font-mono flex items-center gap-2">
                    <TrendingDown className="h-5 w-5" />
                    Drawdown Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={drawdownData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#0ff3" />
                      <XAxis 
                        dataKey="timestamp" 
                        stroke="#0ff"
                        tick={{ fill: '#0ff', fontSize: 10 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis 
                        stroke="#0ff"
                        tick={{ fill: '#0ff', fontSize: 10 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#000', 
                          border: '1px solid #0ff',
                          borderRadius: '4px'
                        }}
                        labelStyle={{ color: '#0ff' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="drawdown" 
                        stroke="#ff0000" 
                        strokeWidth={2}
                        dot={false}
                        fill="#ff000033"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Trade Distribution */}
              <Card className="bg-black/80 border-cyan-500/50">
                <CardHeader>
                  <CardTitle className="text-cyan-400 font-mono">Trade Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={tradeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {tradeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trades">
              <Card className="bg-black/80 border-cyan-500/50">
                <CardHeader>
                  <CardTitle className="text-cyan-400 font-mono">Trade History</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {result.trades.map((trade, index) => (
                        <div 
                          key={index}
                          className={`p-3 rounded border ${
                            trade.pnl >= 0 ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-sm font-mono text-cyan-400">
                                {new Date(trade.timestamp).toLocaleString()}
                              </div>
                              <div className="text-xs font-mono text-gray-400 mt-1">
                                {trade.reasoning}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg font-bold font-mono ${
                                trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                              </div>
                              <div className="text-xs font-mono text-gray-400">
                                Balance: ${trade.balance_after.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compare">
              {parameterSets.length > 0 ? (
                <Card className="bg-black/80 border-cyan-500/50">
                  <CardHeader>
                    <CardTitle className="text-cyan-400 font-mono">Parameter Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-3">
                        {parameterSets
                          .sort((a, b) => (b.result?.totalPnlPercent || 0) - (a.result?.totalPnlPercent || 0))
                          .map((set, index) => (
                            <div 
                              key={set.id}
                              className={`p-4 rounded border ${
                                index === 0 ? 'border-yellow-500 bg-yellow-500/10' : 'border-cyan-500/30 bg-cyan-500/5'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="text-sm font-mono text-cyan-400 font-bold">
                                    {index === 0 && '🏆 '}{set.id}
                                  </div>
                                  <div className="text-xs font-mono text-gray-400 mt-1">
                                    Leverage: {set.leverage}x | TP: {set.takeProfitPercent}% | SL: {set.stopLossPercent}%
                                  </div>
                                </div>
                                {set.result && (
                                  <div className="text-right">
                                    <div className={`text-lg font-bold font-mono ${
                                      set.result.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                      {set.result.totalPnlPercent.toFixed(2)}%
                                    </div>
                                    <div className="text-xs font-mono text-gray-400">
                                      Win Rate: {set.result.winRate.toFixed(1)}%
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-black/80 border-cyan-500/50">
                  <CardContent className="p-8 text-center">
                    <p className="text-cyan-400 font-mono">
                      Run parameter tuning to compare different configurations
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, DollarSign } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBalanceHistory, usePositionHistory } from '@/hooks/use-python-api';

export function BalanceChart() {
  const { history: balanceHistory, loading: balanceLoading } = useBalanceHistory(50);
  const { history: positionHistory, loading: positionLoading } = usePositionHistory(undefined, 50);

  if (balanceLoading || !balanceHistory || balanceHistory.length === 0) {
    return (
      <Card className="bg-black/90 border-cyan-500/50">
        <CardHeader>
          <CardTitle className="text-cyan-400 font-mono flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8 font-mono">
            {balanceLoading ? 'Loading history...' : 'No history data yet'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const balanceChartData = balanceHistory.map((entry: any) => ({
    time: new Date(entry.created_at).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    balance: entry.balance,
    fullTime: new Date(entry.created_at).toLocaleString(),
  }));

  const pnlChartData = positionHistory?.map((entry: any) => ({
    time: new Date(entry.created_at).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    pnl: entry.unrealized_pnl,
    symbol: entry.symbol,
    fullTime: new Date(entry.created_at).toLocaleString(),
  })) || [];

  const currentBalance = balanceHistory[balanceHistory.length - 1]?.balance || 0;
  const startBalance = balanceHistory[0]?.balance || 0;
  const change = currentBalance - startBalance;
  const changePercent = startBalance > 0 ? ((change / startBalance) * 100).toFixed(2) : '0.00';

  return (
    <Card className="bg-black/90 border-cyan-500/50">
      <CardHeader>
        <CardTitle className="text-cyan-400 font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance History
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-cyan-100">${currentBalance.toLocaleString()}</span>
            </div>
            <div className={`font-bold ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePercent}%)
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="balance" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/50">
            <TabsTrigger value="balance" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-mono">
              Balance Curve
            </TabsTrigger>
            <TabsTrigger value="pnl" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-mono">
              P&L History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="balance" className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={balanceChartData}>
                <defs>
                  <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00ff00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 255, 0.1)" />
                <XAxis 
                  dataKey="time" 
                  stroke="#00ffff"
                  style={{ fontSize: '12px', fontFamily: 'monospace' }}
                />
                <YAxis 
                  stroke="#00ffff"
                  style={{ fontSize: '12px', fontFamily: 'monospace' }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    border: '1px solid rgba(0, 255, 255, 0.5)',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                  }}
                  labelStyle={{ color: '#00ffff' }}
                  itemStyle={{ color: '#00ff00' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']}
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#00ff00" 
                  strokeWidth={2}
                  fill="url(#balanceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="pnl" className="mt-4">
            {positionLoading ? (
              <div className="text-center text-gray-500 py-8 font-mono">
                Loading position history...
              </div>
            ) : pnlChartData.length === 0 ? (
              <div className="text-center text-gray-500 py-8 font-mono">
                No position history yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={pnlChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 255, 0.1)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#00ffff"
                    style={{ fontSize: '12px', fontFamily: 'monospace' }}
                  />
                  <YAxis 
                    stroke="#00ffff"
                    style={{ fontSize: '12px', fontFamily: 'monospace' }}
                    tickFormatter={(value) => `$${value.toFixed(2)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      border: '1px solid rgba(0, 255, 255, 0.5)',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                    }}
                    labelStyle={{ color: '#00ffff' }}
                  formatter={(value: number, _name: string, props: any) => [
                    `$${value.toFixed(2)}`,
                    `P&L (${props.payload.symbol})`
                  ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pnl" 
                    stroke="#ff0080" 
                    strokeWidth={2}
                    dot={{ fill: '#00ffff', r: 3 }}
                    activeDot={{ r: 5, fill: '#ff0080' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
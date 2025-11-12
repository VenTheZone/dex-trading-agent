import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign } from 'lucide-react';

export function BalanceChart() {
  const balanceHistory = useQuery(api.balanceHistory.getBalanceHistory, { limit: 50 });

  if (!balanceHistory || balanceHistory.length === 0) {
    return (
      <Card className="bg-black/90 border-cyan-500/50">
        <CardHeader>
          <CardTitle className="text-cyan-400 font-mono flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Balance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8 font-mono">
            No balance history yet
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = balanceHistory.map((entry) => ({
    time: new Date(entry._creationTime).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    balance: entry.balance,
    fullTime: new Date(entry._creationTime).toLocaleString(),
  }));

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
            Balance History
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
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
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
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="#00ff00" 
              strokeWidth={2}
              dot={{ fill: '#00ffff', r: 3 }}
              activeDot={{ r: 5, fill: '#ff0080' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

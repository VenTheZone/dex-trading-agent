import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTradingStore } from '@/store/tradingStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Bot, BotOff } from 'lucide-react';

export function TradingControls() {
  const { settings, updateSettings, chartInterval, setChartInterval, chartType, setChartType, isAutoTrading, setAutoTrading } = useTradingStore();
  const [localSettings, setLocalSettings] = useState(settings);
  
  const timeIntervals = ['1m', '5m', '15m', '1h', '4h', '1d'];
  const rangeIntervals = ['1R', '10R', '100R', '$100'];
  
  const handleSaveSettings = () => {
    updateSettings(localSettings);
    toast.success('Risk settings updated');
  };
  
  const handleToggleAutoTrading = () => {
    const newState = !isAutoTrading;
    setAutoTrading(newState);
    toast.success(newState ? 'AI Auto-Trading Enabled' : 'AI Auto-Trading Disabled');
  };
  
  return (
    <Card className="bg-black/90 border-cyan-500/50">
      <CardHeader>
        <CardTitle className="text-cyan-400 font-mono flex items-center justify-between">
          Trading Controls
          <Button
            variant={isAutoTrading ? 'default' : 'outline'}
            size="sm"
            onClick={handleToggleAutoTrading}
            className={isAutoTrading 
              ? 'bg-green-500 hover:bg-green-600 text-black' 
              : 'border-cyan-500/30 text-cyan-400'
            }
          >
            {isAutoTrading ? <Bot className="h-4 w-4 mr-1" /> : <BotOff className="h-4 w-4 mr-1" />}
            {isAutoTrading ? 'AI ON' : 'AI OFF'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Chart Type Selector */}
        <div className="space-y-3">
          <Label className="text-cyan-400 font-mono">Chart Type</Label>
          <Tabs value={chartType} onValueChange={(v) => setChartType(v as 'time' | 'range')}>
            <TabsList className="grid w-full grid-cols-2 bg-black/50">
              <TabsTrigger value="time" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-mono">
                Time-Based
              </TabsTrigger>
              <TabsTrigger value="range" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-mono">
                Range-Based
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Interval Selector */}
        <div className="space-y-3">
          <Label className="text-cyan-400 font-mono">Interval</Label>
          <div className="grid grid-cols-3 gap-2">
            {(chartType === 'time' ? timeIntervals : rangeIntervals).map((interval) => (
              <Button
                key={interval}
                variant={chartInterval === interval ? 'default' : 'outline'}
                onClick={() => setChartInterval(interval)}
                className={`font-mono ${
                  chartInterval === interval
                    ? 'bg-cyan-500 text-black hover:bg-cyan-600'
                    : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
                }`}
              >
                {interval}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Leverage Control */}
        <div className="space-y-4 pt-4 border-t border-cyan-500/30">
          <h3 className="text-cyan-400 font-mono font-bold">Leverage Settings</h3>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-cyan-400 font-mono">Leverage</Label>
              <span className="text-cyan-100 font-mono font-bold text-lg">{localSettings.leverage}x</span>
            </div>
            <Input
              type="range"
              min="1"
              max={localSettings.maxLeverage}
              step="1"
              value={localSettings.leverage}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                leverage: Number(e.target.value)
              })}
              className="bg-black/50 border-cyan-500/30"
            />
            <div className="flex justify-between text-xs text-gray-500 font-mono">
              <span>1x</span>
              <span>{localSettings.maxLeverage}x</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-cyan-400 font-mono">Max Leverage</Label>
            <Input
              type="number"
              min="1"
              max="100"
              value={localSettings.maxLeverage}
              onChange={(e) => {
                const maxLev = Number(e.target.value);
                setLocalSettings({
                  ...localSettings,
                  maxLeverage: maxLev,
                  leverage: Math.min(localSettings.leverage, maxLev)
                });
              }}
              className="bg-black/50 border-cyan-500/30 text-cyan-100 font-mono"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-cyan-400 font-mono">Allow AI to Use Leverage</Label>
            <Switch
              checked={localSettings.allowAILeverage}
              onCheckedChange={(checked) => setLocalSettings({
                ...localSettings,
                allowAILeverage: checked
              })}
            />
          </div>
        </div>
        
        {/* Risk Management */}
        <div className="space-y-4 pt-4 border-t border-cyan-500/30">
          <h3 className="text-cyan-400 font-mono font-bold">Risk Management</h3>
          
          <div className="space-y-2">
            <Label className="text-cyan-400 font-mono">Take Profit (%)</Label>
            <Input
              type="number"
              value={localSettings.takeProfitPercent}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                takeProfitPercent: Number(e.target.value)
              })}
              className="bg-black/50 border-cyan-500/30 text-cyan-100 font-mono"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-cyan-400 font-mono">Stop Loss (%)</Label>
            <Input
              type="number"
              value={localSettings.stopLossPercent}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                stopLossPercent: Number(e.target.value)
              })}
              className="bg-black/50 border-cyan-500/30 text-cyan-100 font-mono"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-cyan-400 font-mono">Advanced Strategy</Label>
            <Switch
              checked={localSettings.useAdvancedStrategy}
              onCheckedChange={(checked) => setLocalSettings({
                ...localSettings,
                useAdvancedStrategy: checked
              })}
            />
          </div>
          
          {localSettings.useAdvancedStrategy && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pl-4 border-l-2 border-cyan-500/50"
            >
              <div className="space-y-2">
                <Label className="text-cyan-400 font-mono text-sm">Partial Profit (%)</Label>
                <Input
                  type="number"
                  value={localSettings.partialProfitPercent}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    partialProfitPercent: Number(e.target.value)
                  })}
                  className="bg-black/50 border-cyan-500/30 text-cyan-100 font-mono"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-cyan-400 font-mono text-sm">Trailing Stop</Label>
                <Switch
                  checked={localSettings.useTrailingStop}
                  onCheckedChange={(checked) => setLocalSettings({
                    ...localSettings,
                    useTrailingStop: checked
                  })}
                />
              </div>
            </motion.div>
          )}
          
          <Button
            onClick={handleSaveSettings}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold font-mono"
          >
            Apply Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
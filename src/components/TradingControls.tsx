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
import { Bot, BotOff, Sparkles } from 'lucide-react';
import { storage } from '@/lib/storage';

export function TradingControls() {
  const { settings, updateSettings, chartInterval, setChartInterval, chartType, setChartType, isAutoTrading, setAutoTrading } = useTradingStore();
  const [localSettings, setLocalSettings] = useState(settings);
  
  const timeIntervals = ['1m', '5m', '15m', '1h', '4h', '1d'];
  const rangeIntervals = ['1R', '10R', '100R', '$100'];
  
  const availableCoins = [
    'BTCUSD', 'ETHUSD', 'SOLUSD', 'AVAXUSD', 'BNBUSD', 'ADAUSD', 'DOTUSD', 'MATICUSD',
    'DOGEUSD', 'SHIBUSD', 'PEPEUSD', 'WIFUSD', 'BONKUSD'
  ];
  
  const handleSaveSettings = () => {
    updateSettings(localSettings);
    toast.success('✅ Risk settings updated', {
      description: 'Your trading parameters have been saved',
    });
  };
  
  const handleToggleAutoTrading = () => {
    const newState = !isAutoTrading;
    
    if (newState) {
      const keys = storage.getApiKeys();
      if (!keys?.openRouter) {
        toast.error('❌ OpenRouter API key required', {
          description: 'Configure your API key to enable AI trading',
        });
        return;
      }
      
      if ((localSettings.allowedCoins || []).length === 0) {
        toast.error('❌ No coins selected', {
          description: 'Please select at least one coin for AI trading',
        });
        return;
      }
      
      toast.success('🤖 AI Auto-Trading Enabled', {
        description: 'Analyzing market every 2 minutes',
      });
    } else {
      toast.success('🛑 AI Auto-Trading Disabled', {
        description: 'Manual trading mode active',
      });
    }
    
    setAutoTrading(newState);
  };
  
  const handleToggleCoin = (coin: string) => {
    const currentCoins = localSettings.allowedCoins || [];
    
    if (currentCoins.includes(coin)) {
      setLocalSettings({
        ...localSettings,
        allowedCoins: currentCoins.filter(c => c !== coin),
      });
    } else {
      if (currentCoins.length >= 5) {
        toast.error('❌ Maximum 5 coins allowed', {
          description: 'Remove a coin before adding another',
        });
        return;
      }
      setLocalSettings({
        ...localSettings,
        allowedCoins: [...currentCoins, coin],
      });
    }
  };
  
  return (
    <Card className="bg-gradient-to-br from-black/90 to-black/80 border-cyan-500/50 shadow-[0_0_30px_rgba(0,255,255,0.2)]">
      <CardHeader className="border-b border-cyan-500/30">
        <CardTitle className="text-cyan-400 font-mono flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Trading Controls
          </span>
          <Button
            variant={isAutoTrading ? 'default' : 'outline'}
            size="sm"
            onClick={handleToggleAutoTrading}
            className={`font-mono font-bold transition-all ${
              isAutoTrading 
                ? 'bg-green-500 hover:bg-green-600 text-black shadow-[0_0_20px_rgba(34,197,94,0.5)]' 
                : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
            }`}
          >
            {isAutoTrading ? <Bot className="h-4 w-4 mr-1 animate-pulse" /> : <BotOff className="h-4 w-4 mr-1" />}
            {isAutoTrading ? 'AI ON' : 'AI OFF'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6">
        {/* Allowed Coins Selector */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 pb-4 border-b border-cyan-500/30"
        >
          <div className="flex items-center justify-between">
            <Label className="text-cyan-400 font-mono font-bold">Allowed Coins</Label>
            <span className="text-xs text-gray-500 font-mono bg-black/50 px-2 py-1 rounded">
              {(localSettings.allowedCoins || []).length}/5 selected
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {availableCoins.map((coin) => {
              const isSelected = (localSettings.allowedCoins || []).includes(coin);
              const isMeme = ['DOGEUSD', 'SHIBUSD', 'PEPEUSD', 'WIFUSD', 'BONKUSD'].includes(coin);
              return (
                <Button
                  key={coin}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleToggleCoin(coin)}
                  className={`font-mono text-xs transition-all ${
                    isSelected
                      ? 'bg-cyan-500 text-black hover:bg-cyan-600 shadow-[0_0_15px_rgba(0,255,255,0.4)]'
                      : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
                  } ${isMeme ? 'border-pink-500/50' : ''}`}
                  title={isMeme ? 'Meme Coin - High Volatility' : ''}
                >
                  {isMeme && '🐕 '}
                  {coin.replace('USD', '')}
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 font-mono">
            AI will only trade selected coins (max 5)
          </p>
        </motion.div>
        
        {/* Chart Type Selector */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <Label className="text-cyan-400 font-mono font-bold">Chart Type</Label>
          <Tabs value={chartType} onValueChange={(v) => setChartType(v as 'time' | 'range')}>
            <TabsList className="grid w-full grid-cols-2 bg-black/50 border border-cyan-500/30">
              <TabsTrigger 
                value="time" 
                className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-mono data-[state=active]:shadow-[0_0_15px_rgba(0,255,255,0.4)]"
              >
                Time-Based
              </TabsTrigger>
              <TabsTrigger 
                value="range" 
                className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-mono data-[state=active]:shadow-[0_0_15px_rgba(0,255,255,0.4)]"
              >
                Range-Based
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>
        
        {/* Interval Selector */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <Label className="text-cyan-400 font-mono font-bold">Interval</Label>
          <div className="grid grid-cols-3 gap-2">
            {(chartType === 'time' ? timeIntervals : rangeIntervals).map((interval) => (
              <Button
                key={interval}
                variant={chartInterval === interval ? 'default' : 'outline'}
                onClick={() => setChartInterval(interval)}
                className={`font-mono transition-all ${
                  chartInterval === interval
                    ? 'bg-cyan-500 text-black hover:bg-cyan-600 shadow-[0_0_15px_rgba(0,255,255,0.4)]'
                    : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
                }`}
              >
                {interval}
              </Button>
            ))}
          </div>
        </motion.div>
        
        {/* Leverage Control */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4 pt-4 border-t border-cyan-500/30"
        >
          <h3 className="text-cyan-400 font-mono font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Leverage Settings
          </h3>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-cyan-400 font-mono">Leverage</Label>
              <span className="text-cyan-100 font-mono font-bold text-lg bg-black/50 px-3 py-1 rounded border border-cyan-500/30">
                {localSettings.leverage}x
              </span>
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
              className="bg-black/50 border-cyan-500/30 accent-cyan-500"
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
          
          <div className="flex items-center justify-between bg-black/50 p-3 rounded border border-cyan-500/30">
            <Label className="text-cyan-400 font-mono">Allow AI to Use Leverage</Label>
            <Switch
              checked={localSettings.allowAILeverage}
              onCheckedChange={(checked) => setLocalSettings({
                ...localSettings,
                allowAILeverage: checked
              })}
            />
          </div>
        </motion.div>
        
        {/* Risk Management */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4 pt-4 border-t border-cyan-500/30"
        >
          <h3 className="text-cyan-400 font-mono font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Risk Management
          </h3>
          
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
          
          <div className="flex items-center justify-between bg-black/50 p-3 rounded border border-cyan-500/30">
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
              
              <div className="flex items-center justify-between bg-black/50 p-3 rounded border border-cyan-500/30">
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
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold font-mono shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all"
          >
            Apply Settings
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
}
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTradingStore } from '@/store/tradingStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Bot, BotOff, Sparkles, X, Brain, AlertTriangle, FileText, RotateCcw, Network } from 'lucide-react';
import { storage } from '@/lib/storage';
import { useTrading } from '@/hooks/use-trading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_PROMPT } from '@/store/tradingStore';
import { sanitizeNumberWithBounds, sanitizeMultilineText } from '@/lib/utils';
import { TRADING_TOKENS } from '@/lib/tokenData';

export function TradingControls() {
  const { settings, updateSettings, chartInterval, setChartInterval, chartType, setChartType, isAutoTrading, setAutoTrading, position, aiModel, setAiModel, customPrompt, setCustomPrompt, resetPromptToDefault, mode, network } = useTradingStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [localPrompt, setLocalPrompt] = useState(customPrompt);
  const [testingConnection, setTestingConnection] = useState(false);
  const { closePosition, closeAllPositions } = useTrading();
  
  const timeIntervals = ['1m', '5m', '15m', '1h', '4h', '1d'];
  const rangeIntervals = ['1R', '10R', '100R', '$100'];
  
  // Use centralized token list
  const availableCoins = TRADING_TOKENS.map((token) => token.tradingViewSymbol || `${token.symbol}USD`);
  
  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const { useAction } = await import('@/hooks/use-auth');
      const testConnection = useAction((api: any) => api.hyperliquid.testConnection);
      
      const result = await testConnection({ isTestnet: network === 'testnet' });
      
      if (result.success) {
        toast.success(`✅ ${result.message}`, {
          description: `API: ${result.apiEndpoint}\nApp: ${result.appUrl}\n${result.assetsCount} assets available\nSample: ${result.availableAssets}`,
          duration: 8000,
        });
      } else {
        toast.error(`❌ ${result.message}`, {
          description: result.error,
          duration: 5000,
        });
      }
    } catch (error: any) {
      toast.error('❌ Connection test failed', {
        description: error.message,
        duration: 5000,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleClosePosition = async () => {
    if (!position) return;
    try {
      await closePosition(position);
    } catch (error) {
      console.error("Failed to close position:", error);
    }
  };

  const handleCloseAllPositions = async () => {
    try {
      await closeAllPositions();
    } catch (error) {
      console.error("Failed to close all positions:", error);
    }
  };
  
  const handleSaveSettings = () => {
    updateSettings(localSettings);
    toast.success('✅ Settings updated', {
      description: 'Your trading parameters have been saved. Charts will update automatically.',
    });
  };
  
  const handleToggleAutoTrading = () => {
    const newState = !isAutoTrading;
    
    if (newState) {
      const keys = storage.getApiKeys();
      const isDemoMode = storage.isDemoMode();
      
      // Validation checks
      if (!isDemoMode && (!keys?.openRouter || keys.openRouter === 'DEMO_MODE')) {
        toast.error('❌ OpenRouter API key required', {
          description: 'Configure your API key in Settings or use Demo mode',
          duration: 5000,
        });
        return;
      }
      
      if ((localSettings.allowedCoins || []).length === 0) {
        toast.error('❌ No coins selected', {
          description: 'Please select at least one coin for AI trading',
          duration: 5000,
        });
        return;
      }
      
      const coinCount = (localSettings.allowedCoins || []).length;
      const modeText = isDemoMode ? '[DEMO]' : mode.toUpperCase();
      
      toast.success(`🤖 AI Auto-Trading Enabled ${modeText}`, {
        description: `Analyzing ${coinCount} coin${coinCount > 1 ? 's' : ''} every 10 seconds`,
        duration: 5000,
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
      if (currentCoins.length >= 4) {
        toast.error('❌ Maximum 4 coins allowed', {
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

  const handleAiModelChange = (model: 'deepseek/deepseek-chat-v3-0324:free' | 'qwen/qwen3-max') => {
    if (model === 'qwen/qwen3-max') {
      const confirmed = window.confirm(
        '⚠️ QWEN PRICING NOTICE\n\n' +
        'Qwen is a PAID model with the following pricing:\n\n' +
        '• Input (≤128K): $1.20 per 1M tokens\n' +
        '• Input (>128K): $3.00 per 1M tokens\n' +
        '• Output (≤128K): $6.00 per 1M tokens\n' +
        '• Output (>128K): $15.00 per 1M tokens\n\n' +
        'DeepSeek is FREE and recommended for most users.\n\n' +
        'Do you want to continue with Qwen?'
      );
      
      if (!confirmed) return;
      
      toast.warning('💰 Qwen AI Model Selected', {
        description: 'This is a paid model. Monitor your OpenRouter usage.',
        duration: 5000,
      });
    } else {
      toast.success('✅ DeepSeek AI Model Selected', {
        description: 'Free tier - No usage costs',
      });
    }
    
    setAiModel(model);
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
        {/* Network Connection Test */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 pb-4 border-b border-cyan-500/30"
        >
          <Label className="text-cyan-400 font-mono font-bold flex items-center gap-2">
            <Network className="h-4 w-4" />
            Hyperliquid Connection
          </Label>
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 font-mono"
          >
            {testingConnection ? (
              <>
                <Bot className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <Network className="mr-2 h-4 w-4" />
                Test {network === 'testnet' ? 'Testnet' : 'Mainnet'} Connection
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500 font-mono">
            Current network: <span className={network === 'testnet' ? 'text-blue-400' : 'text-purple-400'}>
              {network === 'testnet' ? 'Hyperliquid Testnet' : 'Hyperliquid Mainnet'}
            </span>
          </p>
        </motion.div>

        {/* AI Model Selector */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 pb-4 border-b border-cyan-500/30"
        >
          <div className="flex items-center justify-between">
            <Label className="text-cyan-400 font-mono font-bold flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Model
            </Label>
            <span className={`text-xs font-mono px-2 py-1 rounded ${
              aiModel === 'deepseek/deepseek-chat-v3-0324:free' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {aiModel === 'deepseek/deepseek-chat-v3-0324:free' ? '✓ FREE' : '💰 PAID'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={aiModel === 'deepseek/deepseek-chat-v3-0324:free' ? 'default' : 'outline'}
              onClick={() => handleAiModelChange('deepseek/deepseek-chat-v3-0324:free')}
              className={`font-mono text-xs transition-all ${
                aiModel === 'deepseek/deepseek-chat-v3-0324:free'
                  ? 'bg-cyan-500 text-black hover:bg-cyan-600 shadow-[0_0_15px_rgba(0,255,255,0.4)]'
                  : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
              }`}
            >
              DeepSeek
              <span className="ml-1 text-green-400">FREE</span>
            </Button>
            <Button
              variant={aiModel === 'qwen/qwen3-max' ? 'default' : 'outline'}
              onClick={() => handleAiModelChange('qwen/qwen3-max')}
              className={`font-mono text-xs transition-all ${
                aiModel === 'qwen/qwen3-max'
                  ? 'bg-yellow-500 text-black hover:bg-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.4)]'
                  : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
              }`}
            >
              Qwen
              <span className="ml-1 text-yellow-400">PAID</span>
            </Button>
          </div>
          
          {aiModel === 'qwen/qwen3-max' && (
            <Alert className="bg-yellow-500/10 border-yellow-500/50">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-200 text-xs">
                <strong>Qwen Pricing:</strong> Input $1.20-$3/1M tokens, Output $6-$15/1M tokens
              </AlertDescription>
            </Alert>
          )}
          
          {mode === 'paper' && (
            <Alert className="bg-cyan-500/10 border-cyan-500/50">
              <AlertTriangle className="h-4 w-4 text-cyan-500" />
              <AlertDescription className="text-cyan-200 text-xs">
                <strong>Paper Trading Active:</strong> All trades are simulated. Enable AI auto-trading to test DeepSeek's execution capabilities.
              </AlertDescription>
            </Alert>
          )}
          
          <p className="text-xs text-gray-500 font-mono">
            {aiModel === 'deepseek/deepseek-chat-v3-0324:free' 
              ? 'DeepSeek is free and recommended for most users' 
              : 'Qwen offers advanced reasoning but has usage costs'}
          </p>
        </motion.div>

        {/* Position Management */}
        {position && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 pb-4 border-b border-cyan-500/30"
          >
            <Label className="text-cyan-400 font-mono font-bold">Active Position</Label>
            <div className="bg-black/50 border border-cyan-500/30 rounded p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 font-mono">Symbol</p>
                  <p className="text-lg font-bold text-cyan-100 font-mono">{position.symbol}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-mono">Side</p>
                  <p className={`text-lg font-bold font-mono ${position.side === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                    {position.side.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-mono">P&L</p>
                  <p className={`text-lg font-bold font-mono ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${position.pnl.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClosePosition}
                  className="font-mono bg-red-500 hover:bg-red-600"
                >
                  <X className="mr-2 h-4 w-4" />
                  Close Position
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCloseAllPositions}
                  className="font-mono border-red-500/50 text-red-400 hover:bg-red-500/20"
                >
                  <X className="mr-2 h-4 w-4" />
                  Close All
                </Button>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Allowed Coins Selector */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 pb-4 border-b border-cyan-500/30"
        >
          <div className="flex items-center justify-between">
            <Label className="text-cyan-400 font-mono font-bold">Allowed Coins</Label>
            <span className="text-xs text-gray-500 font-mono bg-black/50 px-2 py-1 rounded">
              {(localSettings.allowedCoins || []).length}/4 selected
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
            AI will only trade selected coins (max 4)
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
        
        {/* Leverage Settings - Dialog */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pt-4 border-t border-cyan-500/30"
        >
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 font-mono"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Leverage Settings ({localSettings.leverage}x)
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-black/95 border-cyan-500/50">
              <SheetHeader>
                <SheetTitle className="text-cyan-400 font-mono">Leverage Settings</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-6">
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
                    onChange={(e) => {
                      const sanitized = sanitizeNumberWithBounds(e.target.value, 1, localSettings.maxLeverage, 1);
                      setLocalSettings({
                        ...localSettings,
                        leverage: sanitized
                      });
                    }}
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
                      const maxLev = sanitizeNumberWithBounds(e.target.value, 1, 100, 20);
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
              </div>
            </SheetContent>
          </Sheet>
        </motion.div>
        
        {/* Risk Management - Dialog */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4 pt-4 border-t border-cyan-500/30"
        >
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 font-mono"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Risk Management (TP: {localSettings.takeProfitPercent}% / SL: {localSettings.stopLossPercent}%)
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-black/95 border-cyan-500/50">
              <SheetHeader>
                <SheetTitle className="text-cyan-400 font-mono">Risk Management</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label className="text-cyan-400 font-mono">Take Profit (%)</Label>
                  <Input
                    type="number"
                    value={localSettings.takeProfitPercent}
                    onChange={(e) => {
                      const sanitized = sanitizeNumberWithBounds(e.target.value, 0, 1000, 100);
                      setLocalSettings({
                        ...localSettings,
                        takeProfitPercent: sanitized
                      });
                    }}
                    className="bg-black/50 border-cyan-500/30 text-cyan-100 font-mono"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-cyan-400 font-mono">Stop Loss (%)</Label>
                  <Input
                    type="number"
                    value={localSettings.stopLossPercent}
                    onChange={(e) => {
                      const sanitized = sanitizeNumberWithBounds(e.target.value, 0, 100, 20);
                      setLocalSettings({
                        ...localSettings,
                        stopLossPercent: sanitized
                      });
                    }}
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
                        onChange={(e) => {
                          const sanitized = sanitizeNumberWithBounds(e.target.value, 0, 100, 50);
                          setLocalSettings({
                            ...localSettings,
                            partialProfitPercent: sanitized
                          });
                        }}
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
              </div>
            </SheetContent>
          </Sheet>
          
          <Button
            onClick={handleSaveSettings}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold font-mono shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all"
          >
            Apply Settings
          </Button>
        </motion.div>
        
        {/* AI Prompt Template Editor */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4 pt-4 border-t border-cyan-500/30"
        >
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 font-mono"
              >
                <FileText className="mr-2 h-4 w-4" />
                AI Prompt Template
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-black/95 border-cyan-500/50 h-[80vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-cyan-400 font-mono flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Customize AI Trading Strategy
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setLocalPrompt(DEFAULT_PROMPT);
                      toast.info('Prompt reset to default template');
                    }}
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 font-mono"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset to Default
                  </Button>
                </SheetTitle>
              </SheetHeader>
              
              <div className="space-y-4 mt-6">
                <Alert className="bg-cyan-500/10 border-cyan-500/50">
                  <Brain className="h-4 w-4 text-cyan-500" />
                  <AlertDescription className="text-cyan-200 text-xs">
                    <strong>Customize Your AI Strategy:</strong> Edit the prompt below to define how the AI should analyze markets and make trading decisions. The AI will follow your instructions when analyzing charts and generating trade signals.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label className="text-cyan-400 font-mono">AI Prompt Template</Label>
                  <Textarea
                    value={localPrompt}
                    onChange={(e) => {
                      const sanitized = sanitizeMultilineText(e.target.value, 10000);
                      setLocalPrompt(sanitized);
                    }}
                    className="bg-black/50 border-cyan-500/30 text-cyan-100 font-mono min-h-[400px] text-sm"
                    placeholder="Enter your custom AI trading strategy prompt..."
                  />
                  <p className="text-xs text-gray-500 font-mono">
                    The AI will use this prompt as the foundation for all market analysis. Include your preferred indicators, risk tolerance, and trading style.
                  </p>
                </div>
                
                <div className="bg-black/50 border border-cyan-500/30 rounded p-4 space-y-2">
                  <h4 className="text-cyan-400 font-mono font-bold text-sm">Prompt Guidelines:</h4>
                  <ul className="text-xs text-gray-400 font-mono space-y-1">
                    <li>• Define your preferred technical indicators (RSI, MACD, etc.)</li>
                    <li>• Specify risk management rules and position sizing</li>
                    <li>• Include market conditions you want to trade (trending, ranging, etc.)</li>
                    <li>• Set confidence thresholds for trade execution</li>
                    <li>• Describe your preferred entry/exit strategies</li>
                  </ul>
                </div>
                
                <Button
                  onClick={() => {
                    setCustomPrompt(localPrompt);
                    toast.success('✅ AI prompt template updated', {
                      description: 'Your custom strategy will be used for all future analysis',
                    });
                  }}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold font-mono shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all"
                >
                  Save Custom Prompt
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </motion.div>
        
        <Button
          onClick={handleSaveSettings}
          className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold font-mono shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all"
        >
          Apply Settings
        </Button>
      </CardContent>
    </Card>
  );
}
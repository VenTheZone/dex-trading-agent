import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TradingBackground } from '@/components/CyberpunkBackground';
import { ApiKeySetup } from '@/components/ApiKeySetup';
import { TradingChart } from '@/components/TradingChart';
import { TradingControls } from '@/components/TradingControls';
import { LogoDropdown } from '@/components/LogoDropdown';
import { storage } from '@/lib/storage';
import { useTradingStore } from '@/store/tradingStore';
import { Activity, DollarSign, TrendingUp, Settings, Loader2, LineChart, Network } from 'lucide-react';
import { toast } from 'sonner';
import { TradingLogs } from '@/components/TradingLogs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { BalanceChart } from '@/components/BalanceChart';

export default function Dashboard() {
  const { isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [hasApiKeys, setHasApiKeys] = useState(false);
  const { mode, setMode, network, setNetwork, balance, position } = useTradingStore();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isLoading, isAuthenticated, navigate]);
  
  useEffect(() => {
    const keys = storage.getApiKeys();
    setHasApiKeys(!!keys);
  }, []);
  
  // Calculate P&L
  const pnl = position?.pnl || 0;
  const pnlPercent = position ? ((pnl / (position.entryPrice * position.size)) * 100).toFixed(2) : '0.00';
  
  const handleModeToggle = () => {
    const newMode = mode === 'paper' ? 'live' : 'paper';
    if (newMode === 'live') {
      const confirmed = window.confirm(
        '⚠️ WARNING: You are about to switch to LIVE TRADING mode.\n\n' +
        'Real funds will be at risk. Are you sure you want to continue?'
      );
      if (!confirmed) return;
    }
    setMode(newMode);
    toast.success(`Switched to ${newMode.toUpperCase()} trading mode`);
  };

  const handleNetworkToggle = () => {
    const newNetwork = network === 'mainnet' ? 'testnet' : 'mainnet';
    const confirmed = window.confirm(
      `Switch to Hyperliquid ${newNetwork.toUpperCase()}?\n\n` +
      (newNetwork === 'testnet' 
        ? 'Testnet uses test funds and is safe for experimentation.' 
        : '⚠️ MAINNET uses real funds. Ensure you understand the risks.')
    );
    if (!confirmed) return;
    
    setNetwork(newNetwork);
    toast.success(`Switched to Hyperliquid ${newNetwork.toUpperCase()}`);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }
  
  if (!hasApiKeys) {
    return (
      <div className="min-h-screen bg-black">
        <TradingBackground />
        <div className="relative z-10">
          <div className="p-4">
            <LogoDropdown />
          </div>
          <ApiKeySetup onComplete={() => setHasApiKeys(true)} />
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-cyan-100">
        <TradingBackground />
      
      <div className="relative z-10">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="border-b border-cyan-500/30 bg-black/80 backdrop-blur-sm"
        >
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <LogoDropdown />
              <h1 
                className="text-3xl font-bold text-cyan-400"
                style={{ 
                  fontFamily: 'monospace',
                  textShadow: '0 0 20px rgba(0,255,255,0.8), 2px 2px 0 #ff0080'
                }}
              >
                DeX TRADING AGENT
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                  >
                    <LineChart className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[600px] bg-black/95 border-cyan-500/50">
                  <SheetHeader>
                    <SheetTitle className="text-cyan-400 font-mono">Balance History</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <BalanceChart />
                  </div>
                </SheetContent>
              </Sheet>

              <Badge 
                variant="outline"
                className={`text-lg px-4 py-2 font-mono cursor-pointer ${
                  network === 'mainnet' 
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500' 
                    : 'bg-blue-500/20 text-blue-400 border-blue-500'
                }`}
                onClick={handleNetworkToggle}
              >
                <Network className="mr-2 h-4 w-4" />
                {network === 'mainnet' ? '🟣 MAINNET' : '🔵 TESTNET'}
              </Badge>
              
              <Badge 
                variant={mode === 'paper' ? 'secondary' : 'destructive'}
                className={`text-lg px-4 py-2 font-mono cursor-pointer ${
                  mode === 'paper' 
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500' 
                    : 'bg-red-500/20 text-red-400 border-red-500'
                }`}
                onClick={handleModeToggle}
              >
                {mode === 'paper' ? '📄 PAPER' : '🔴 LIVE'} TRADING
              </Badge>
              
              <Button
                variant="outline"
                size="icon"
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                onClick={() => {
                  storage.clearAll();
                  setHasApiKeys(false);
                  toast.success('API keys cleared');
                }}
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </motion.header>
        
        {/* Main Content */}
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Stats Row */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <Card className="bg-black/80 border-cyan-500/50 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-mono text-cyan-400">Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-cyan-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-100 font-mono">
                  ${balance.toLocaleString()}
                </div>
                {mode === 'live' && (
                  <p className="text-xs text-gray-400 mt-1">Live Account</p>
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-black/80 border-cyan-500/50 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-mono text-cyan-400">P&L</CardTitle>
                <TrendingUp className={`h-4 w-4 ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold font-mono ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                </div>
                <p className={`text-xs mt-1 ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {pnl >= 0 ? '+' : ''}{pnlPercent}%
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-black/80 border-cyan-500/50 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-mono text-cyan-400">Status</CardTitle>
                <Activity className="h-4 w-4 text-cyan-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-100 font-mono">
                  {position ? 'IN POSITION' : 'READY'}
                </div>
                {position && (
                  <p className="text-xs text-gray-400 mt-1">
                    {position.side.toUpperCase()} {position.size} {position.symbol}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Charts and Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Charts Grid */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <TradingChart symbol="BTCUSD" chartId={1} />
              <TradingChart symbol="ETHUSD" chartId={2} />
              <TradingChart symbol="SOLUSD" chartId={3} />
              <TradingChart symbol="AVAXUSD" chartId={4} />
            </motion.div>
            
            {/* Controls and Logs Sidebar */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-1"
            >
              <Tabs defaultValue="controls" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-black/50">
                  <TabsTrigger 
                    value="controls" 
                    className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-mono"
                  >
                    Controls
                  </TabsTrigger>
                  <TabsTrigger 
                    value="logs" 
                    className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-mono"
                  >
                    Logs
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="controls" className="mt-4">
                  <TradingControls />
                </TabsContent>
                <TabsContent value="logs" className="mt-4">
                  <TradingLogs />
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>
        
        {/* Footer Credit */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-4 left-4 z-20"
        >
          <div className="text-cyan-400/60 text-sm font-mono hover:text-cyan-400 transition-colors">
            Made by VenTheZone
          </div>
        </motion.footer>
      </div>
    </div>
  );
}
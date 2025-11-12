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
import { Activity, DollarSign, TrendingUp, Settings, Loader2, LineChart, Network, X } from 'lucide-react';
import { toast } from 'sonner';
import { TradingLogs } from '@/components/TradingLogs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { BalanceChart } from '@/components/BalanceChart';
import { useTrading } from '@/hooks/use-trading';

export default function Dashboard() {
  const { isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [hasApiKeys, setHasApiKeys] = useState(false);
  const { mode, setMode, network, setNetwork, balance, position } = useTradingStore();
  const { closePosition, closeAllPositions } = useTrading();
  
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
                    <Settings className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[400px] bg-black/95 border-cyan-500/50 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="text-cyan-400 font-mono">Trading Controls</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
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
                  </div>
                </SheetContent>
              </Sheet>

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
          {/* Stats Row - Compact */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-3"
          >
            <Card className="bg-black/80 border-cyan-500/50 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-mono text-cyan-400 mb-1">Balance</p>
                    <div className="text-xl font-bold text-cyan-100 font-mono">
                      ${balance.toLocaleString()}
                    </div>
                  </div>
                  <DollarSign className="h-5 w-5 text-cyan-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-black/80 border-cyan-500/50 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-mono text-cyan-400 mb-1">P&L</p>
                    <div className={`text-xl font-bold font-mono ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ({pnl >= 0 ? '+' : ''}{pnlPercent}%)
                    </div>
                  </div>
                  <TrendingUp className={`h-5 w-5 ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-black/80 border-cyan-500/50 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-mono text-cyan-400 mb-1">Status</p>
                    <div className="text-xl font-bold text-cyan-100 font-mono">
                      {position ? 'IN POSITION' : 'READY'}
                    </div>
                  </div>
                  <Activity className="h-5 w-5 text-cyan-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-black/80 border-cyan-500/50 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-mono text-cyan-400 mb-1">Actions</p>
                    <div className="flex gap-2">
                      {position && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClosePosition}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20 font-mono text-xs"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Close
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCloseAllPositions}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20 font-mono text-xs"
                          >
                            <X className="h-4 w-4 mr-1" />
                            All
                          </Button>
                        </>
                      )}
                      {!position && (
                        <span className="text-sm text-gray-500 font-mono">No actions</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Charts and Logs Layout */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            {/* Charts - 2/3 width */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <TradingChart symbol="BTCUSD" chartId={1} />
              <TradingChart symbol="ETHUSD" chartId={2} />
              <TradingChart symbol="SOLUSD" chartId={3} />
              <TradingChart symbol="AVAXUSD" chartId={4} />
            </div>
            
            {/* Trading Logs - 1/3 width */}
            <div className="lg:col-span-1">
              <Card className="bg-black/80 border-cyan-500/50 shadow-[0_0_20px_rgba(0,255,255,0.2)] h-full">
                <CardHeader className="border-b border-cyan-500/30">
                  <CardTitle className="text-cyan-400 font-mono">Trading Logs</CardTitle>
                </CardHeader>
                <CardContent className="p-4 h-[calc(100%-4rem)] overflow-hidden">
                  <TradingLogs />
                </CardContent>
              </Card>
            </div>
          </motion.div>
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
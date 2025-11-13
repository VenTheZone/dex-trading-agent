import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TradingBackground } from '@/components/CyberpunkBackground';
import { ApiKeySetup } from '@/components/ApiKeySetup';
import { TradingChart } from '@/components/TradingChart';
import { TradingControls } from '@/components/TradingControls';
import { LogoDropdown } from '@/components/LogoDropdown';
import { storage } from '@/lib/storage';
import { useTradingStore } from '@/store/tradingStore';
import { Activity, DollarSign, TrendingUp, Settings, LineChart, Network, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TradingLogs } from '@/components/TradingLogs';
import { NewsFeed } from '@/components/NewsFeed';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { BalanceChart } from '@/components/BalanceChart';
import { useTrading } from '@/hooks/use-trading';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { CloseAllPositionsDialog } from '@/components/CloseAllPositionsDialog';
import { UpdateNotification } from '@/components/UpdateNotification';
import { pythonApi } from '@/lib/python-api-client';
import { AiThoughtsPanel } from '@/components/AiThoughtsPanel';

export default function Dashboard() {
  const navigate = useNavigate();
  const [hasApiKeys, setHasApiKeys] = useState(false);
  const [showCloseAllDialog, setShowCloseAllDialog] = useState(false);
  const { mode, setMode, network, setNetwork, balance, position, initialBalance, resetBalance, settings, setBalance, isAiThinking } = useTradingStore();
  const { closePosition, closeAllPositions } = useTrading();
  
  useEffect(() => {
    const keys = storage.getApiKeys();
    setHasApiKeys(!!keys);
  }, []);

  // Fetch perpetual wallet balance when network changes or component mounts
  useEffect(() => {
    const fetchBalance = async () => {
      const keys = storage.getApiKeys();
      if (!keys?.hyperliquid.apiKey) return;

      try {
        const result = await pythonApi.getAccountInfo({
          walletAddress: keys.hyperliquid.apiKey,
          isTestnet: network === 'testnet',
        });

        if (result.success && result.data) {
          setBalance(result.data.perpetualBalance);
          toast.success(`💰 Balance loaded: ${result.data.perpetualBalance.toLocaleString()}`, {
            description: `${network === 'testnet' ? 'Testnet' : 'Mainnet'} - Withdrawable: ${result.data.withdrawable.toLocaleString()}`,
            duration: 3000,
          });
        } else {
          toast.error(`Failed to fetch balance: ${result.error}`, {
            description: `Network: ${network}`,
          });
        }
      } catch (error: any) {
        console.error("Balance fetch error:", error);
        toast.error(`Balance fetch failed: ${error.message}`);
      }
    };

    if (hasApiKeys && mode === 'live') {
      fetchBalance();
    }
  }, [network, hasApiKeys, setBalance, mode]);
  
  // Calculate P&L
  const pnl = position?.pnl || 0;
  const pnlPercent = position ? ((pnl / (position.entryPrice * position.size)) * 100).toFixed(2) : '0.00';
  
  const handleModeToggle = () => {
    const newMode = mode === 'paper' ? 'live' : 'paper';
    if (newMode === 'live') {
      const confirmed = window.confirm(
        '⚠️ WARNING: You are about to switch to LIVE TRADING mode.\\n\\n' +
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
      `Switch to Hyperliquid ${newNetwork.toUpperCase()}?\\n\\n` +
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
    setShowCloseAllDialog(true);
  };

  const confirmCloseAllPositions = async () => {
    setShowCloseAllDialog(false);
    try {
      await closeAllPositions();
    } catch (error) {
      console.error("Failed to close all positions:", error);
    }
  };
  
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
        {/* Update Notification */}
        <UpdateNotification />
        
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="border-b border-cyan-500/30 bg-black/80 backdrop-blur-sm"
        >
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <LogoDropdown />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h1 
                    className="text-3xl font-bold text-cyan-400"
                    style={{ 
                      fontFamily: 'monospace',
                      textShadow: '0 0 20px rgba(0,255,255,0.8), 2px 2px 0 #ff0080'
                    }}
                  >
                    DeX TRADING AGENT
                  </h1>
                  {isAiThinking && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 bg-green-500/20 border border-green-500/50 px-3 py-1 rounded-full"
                    >
                      <Loader2 className="h-4 w-4 animate-spin text-green-400" />
                      <span className="text-xs text-green-400 font-bold font-mono">AI THINKING</span>
                    </motion.div>
                  )}
                </div>
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink 
                        onClick={() => navigate('/')}
                        className="text-cyan-400/70 hover:text-cyan-400 cursor-pointer font-mono text-sm"
                      >
                        Home
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="text-cyan-500/50" />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="text-cyan-400 font-mono text-sm font-bold">
                        Dashboard
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
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
                  const confirmed = window.confirm(
                    '⚠️ Clear all API keys and settings?\\n\\n' +
                    'This will remove all stored API keys and reset your configuration.\\n\\n' +
                    'Are you sure you want to continue?'
                  );
                  if (confirmed) {
                    storage.clearAll();
                    setHasApiKeys(false);
                    toast.success('API keys cleared');
                  }
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
                  <div className="flex-1">
                    <p className="text-xs font-mono text-cyan-400 mb-1">Balance</p>
                    <div className="text-xl font-bold text-cyan-100 font-mono">
                      ${balance.toLocaleString()}
                    </div>
                    {mode === 'demo' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          resetBalance();
                          toast.success(`Balance reset to $${initialBalance.toLocaleString()}`);
                        }}
                        className="text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 font-mono mt-1 h-6 px-2"
                      >
                        Reset
                      </Button>
                    )}
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
            {/* Charts - 2/3 width - Dynamically render based on allowed coins */}
            <div className={`lg:col-span-2 grid gap-4 ${
              settings.allowedCoins && settings.allowedCoins.length === 1 
                ? 'grid-cols-1' 
                : settings.allowedCoins && settings.allowedCoins.length === 2
                ? 'grid-cols-1 md:grid-cols-2'
                : settings.allowedCoins && settings.allowedCoins.length === 3
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1 md:grid-cols-2'
            }`}>
              {settings.allowedCoins && settings.allowedCoins.length > 0 ? (
                settings.allowedCoins.map((symbol, index) => (
                  <TradingChart key={`${symbol}-${index}`} symbol={symbol} chartId={index + 1} />
                ))
              ) : (
                <div className="col-span-full flex items-center justify-center p-8">
                  <p className="text-cyan-400 font-mono text-center">
                    No coins selected. Please select coins in Trading Controls to display charts.
                  </p>
                </div>
              )}
            </div>
            
            {/* Logs, News, and AI Thoughts - 1/3 width */}
            <div className="lg:col-span-1">
              <Tabs defaultValue="logs" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-black/50">
                  <TabsTrigger 
                    value="logs" 
                    className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-mono text-xs"
                  >
                    📊 Logs
                  </TabsTrigger>
                  <TabsTrigger 
                    value="news" 
                    className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-mono text-xs"
                  >
                    📰 News
                  </TabsTrigger>
                  <TabsTrigger 
                    value="ai" 
                    className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-mono text-xs"
                  >
                    🧠 AI
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="logs" className="mt-4">
                  <TradingLogs />
                </TabsContent>
                <TabsContent value="news" className="mt-4">
                  <NewsFeed />
                </TabsContent>
                <TabsContent value="ai" className="mt-4">
                  <AiThoughtsPanel />
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </div>
        
        {/* Floating Trading Controls Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="fixed top-20 right-6 z-30"
        >
          <Sheet modal={false}>
            <SheetTrigger asChild>
              <Button
                size="lg"
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold font-mono shadow-[0_0_30px_rgba(0,255,255,0.6)] hover:shadow-[0_0_40px_rgba(0,255,255,0.8)] transition-all"
              >
                <Settings className="h-5 w-5 mr-2" />
                Trading Controls
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[450px] bg-black/98 border-cyan-500/50 overflow-y-auto backdrop-blur-sm">
              <SheetHeader>
                <SheetTitle className="text-cyan-400 font-mono">Trading Controls</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <TradingControls />
              </div>
            </SheetContent>
          </Sheet>
        </motion.div>
        
        <CloseAllPositionsDialog
          isOpen={showCloseAllDialog}
          onClose={() => setShowCloseAllDialog(false)}
          onConfirm={confirmCloseAllPositions}
          positionCount={position ? 1 : 0}
          mode={mode}
        />
      </div>
    </div>
  );
}
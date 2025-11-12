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
import { Activity, DollarSign, TrendingUp, Settings, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TradingLogs } from '@/components/TradingLogs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Dashboard() {
  const { isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [hasApiKeys, setHasApiKeys] = useState(false);
  const { mode, setMode, balance } = useTradingStore();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isLoading, isAuthenticated, navigate]);
  
  useEffect(() => {
    const keys = storage.getApiKeys();
    setHasApiKeys(!!keys);
  }, []);
  
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
              </CardContent>
            </Card>
            
            <Card className="bg-black/80 border-cyan-500/50 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-mono text-cyan-400">P&L</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400 font-mono">
                  +$0.00
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-black/80 border-cyan-500/50 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-mono text-cyan-400">Status</CardTitle>
                <Activity className="h-4 w-4 text-cyan-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-100 font-mono">
                  READY
                </div>
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
      </div>
    </div>
  );
}
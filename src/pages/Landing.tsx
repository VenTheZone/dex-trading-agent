import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { TradingBackground } from "@/components/CyberpunkBackground";
import { Activity, Brain, Shield, TrendingUp, Zap, Eye } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TokenTradingModal } from "@/components/TokenTradingModal";
import { TRADING_TOKENS, TokenData } from "@/lib/tokenData";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { handleError, ERROR_MESSAGES } from "@/lib/error-handler";
import { UpdateNotification } from "@/components/UpdateNotification";
import { useLiveMarketData } from "@/hooks/use-live-market-data";
import { Skeleton } from "@/components/ui/skeleton";

export default function Landing() {
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const { marketData, isInitialLoad } = useLiveMarketData();

  const handleTokenClick = (token: TokenData) => {
    try {
      setSelectedToken(token);
      setShowTokenModal(true);
    } catch (error) {
      handleError(error, ERROR_MESSAGES.MODAL_OPEN);
    }
  };

  const handleNavigateToDashboard = () => {
    try {
      navigate('/dashboard');
    } catch (error) {
      handleError(error, ERROR_MESSAGES.NAVIGATION);
    }
  };

  const handleShowPreview = () => {
    try {
      setShowPreview(true);
    } catch (error) {
      handleError(error, ERROR_MESSAGES.PREVIEW_OPEN);
    }
  };

  const handleCloseTokenModal = () => {
    try {
      setShowTokenModal(false);
    } catch (error) {
      handleError(error, ERROR_MESSAGES.MODAL_CLOSE);
    }
  };

  return (
    <div className="min-h-screen bg-black text-cyan-100">
      <TradingBackground />
      <UpdateNotification />
      
      <div className="relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="min-h-screen flex flex-col items-center justify-center px-4"
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-center space-y-8 max-w-4xl"
          >
            {/* Logo */}
            <motion.img
              src="/logo.png"
              alt="DeX Agent"
              width={120}
              height={120}
              className="mx-auto rounded-lg"
              style={{
                filter: 'drop-shadow(0 0 30px rgba(0,255,255,0.8))',
              }}
              animate={{
                filter: [
                  'drop-shadow(0 0 30px rgba(0,255,255,0.8))',
                  'drop-shadow(0 0 50px rgba(255,0,128,0.8))',
                  'drop-shadow(0 0 30px rgba(0,255,255,0.8))',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            
            {/* Title */}
            <h1 
              className="text-6xl md:text-8xl font-bold text-cyan-400"
              style={{
                fontFamily: 'monospace',
                textShadow: '0 0 30px rgba(0,255,255,1), 4px 4px 0 #ff0080, -2px -2px 0 #00ff00',
              }}
            >
              DeX TRADING AGENT
            </h1>
            
            <p className="text-xl md:text-2xl text-cyan-300 font-mono">
              AI-Powered Trading System
            </p>
            
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Advanced chart analysis • Hyperliquid integration • AI-driven decisions • Risk-controlled execution
            </p>
            
            {/* CTA Buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
            >
              <Button
                size="lg"
                onClick={handleNavigateToDashboard}
                className="text-xl px-8 py-6 bg-cyan-500 hover:bg-cyan-600 text-black font-bold font-mono shadow-[0_0_30px_rgba(0,255,255,0.8)] border-2 border-cyan-400"
              >
                <Zap className="mr-2 h-6 w-6" />
                ENTER DASHBOARD
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={handleShowPreview}
                className="text-xl px-8 py-6 border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/20 font-bold font-mono shadow-[0_0_20px_rgba(0,255,255,0.4)]"
              >
                <Eye className="mr-2 h-6 w-6" />
                PREVIEW DASHBOARD
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/docs')}
                className="text-xl px-8 py-6 border-2 border-purple-500 text-purple-400 hover:bg-purple-500/20 font-bold font-mono shadow-[0_0_20px_rgba(168,85,247,0.4)]"
              >
                📚 DOCUMENTATION
              </Button>
            </motion.div>
          </motion.div>
          
          {/* Features Grid */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24 max-w-6xl"
          >
            {[
              { icon: Brain, title: 'AI Analysis', desc: 'DeepSeek V3.1 powered decisions' },
              { icon: Activity, title: 'Multi-Chart', desc: '4 TradingView charts with range analysis' },
              { icon: Shield, title: 'Secure', desc: 'Browser-only API key storage' },
              { icon: TrendingUp, title: 'Risk Control', desc: 'Advanced TP/SL management' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9 + i * 0.1 }}
                className="bg-black/80 border border-cyan-500/50 rounded-lg p-6 text-center hover:border-cyan-500 transition-all hover:shadow-[0_0_30px_rgba(0,255,255,0.3)]"
              >
                <feature.icon className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-cyan-400 font-mono mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
          
          {/* Token List Section with Live Prices */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-24 max-w-6xl w-full"
          >
            <div className="flex items-center justify-center gap-3 mb-8">
              <h2 className="text-3xl font-bold text-cyan-400 font-mono text-center">
                🎯 Available Trading Pairs
              </h2>
              {!isInitialLoad && (
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500 font-mono animate-pulse">
                  🟢 LIVE
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TRADING_TOKENS.map((token, i) => {
                const symbolKey = `${token.symbol}USD`;
                const liveData = marketData[symbolKey];
                const isLoading = isInitialLoad || liveData?.isLoading;
                
                return (
                  <motion.div
                    key={token.symbol}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.3 + i * 0.05 }}
                  >
                    <Card
                      onClick={() => handleTokenClick(token)}
                      className="bg-black/80 border-cyan-500/50 p-6 cursor-pointer hover:border-cyan-500 transition-all hover:shadow-[0_0_30px_rgba(0,255,255,0.3)] hover:scale-105"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-cyan-400 font-mono mb-2">
                            {token.pair}
                          </h3>
                          <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500 font-mono">
                            {token.maxLeverage}x Leverage
                          </Badge>
                        </div>
                        <TrendingUp className="h-8 w-8 text-cyan-400" />
                      </div>
                      
                      {/* Live Price Display */}
                      <div className="mt-4 pt-4 border-t border-cyan-500/30">
                        {isLoading ? (
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-24 bg-cyan-500/20" />
                            <Skeleton className="h-6 w-32 bg-cyan-500/20" />
                          </div>
                        ) : liveData?.error ? (
                          <div className="text-xs text-red-400 font-mono">
                            Price unavailable
                          </div>
                        ) : liveData?.price ? (
                          <div>
                            <div className="text-xs text-gray-400 font-mono mb-1">
                              Live Price
                            </div>
                            <div className="text-lg font-bold text-cyan-100 font-mono">
                              ${liveData.price.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            <div className="text-xs text-gray-500 font-mono mt-1">
                              Updated {Math.floor((Date.now() - liveData.lastUpdated) / 1000)}s ago
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Risk Management Section */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-24 max-w-6xl w-full"
          >
            <h2 className="text-3xl font-bold text-cyan-400 font-mono text-center mb-8">
              🛡️ 8-Layer Risk Management Framework
            </h2>
            <p className="text-center text-gray-400 mb-8 max-w-3xl mx-auto">
              Advanced perpetual futures risk management designed to protect your capital and maximize profitability
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { 
                  icon: '🎯', 
                  title: 'Liquidation Protection', 
                  desc: 'Real-time monitoring with 15-20% safety buffers from liquidation price'
                },
                { 
                  icon: '⚖️', 
                  title: 'Position Sizing', 
                  desc: 'Dynamic sizing based on leverage, volatility, and AI confidence levels'
                },
                { 
                  icon: '💰', 
                  title: 'Funding Rate Management', 
                  desc: 'Tracks 8-hour funding costs and detects crowded positions'
                },
                { 
                  icon: '🎚️', 
                  title: 'Smart TP/SL', 
                  desc: 'Intelligent stop-loss placement with trailing stops and 1:2 risk/reward minimum'
                },
                { 
                  icon: '📊', 
                  title: 'Market Structure', 
                  desc: 'Open interest monitoring and long/short ratio analysis'
                },
                { 
                  icon: '🤖', 
                  title: 'AI Risk Assessment', 
                  desc: 'Multi-factor scoring with confidence-based execution'
                },
                { 
                  icon: '🚨', 
                  title: 'Emergency Controls', 
                  desc: 'Auto-pause at 80% margin usage and manual override options'
                },
                { 
                  icon: '📡', 
                  title: 'Real-Time Monitoring', 
                  desc: 'Live P&L tracking with liquidation distance alerts'
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.6 + i * 0.05 }}
                >
                  <Card className="bg-gradient-to-br from-purple-900/20 to-black/80 border-purple-500/50 p-4 h-full hover:border-purple-500 transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                    <div className="text-3xl mb-3">{feature.icon}</div>
                    <h3 className="text-lg font-bold text-purple-400 font-mono mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-400">{feature.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 2.0 }}
              className="mt-6"
            >
              <Card className="bg-gradient-to-br from-cyan-900/20 to-black/80 border-cyan-500/50 p-6 shadow-[0_0_30px_rgba(0,255,255,0.2)]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-cyan-400 font-mono mb-2">
                      Risk Management Philosophy
                    </h3>
                    <p className="text-gray-400 text-sm">
                      The Trading Agent prioritizes <strong className="text-cyan-300">capital preservation over aggressive gains</strong>. 
                      It's designed to survive market volatility and avoid catastrophic losses through disciplined risk management, 
                      proper position sizing, and AI-driven decision making that accounts for the unique risks of leveraged perpetual futures trading.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>

          {/* Getting Started Guide */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 2.2 }}
            className="mt-24 max-w-6xl w-full pb-16"
          >
            <h2 className="text-3xl font-bold text-cyan-400 font-mono text-center mb-8">
              🚀 Getting Started Guide
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Live Trading Setup */}
              <Card className="bg-gradient-to-br from-purple-900/20 to-black/80 border-purple-500/50 p-6 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🟣</span>
                  </div>
                  <h3 className="text-2xl font-bold text-purple-400 font-mono">
                    Live Trading (Mainnet)
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-purple-400 font-mono font-bold">1</span>
                    </div>
                    <div>
                      <p className="text-cyan-100 font-mono mb-2">
                        <strong className="text-purple-400">Deposit USDC</strong>
                      </p>
                      <p className="text-gray-400 text-sm">
                        Visit <a href="https://app.hyperliquid.xyz/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">app.hyperliquid.xyz</a> and deposit USDC into your perpetual wallet to start trading with real funds.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-purple-400 font-mono font-bold">2</span>
                    </div>
                    <div>
                      <p className="text-cyan-100 font-mono mb-2">
                        <strong className="text-purple-400">Configure API Keys</strong>
                      </p>
                      <p className="text-gray-400 text-sm">
                        In the Dashboard, go to Settings and add your Hyperliquid API secret and wallet address. Keys are stored securely in your browser only.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-purple-400 font-mono font-bold">3</span>
                    </div>
                    <div>
                      <p className="text-cyan-100 font-mono mb-2">
                        <strong className="text-purple-400">Start Trading</strong>
                      </p>
                      <p className="text-gray-400 text-sm">
                        Select "Live" mode, choose your coins, configure leverage and risk settings, then enable AI auto-trading or trade manually.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded">
                  <p className="text-xs text-purple-300 font-mono">
                    ⚠️ <strong>Real Funds:</strong> Live trading uses real USDC. Start with small amounts and test thoroughly.
                  </p>
                </div>
              </Card>

              {/* Testnet Setup */}
              <Card className="bg-gradient-to-br from-blue-900/20 to-black/80 border-blue-500/50 p-6 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🔵</span>
                  </div>
                  <h3 className="text-2xl font-bold text-blue-400 font-mono">
                    Test Trading (Testnet)
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-blue-400 font-mono font-bold">1</span>
                    </div>
                    <div>
                      <p className="text-cyan-100 font-mono mb-2">
                        <strong className="text-blue-400">Get Test Funds</strong>
                      </p>
                      <p className="text-gray-400 text-sm">
                        Visit <a href="https://app.hyperliquid-testnet.xyz/drip" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">app.hyperliquid-testnet.xyz/drip</a> to receive free testnet USDC for practice trading.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-blue-400 font-mono font-bold">2</span>
                    </div>
                    <div>
                      <p className="text-cyan-100 font-mono mb-2">
                        <strong className="text-blue-400">Switch to Testnet</strong>
                      </p>
                      <p className="text-gray-400 text-sm">
                        In the Dashboard header, click the network badge to toggle between Mainnet and Testnet. Your balance will update automatically.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-blue-400 font-mono font-bold">3</span>
                    </div>
                    <div>
                      <p className="text-cyan-100 font-mono mb-2">
                        <strong className="text-blue-400">Practice Risk-Free</strong>
                      </p>
                      <p className="text-gray-400 text-sm">
                        Test AI strategies, leverage settings, and risk management with zero risk. Perfect for learning before going live.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded">
                  <p className="text-xs text-blue-300 font-mono">
                    ✅ <strong>Safe Testing:</strong> Testnet uses fake funds. Experiment freely without financial risk.
                  </p>
                </div>
              </Card>
            </div>

            {/* Paper Trading Note */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.7 }}
              className="mt-6"
            >
              <Card className="bg-gradient-to-br from-cyan-900/20 to-black/80 border-cyan-500/50 p-6 shadow-[0_0_30px_rgba(0,255,255,0.2)]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📄</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-cyan-400 font-mono mb-2">
                      Paper Trading Mode
                    </h3>
                    <p className="text-gray-400 text-sm mb-3">
                      No setup required! Paper trading simulates trades locally in your browser with a virtual $10,000 balance. Perfect for testing strategies without any external accounts.
                    </p>
                    <p className="text-xs text-cyan-300 font-mono">
                      💡 <strong>Tip:</strong> Start with Paper mode to learn the interface, then move to Testnet for realistic execution, and finally go Live when ready.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </motion.div>
        
        {/* Preview Modal */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] bg-black/95 border-cyan-500/50 p-0 overflow-hidden">
            <DialogHeader className="p-6 border-b border-cyan-500/30">
              <DialogTitle className="text-cyan-400 font-mono text-2xl flex items-center gap-2">
                <Eye className="h-6 w-6" />
                Dashboard Preview
              </DialogTitle>
            </DialogHeader>
            
            <div className="relative w-full h-[80vh] overflow-auto custom-scrollbar">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="p-6"
              >
                {/* Preview Content - Simulated Dashboard */}
                <div className="space-y-6">
                  {/* Header Preview */}
                  <div className="border border-cyan-500/30 bg-black/80 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-cyan-500/20 rounded-lg" />
                        <h1 className="text-2xl font-bold text-cyan-400 font-mono">
                          DeX TRADING AGENT
                        </h1>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500 rounded font-mono">
                          🟣 MAINNET
                        </div>
                        <div className="px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500 rounded font-mono">
                          📄 PAPER TRADING
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Balance', value: '$10,000', icon: '💰' },
                      { label: 'P&L', value: '+$250.00', color: 'text-green-400', icon: '📈' },
                      { label: 'Status', value: 'READY', icon: '⚡' }
                    ].map((stat, i) => (
                      <div key={i} className="bg-black/80 border border-cyan-500/50 rounded-lg p-4 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
                        <div className="text-sm font-mono text-cyan-400 mb-2">{stat.icon} {stat.label}</div>
                        <div className={`text-2xl font-bold font-mono ${stat.color || 'text-cyan-100'}`}>
                          {stat.value}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Charts Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['BTC/USD', 'ETH/USD', 'SOL/USD', 'AVAX/USD'].map((symbol, i) => (
                      <div key={i} className="bg-black/80 border border-cyan-500/30 rounded-lg p-4 h-64 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20" style={{
                          backgroundImage: `linear-gradient(#00ffff 1px, transparent 1px), linear-gradient(90deg, #00ffff 1px, transparent 1px)`,
                          backgroundSize: '20px 20px'
                        }} />
                        <div className="relative z-10 text-center">
                          <div className="text-cyan-400 font-mono font-bold text-xl mb-2">{symbol}</div>
                          <div className="text-gray-500 font-mono text-sm">TradingView Chart</div>
                          <div className="mt-4 text-cyan-100 font-mono">📊</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Controls Preview */}
                  <div className="bg-gradient-to-br from-black/90 to-black/80 border border-cyan-500/50 rounded-lg p-6 shadow-[0_0_30px_rgba(0,255,255,0.2)]">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-cyan-400 font-mono font-bold flex items-center gap-2">
                        ✨ Trading Controls
                      </h3>
                      <div className="px-4 py-2 bg-green-500 text-black font-bold font-mono rounded shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                        🤖 AI ON
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="text-cyan-400 font-mono text-sm mb-2">Allowed Coins (3/5 selected)</div>
                        <div className="flex gap-2 flex-wrap">
                          {['BTC', 'ETH', 'SOL'].map((coin) => (
                            <div key={coin} className="px-3 py-1 bg-cyan-500 text-black font-mono text-sm rounded shadow-[0_0_15px_rgba(0,255,255,0.4)]">
                              {coin}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-cyan-400 font-mono text-sm mb-2">Leverage: 5x</div>
                        <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-cyan-500/30">
                          <div className="h-full w-1/2 bg-cyan-500" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-cyan-400 font-mono text-sm mb-2">Take Profit (%)</div>
                          <div className="bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-cyan-100 font-mono">
                            5.0
                          </div>
                        </div>
                        <div>
                          <div className="text-cyan-400 font-mono text-sm mb-2">Stop Loss (%)</div>
                          <div className="bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-cyan-100 font-mono">
                            2.0
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center py-8">
                    <p className="text-cyan-400 font-mono mb-4">
                      This is a preview of the trading dashboard interface
                    </p>
                    <Button
                      size="lg"
                      onClick={() => {
                        setShowPreview(false);
                        handleNavigateToDashboard();
                      }}
                      className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold font-mono shadow-[0_0_20px_rgba(0,255,255,0.4)]"
                    >
                      <Zap className="mr-2 h-5 w-5" />
                      Go to Dashboard
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Token Trading Modal */}
        <TokenTradingModal
          token={selectedToken}
          isOpen={showTokenModal}
          onClose={handleCloseTokenModal}
        />
      </div>
    </div>
  );
}
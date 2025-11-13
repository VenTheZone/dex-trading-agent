import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { TradingBackground } from "@/components/CyberpunkBackground";
import { Activity, Brain, Shield, TrendingUp, Zap, Eye } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Landing() {
  const { isAuthenticated, signIn, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);

  // Auto sign-in as guest on mount - only if not already authenticated
  useEffect(() => {
    console.log('[Landing] Auth check:', { isLoading, isAuthenticated });
    
    // Only attempt sign-in if auth is fully loaded and user is not authenticated
    if (!isLoading && !isAuthenticated) {
      console.log('[Landing] Attempting guest sign-in...');
      signIn("anonymous")
        .then(() => {
          console.log('[Landing] Guest sign-in successful');
        })
        .catch((error) => {
          console.error('[Landing] Guest sign-in failed:', error);
        });
    }
  }, [isLoading, isAuthenticated, signIn]);

  return (
    <div className="min-h-screen bg-black text-cyan-100">
      <TradingBackground />
      
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
              src="https://harmless-tapir-303.convex.cloud/api/storage/b7ba95ac-6c56-4e04-96fe-ae867834e202"
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
                onClick={() => navigate('/dashboard')}
                className="text-xl px-8 py-6 bg-cyan-500 hover:bg-cyan-600 text-black font-bold font-mono shadow-[0_0_30px_rgba(0,255,255,0.8)] border-2 border-cyan-400"
              >
                <Zap className="mr-2 h-6 w-6" />
                ENTER DASHBOARD
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowPreview(true)}
                className="text-xl px-8 py-6 border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/20 font-bold font-mono shadow-[0_0_20px_rgba(0,255,255,0.4)]"
              >
                <Eye className="mr-2 h-6 w-6" />
                PREVIEW DASHBOARD
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
                        navigate('/dashboard');
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
      </div>
    </div>
  );
}
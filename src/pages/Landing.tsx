import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import { TradingBackground } from "@/components/CyberpunkBackground";
import { Activity, Brain, Shield, TrendingUp, Zap } from "lucide-react";

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

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
              src="./logo.svg"
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
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/auth')}
                className="text-xl px-8 py-6 bg-cyan-500 hover:bg-cyan-600 text-black font-bold font-mono shadow-[0_0_30px_rgba(0,255,255,0.8)] border-2 border-cyan-400"
              >
                <Zap className="mr-2 h-6 w-6" />
                {isAuthenticated ? 'ENTER DASHBOARD' : 'GET STARTED'}
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
      </div>
    </div>
  );
}
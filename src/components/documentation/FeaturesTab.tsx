import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cpu, Activity, Shield, Server, CheckCircle, ArrowRight } from "lucide-react";

interface FeaturesTabProps {
  onNavigate: (tab: string) => void;
}

export function FeaturesTab({ onNavigate }: FeaturesTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[
        {
          icon: Cpu,
          title: "AI-Powered Analysis",
          description: "DeepSeek V3.1 (Free) or Qwen3 Max (Paid) via OpenRouter",
          features: [
            "Multi-chart correlation analysis",
            "Technical indicator synthesis",
            "Market sentiment evaluation",
            "Confidence-based execution"
          ]
        },
        {
          icon: Activity,
          title: "Perpetual Futures Trading",
          description: "Advanced derivatives trading on Hyperliquid",
          features: [
            "Up to 40x leverage (BTC)",
            "Funding rate optimization",
            "Liquidation risk monitoring",
            "Mark price tracking"
          ]
        },
        {
          icon: Shield,
          title: "Risk Management",
          description: "8-layer protection framework",
          features: [
            "Liquidation buffers",
            "Dynamic position sizing",
            "Smart TP/SL placement",
            "Emergency controls"
          ]
        },
        {
          icon: Server,
          title: "Real-Time Monitoring",
          description: "Live tracking and alerts",
          features: [
            "P&L tracking",
            "Liquidation distance alerts",
            "Funding rate notifications",
            "Position snapshots"
          ]
        }
      ].map((feature, i) => {
        const Icon = feature.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-black/90 border-cyan-500/50 h-full hover:border-cyan-500 transition-all hover:shadow-[0_0_30px_rgba(0,255,255,0.3)]">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="h-8 w-8 text-cyan-400" />
                  <CardTitle className="text-xl text-cyan-400 font-mono">
                    {feature.title}
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-400">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feature.features.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
      </div>

      <div className="flex justify-center gap-4 pt-6">
        <Button 
          variant="outline" 
          onClick={() => onNavigate("risk")}
          className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 font-mono"
        >
          Explore Risk Management <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          onClick={() => onNavigate("modes")}
          className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 font-mono"
        >
          View Trading Modes <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";

interface TradingModesTabProps {
  onNavigate: (tab: string) => void;
}

export function TradingModesTab({ onNavigate }: TradingModesTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        {
          mode: "Live Trading",
          icon: "🟣",
          color: "purple",
          description: "Real funds on Hyperliquid Mainnet/Testnet",
          features: [
            "Real USDC trading",
            "Actual market execution",
            "Real funding rates",
            "True liquidation risk"
          ],
          warning: "Uses real funds - start small!"
        },
        {
          mode: "Paper Trading",
          icon: "📄",
          color: "cyan",
          description: "Simulated trading with realistic execution",
          features: [
            "Virtual $10,000 balance",
            "Realistic price simulation",
            "Funding rate simulation",
            "No financial risk"
          ],
          warning: "Perfect for testing strategies"
        },
        {
          mode: "Demo Mode",
          icon: "🎮",
          color: "green",
          description: "Practice environment for learning",
          features: [
            "No setup required",
            "Instant start",
            "Full feature access",
            "Risk-free learning"
          ],
          warning: "Best for beginners"
        }
      ].map((mode, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className={`bg-black/90 border-${mode.color}-500/50 h-full hover:border-${mode.color}-500 transition-all hover:shadow-[0_0_30px_rgba(0,255,255,0.3)]`}>
            <CardHeader>
              <div className="text-4xl mb-2">{mode.icon}</div>
              <CardTitle className={`text-xl text-${mode.color}-400 font-mono`}>
                {mode.mode}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {mode.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {mode.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className={`h-4 w-4 text-${mode.color}-400 mt-0.5 flex-shrink-0`} />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className={`p-3 bg-${mode.color}-500/10 border border-${mode.color}-500/30 rounded text-xs text-${mode.color}-300 font-mono`}>
                💡 {mode.warning}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
      </div>

      <div className="flex justify-center pt-6">
        <Button 
          variant="outline" 
          onClick={() => onNavigate("workflow")}
          className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 font-mono"
        >
          View Trading Workflow <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
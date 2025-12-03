import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight } from "lucide-react";

interface RiskManagementTabProps {
  onNavigate: (tab: string) => void;
}

export function RiskManagementTab({ onNavigate }: RiskManagementTabProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-black/90 border-purple-500/50">
        <CardHeader>
          <CardTitle className="text-2xl text-purple-400 font-mono flex items-center gap-2">
            <Shield className="h-6 w-6" />
            8-Layer Risk Management Framework
          </CardTitle>
          <CardDescription className="text-gray-400">
            Comprehensive protection for perpetual futures trading
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              layer: 1,
              title: "Liquidation Protection",
              description: "Real-time monitoring with 15-20% safety buffers from liquidation price",
              icon: "🎯"
            },
            {
              layer: 2,
              title: "Position Sizing",
              description: "Dynamic sizing based on leverage, volatility, and AI confidence levels",
              icon: "⚖️"
            },
            {
              layer: 3,
              title: "Funding Rate Management",
              description: "Tracks 8-hour funding costs and detects crowded positions",
              icon: "💰"
            },
            {
              layer: 4,
              title: "Smart TP/SL",
              description: "Intelligent stop-loss placement with trailing stops and 1:2 risk/reward minimum",
              icon: "🎚️"
            },
            {
              layer: 5,
              title: "Market Structure",
              description: "Open interest monitoring and long/short ratio analysis",
              icon: "📊"
            },
            {
              layer: 6,
              title: "AI Risk Assessment",
              description: "Multi-factor scoring with confidence-based execution",
              icon: "🤖"
            },
            {
              layer: 7,
              title: "Emergency Controls",
              description: "Auto-pause at 80% margin usage and manual override options",
              icon: "🚨"
            },
            {
              layer: 8,
              title: "Real-Time Monitoring",
              description: "Live P&L tracking with liquidation distance alerts",
              icon: "📡"
            }
          ].map((layer, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-900/20 to-black/80 border border-purple-500/30 rounded-lg hover:border-purple-500/50 transition-all"
            >
              <div className="text-3xl">{layer.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-purple-400 border-purple-500">
                    Layer {layer.layer}
                  </Badge>
                  <h3 className="text-lg font-bold text-purple-400 font-mono">
                    {layer.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-400">{layer.description}</p>
              </div>
            </motion.div>
          ))}

          <div className="mt-8 pt-6 border-t border-purple-900/30 flex justify-end">
            <Button 
              variant="ghost" 
              onClick={() => onNavigate("workflow")}
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 font-mono"
            >
              See Risk Check in Workflow <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
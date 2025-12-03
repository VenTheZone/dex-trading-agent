import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Terminal, 
  Database, 
  Cpu, 
  Shield, 
  GitBranch, 
  FileText, 
  Activity, 
  Server,
  ArrowRight
} from "lucide-react";

interface WorkflowTabProps {
  onNavigate: (tab: string) => void;
}

export function WorkflowTab({ onNavigate }: WorkflowTabProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const workflowNodes = [
    {
      id: "start",
      title: "User Initiates Trading",
      description: "User enables AI auto-trading or manually triggers analysis",
      icon: Terminal,
      color: "cyan",
      x: 50,
      y: 10,
      connections: ["fetch-data"]
    },
    {
      id: "fetch-data",
      title: "Fetch Market Data",
      description: "Retrieve real-time prices, charts, funding rates, and open interest",
      icon: Database,
      color: "blue",
      x: 50,
      y: 25,
      connections: ["ai-analysis"]
    },
    {
      id: "ai-analysis",
      title: "AI Analysis",
      description: "DeepSeek/Qwen3 analyzes 4 charts with technical indicators and market context",
      icon: Cpu,
      color: "purple",
      x: 50,
      y: 40,
      connections: ["risk-check"]
    },
    {
      id: "risk-check",
      title: "Risk Assessment",
      description: "8-layer risk management validates trade safety and position sizing",
      icon: Shield,
      color: "orange",
      x: 50,
      y: 55,
      connections: ["decision"]
    },
    {
      id: "decision",
      title: "Trading Decision",
      description: "AI recommends: OPEN_LONG, OPEN_SHORT, CLOSE, or HOLD",
      icon: GitBranch,
      color: "yellow",
      x: 50,
      y: 70,
      connections: ["execute-hold", "execute-trade"]
    },
    {
      id: "execute-hold",
      title: "Hold Position",
      description: "No action taken - continue monitoring",
      icon: FileText,
      color: "gray",
      x: 25,
      y: 85,
      connections: []
    },
    {
      id: "execute-trade",
      title: "Execute Trade",
      description: "Place order on Hyperliquid (Live) or simulate (Paper/Demo)",
      icon: Activity,
      color: "green",
      x: 75,
      y: 85,
      connections: ["monitor"]
    },
    {
      id: "monitor",
      title: "Monitor Position",
      description: "Track P&L, liquidation distance, funding rates, and TP/SL triggers",
      icon: Server,
      color: "cyan",
      x: 75,
      y: 100,
      connections: []
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-black/90 border-cyan-500/50">
        <CardHeader>
          <CardTitle className="text-2xl text-cyan-400 font-mono flex items-center gap-2">
            <GitBranch className="h-6 w-6" />
            Interactive Trading Workflow
          </CardTitle>
          <CardDescription className="text-gray-400">
            Click on any node to see detailed information about that step
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Workflow Visualization */}
          <div className="relative w-full h-[600px] bg-black/50 border border-cyan-500/30 rounded-lg overflow-hidden">
            <svg className="absolute inset-0 w-full h-full">
              {/* Draw connections */}
              {workflowNodes.map((node) =>
                node.connections.map((targetId) => {
                  const target = workflowNodes.find((n) => n.id === targetId);
                  if (!target) return null;
                  return (
                    <line
                      key={`${node.id}-${targetId}`}
                      x1={`${node.x}%`}
                      y1={`${node.y}%`}
                      x2={`${target.x}%`}
                      y2={`${target.y}%`}
                      stroke="rgba(0, 255, 255, 0.3)"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  );
                })
              )}
            </svg>

            {/* Workflow Nodes */}
            {workflowNodes.map((node, index) => {
              const Icon = node.icon;
              const isSelected = selectedNode === node.id;
              
              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="absolute"
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedNode(node.id)}
                    className={`
                      cursor-pointer p-4 rounded-lg border-2 bg-black/90
                      transition-all duration-300 w-48
                      ${isSelected 
                        ? `border-${node.color}-500 shadow-[0_0_30px_rgba(0,255,255,0.6)]` 
                        : `border-${node.color}-500/50 hover:border-${node.color}-500`
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`h-5 w-5 text-${node.color}-400`} />
                      <Badge variant="outline" className={`text-${node.color}-400 border-${node.color}-500`}>
                        {index + 1}
                      </Badge>
                    </div>
                    <h3 className={`text-sm font-bold text-${node.color}-400 font-mono mb-1`}>
                      {node.title}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {node.description}
                    </p>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

          {/* Selected Node Details */}
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <Card className="bg-gradient-to-br from-cyan-900/20 to-black/80 border-cyan-500/50">
                <CardHeader>
                  <CardTitle className="text-cyan-400 font-mono">
                    {workflowNodes.find(n => n.id === selectedNode)?.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-gray-300 space-y-2">
                  <p>{workflowNodes.find(n => n.id === selectedNode)?.description}</p>
                  
                  {selectedNode === "ai-analysis" && (
                    <div className="mt-4 space-y-2">
                      <p className="text-cyan-400 font-mono font-bold">AI Analysis Includes:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Technical indicators (RSI, MACD, Moving Averages)</li>
                        <li>Price action and trend analysis</li>
                        <li>Volume and liquidity assessment</li>
                        <li>Funding rate impact on profitability</li>
                        <li>Open interest and long/short ratios</li>
                        <li>Multi-chart correlation analysis</li>
                      </ul>
                      <Button 
                        variant="link" 
                        onClick={() => onNavigate("features")}
                        className="text-cyan-400 p-0 h-auto font-mono text-xs mt-2 hover:text-cyan-300"
                      >
                        View AI Features <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  
                  {selectedNode === "risk-check" && (
                    <div className="mt-4 space-y-2">
                      <p className="text-cyan-400 font-mono font-bold">8-Layer Risk Framework:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Liquidation protection (15-20% buffer)</li>
                        <li>Dynamic position sizing</li>
                        <li>Funding rate management</li>
                        <li>Smart TP/SL placement</li>
                        <li>Market structure analysis</li>
                        <li>AI confidence scoring</li>
                        <li>Emergency controls</li>
                        <li>Real-time monitoring</li>
                      </ul>
                      <Button 
                        variant="link" 
                        onClick={() => onNavigate("risk")}
                        className="text-cyan-400 p-0 h-auto font-mono text-xs mt-2 hover:text-cyan-300"
                      >
                        View Risk Protocols <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
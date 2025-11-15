import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router";
import { 
  ArrowLeft, 
  Brain, 
  TrendingUp, 
  Shield, 
  Zap, 
  Database,
  Activity,
  GitBranch,
  CheckCircle,
  Info
} from "lucide-react";
import { TradingBackground } from "@/components/CyberpunkBackground";
import { useState } from "react";

export default function Documentation() {
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const workflowNodes = [
    {
      id: "start",
      title: "User Initiates Trading",
      description: "User enables AI auto-trading or manually triggers analysis",
      icon: Zap,
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
      icon: Brain,
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
      icon: Info,
      color: "gray",
      x: 25,
      y: 85,
      connections: []
    },
    {
      id: "execute-trade",
      title: "Execute Trade",
      description: "Place order on Hyperliquid (Live) or simulate (Paper/Demo)",
      icon: TrendingUp,
      color: "green",
      x: 75,
      y: 85,
      connections: ["monitor"]
    },
    {
      id: "monitor",
      title: "Monitor Position",
      description: "Track P&L, liquidation distance, funding rates, and TP/SL triggers",
      icon: Activity,
      color: "cyan",
      x: 75,
      y: 100,
      connections: []
    }
  ];

  return (
    <div className="min-h-screen bg-black text-cyan-100">
      <TradingBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="mb-4 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          
          <div className="flex items-center gap-4 mb-4">
            <img src="/logo.png" alt="DeX Agent" className="w-16 h-16 rounded-lg" />
            <div>
              <h1 className="text-4xl font-bold text-cyan-400 font-mono">
                📚 DOCUMENTATION
              </h1>
              <p className="text-gray-400 font-mono">
                Complete guide to the DeX Trading Agent system
              </p>
            </div>
          </div>

          {/* Developer Inspiration Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <Card className="bg-gradient-to-br from-purple-900/20 to-black/80 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Brain className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-purple-400 font-mono mb-2">
                      💡 Project Inspiration
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      This project is inspired by{' '}
                      <a 
                        href="https://nof1.ai/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 underline font-semibold"
                      >
                        Nof1's Alpha Arena
                      </a>
                      . I saw how well DeepSeek and Qwen3 Max performed during the competition. But it's obvious people at Nof1 have never traded before in their life, so I decided to build my own version. As a seasonal futures trader, I wanted to create a system that actually understands risk management, liquidation protection, and the realities of leveraged perpetual futures trading.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tech Stack Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <Card className="bg-gradient-to-br from-cyan-900/20 to-black/80 border-cyan-500/50 shadow-[0_0_30px_rgba(0,255,255,0.2)]">
              <CardHeader>
                <CardTitle className="text-2xl text-cyan-400 font-mono flex items-center gap-2">
                  🛠️ Tech Stack
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-bold text-cyan-400 font-mono mb-3">Frontend</h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-cyan-400" />
                        React 19 + TypeScript + Vite
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-cyan-400" />
                        React Router v7 for routing
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-cyan-400" />
                        Tailwind CSS v4 + Shadcn UI
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-cyan-400" />
                        Framer Motion for animations
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-cyan-400" />
                        Zustand for state management
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-purple-400 font-mono mb-3">Backend</h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-purple-400" />
                        Python FastAPI (REST + WebSockets)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-purple-400" />
                        SQLite (local) / PostgreSQL (production)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-purple-400" />
                        SQLAlchemy ORM
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-purple-400" />
                        Celery + Redis for background tasks
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-green-400 font-mono mb-3">Integrations</h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        Hyperliquid SDK (@nktkas/hyperliquid)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        OpenRouter API (DeepSeek/Qwen3 Max)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        CryptoPanic News API (optional)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        Binance API (price data fallback)
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-orange-400 font-mono mb-3">Deployment</h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-orange-400" />
                        Docker + Docker Compose
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-orange-400" />
                        Local-only deployment (no cloud)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-orange-400" />
                        Frontend: Port 3000
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-orange-400" />
                        Backend: Port 8000
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <Tabs defaultValue="workflow" className="space-y-6">
          <TabsList className="bg-black/80 border border-cyan-500/50">
            <TabsTrigger value="workflow" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              🔄 Workflow
            </TabsTrigger>
            <TabsTrigger value="architecture" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              🏗️ Architecture
            </TabsTrigger>
            <TabsTrigger value="features" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              ✨ Features
            </TabsTrigger>
            <TabsTrigger value="risk" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              🛡️ Risk Management
            </TabsTrigger>
            <TabsTrigger value="modes" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              🎮 Trading Modes
            </TabsTrigger>
            <TabsTrigger value="api" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              🔌 API Reference
            </TabsTrigger>
          </TabsList>

          {/* Workflow Tab */}
          <TabsContent value="workflow" className="space-y-6">
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
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Architecture Tab */}
          <TabsContent value="architecture" className="space-y-6">
            <Card className="bg-black/90 border-cyan-500/50">
              <CardHeader>
                <CardTitle className="text-2xl text-cyan-400 font-mono flex items-center gap-2">
                  <Database className="h-6 w-6" />
                  System Architecture
                </CardTitle>
                <CardDescription className="text-gray-400">
                  High-level system design and component interactions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-cyan-900/20 to-black/80 border border-cyan-500/30 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-cyan-400 font-mono mb-4">Frontend Layer</h3>
                    <ul className="space-y-2 text-gray-300 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <span><strong className="text-cyan-300">React 19 + TypeScript:</strong> Modern UI with type safety</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <span><strong className="text-cyan-300">Zustand State Management:</strong> Lightweight global state for trading data</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <span><strong className="text-cyan-300">TradingView Charts:</strong> Professional-grade charting with technical indicators</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <span><strong className="text-cyan-300">Browser Storage:</strong> API keys stored locally (never sent to backend)</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-purple-900/20 to-black/80 border border-purple-500/30 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-purple-400 font-mono mb-4">Backend Layer</h3>
                    <ul className="space-y-2 text-gray-300 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <span><strong className="text-purple-300">Python FastAPI:</strong> High-performance REST API + WebSocket support</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <span><strong className="text-purple-300">SQLAlchemy ORM:</strong> Database abstraction for trades, positions, and logs</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <span><strong className="text-purple-300">Celery + Redis:</strong> Background task processing for AI analysis</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <span><strong className="text-purple-300">SQLite/PostgreSQL:</strong> Local development / Production database</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-green-900/20 to-black/80 border border-green-500/30 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-green-400 font-mono mb-4">Integration Layer</h3>
                    <ul className="space-y-2 text-gray-300 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span><strong className="text-green-300">Hyperliquid SDK:</strong> Direct integration with perpetual futures exchange</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span><strong className="text-green-300">OpenRouter API:</strong> Access to DeepSeek V3.1 and Qwen3 Max AI models</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span><strong className="text-green-300">Binance API:</strong> Fallback price data and market information</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span><strong className="text-green-300">CryptoPanic API:</strong> Real-time crypto news aggregation (optional)</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Data Flow Diagram */}
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-cyan-400 font-mono mb-4">Data Flow</h3>
                  <div className="bg-black/50 border border-cyan-500/30 rounded-lg p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-32 bg-cyan-500/20 border border-cyan-500 rounded px-3 py-2 text-cyan-400 font-mono text-sm text-center">
                          User Action
                        </div>
                        <div className="text-cyan-400">→</div>
                        <div className="w-32 bg-purple-500/20 border border-purple-500 rounded px-3 py-2 text-purple-400 font-mono text-sm text-center">
                          Frontend
                        </div>
                        <div className="text-cyan-400">→</div>
                        <div className="w-32 bg-blue-500/20 border border-blue-500 rounded px-3 py-2 text-blue-400 font-mono text-sm text-center">
                          Backend API
                        </div>
                      </div>
                      <div className="flex items-center gap-4 ml-16">
                        <div className="text-cyan-400">↓</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32 bg-green-500/20 border border-green-500 rounded px-3 py-2 text-green-400 font-mono text-sm text-center">
                          AI Analysis
                        </div>
                        <div className="text-cyan-400">←</div>
                        <div className="w-32 bg-orange-500/20 border border-orange-500 rounded px-3 py-2 text-orange-400 font-mono text-sm text-center">
                          Market Data
                        </div>
                        <div className="text-cyan-400">←</div>
                        <div className="w-32 bg-yellow-500/20 border border-yellow-500 rounded px-3 py-2 text-yellow-400 font-mono text-sm text-center">
                          Hyperliquid
                        </div>
                      </div>
                      <div className="flex items-center gap-4 ml-16">
                        <div className="text-cyan-400">↓</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32 bg-red-500/20 border border-red-500 rounded px-3 py-2 text-red-400 font-mono text-sm text-center">
                          Risk Check
                        </div>
                        <div className="text-cyan-400">→</div>
                        <div className="w-32 bg-pink-500/20 border border-pink-500 rounded px-3 py-2 text-pink-400 font-mono text-sm text-center">
                          Execute Trade
                        </div>
                        <div className="text-cyan-400">→</div>
                        <div className="w-32 bg-cyan-500/20 border border-cyan-500 rounded px-3 py-2 text-cyan-400 font-mono text-sm text-center">
                          Update UI
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* No Auth Architecture */}
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-orange-400 font-mono mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    No Authentication Architecture
                  </h3>
                  <div className="bg-gradient-to-br from-orange-900/20 to-black/80 border border-orange-500/30 rounded-lg p-6 space-y-4">
                    <p className="text-gray-300 text-sm">
                      This project is designed for <strong className="text-orange-400">local and private use only</strong>. No authentication system is required.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-orange-400 font-mono font-bold mb-2">✅ What Stays:</h4>
                        <ul className="space-y-1 text-sm text-gray-300">
                          <li>• Direct API access (localhost only)</li>
                          <li>• All trading functionality</li>
                          <li>• Database for trades/logs/positions</li>
                          <li>• WebSocket for real-time updates</li>
                          <li>• Background workers (Celery)</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-red-400 font-mono font-bold mb-2">❌ What's Removed:</h4>
                        <ul className="space-y-1 text-sm text-gray-300">
                          <li>• No authentication system</li>
                          <li>• No JWT tokens</li>
                          <li>• No user sessions</li>
                          <li>• No login/signup flows</li>
                          <li>• No auth middleware</li>
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded">
                      <p className="text-xs text-orange-300 font-mono">
                        🔒 <strong>Security:</strong> API keys are stored in browser localStorage or backend .env file. Use network-level security (firewall) for production deployments. CORS allows localhost:3000 for development.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: Brain,
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
                  icon: TrendingUp,
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
                  icon: Activity,
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
          </TabsContent>

          {/* Risk Management Tab */}
          <TabsContent value="risk" className="space-y-6">
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trading Modes Tab */}
          <TabsContent value="modes" className="space-y-6">
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
          </TabsContent>

          {/* API Reference Tab */}
          <TabsContent value="api" className="space-y-6">
            <Card className="bg-black/90 border-cyan-500/50">
              <CardHeader>
                <CardTitle className="text-2xl text-cyan-400 font-mono">
                  🔌 API Endpoints
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Backend API reference for developers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { method: "GET", endpoint: "/api/trading-logs", description: "Retrieve trading history" },
                    { method: "POST", endpoint: "/api/ai/analyze", description: "Single chart AI analysis" },
                    { method: "POST", endpoint: "/api/ai/analyze-multi-chart", description: "Multi-chart AI analysis" },
                    { method: "GET", endpoint: "/api/hyperliquid/test-connection", description: "Test Hyperliquid connection" },
                    { method: "POST", endpoint: "/api/hyperliquid/execute-trade", description: "Execute live trade" },
                    { method: "GET", endpoint: "/api/balance-history", description: "Get balance history" },
                    { method: "POST", endpoint: "/api/paper-trading/execute", description: "Execute paper trade" },
                    { method: "GET", endpoint: "/health", description: "Health check endpoint" },
                    { method: "GET", endpoint: "/docs", description: "Interactive API documentation" }
                  ].map((api, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-4 p-3 bg-black/50 border border-cyan-500/30 rounded font-mono text-sm hover:border-cyan-500/50 transition-all"
                    >
                      <Badge 
                        variant="outline" 
                        className={`${
                          api.method === 'GET' ? 'text-green-400 border-green-500' : 'text-blue-400 border-blue-500'
                        } font-bold`}
                      >
                        {api.method}
                      </Badge>
                      <code className="text-cyan-400 flex-1">{api.endpoint}</code>
                      <span className="text-gray-400 text-xs">{api.description}</span>
                    </motion.div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded">
                  <p className="text-blue-300 text-sm font-mono">
                    📖 <strong>Full API Documentation:</strong> Visit <code className="text-cyan-400">http://localhost:8000/docs</code> for interactive Swagger UI
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <Button
            size="lg"
            onClick={() => navigate('/dashboard')}
            className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold font-mono shadow-[0_0_20px_rgba(0,255,255,0.5)]"
          >
            <Zap className="mr-2 h-5 w-5" />
            Start Trading Now
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
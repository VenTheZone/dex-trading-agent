import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, CheckCircle, Shield, Server, Globe, Cpu, User, Activity, ArrowRight } from "lucide-react";

interface ArchitectureTabProps {
  onNavigate: (tab: string) => void;
}

export function ArchitectureTab({ onNavigate }: ArchitectureTabProps) {
  const architectureNodes = [
    {
      id: "user",
      title: "User",
      description: "Trader",
      icon: User,
      color: "blue",
      x: 15,
      y: 50
    },
    {
      id: "frontend",
      title: "Frontend",
      description: "React + Zustand",
      icon: Globe,
      color: "cyan",
      x: 35,
      y: 50
    },
    {
      id: "backend",
      title: "Backend API",
      description: "FastAPI + Celery",
      icon: Server,
      color: "purple",
      x: 60,
      y: 50
    },
    {
      id: "ai",
      title: "AI Engine",
      description: "DeepSeek / Qwen",
      icon: Cpu,
      color: "pink",
      x: 60,
      y: 20
    },
    {
      id: "db",
      title: "Database",
      description: "PostgreSQL / Redis",
      icon: Database,
      color: "green",
      x: 60,
      y: 80
    },
    {
      id: "exchange",
      title: "Hyperliquid",
      description: "DEX Execution",
      icon: Activity,
      color: "yellow",
      x: 85,
      y: 50
    }
  ];

  return (
    <div className="space-y-6">
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
            <h3 className="text-xl font-bold text-cyan-400 font-mono mb-4">Data Flow Architecture</h3>
            <div className="relative w-full h-[500px] bg-black/50 border border-cyan-500/30 rounded-lg overflow-hidden">
              {/* Connecting Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L9,3 z" fill="rgba(6, 182, 212, 0.5)" />
                  </marker>
                </defs>
                {/* User -> Frontend */}
                <line x1="15%" y1="50%" x2="35%" y2="50%" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="2" markerEnd="url(#arrow)" />
                {/* Frontend <-> Backend */}
                <line x1="35%" y1="50%" x2="60%" y2="50%" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="2" markerEnd="url(#arrow)" />
                {/* Backend <-> AI */}
                <line x1="60%" y1="50%" x2="60%" y2="20%" stroke="rgba(236, 72, 153, 0.3)" strokeWidth="2" markerEnd="url(#arrow)" />
                {/* Backend <-> DB */}
                <line x1="60%" y1="50%" x2="60%" y2="80%" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="2" markerEnd="url(#arrow)" />
                {/* Backend <-> Exchange */}
                <line x1="60%" y1="50%" x2="85%" y2="50%" stroke="rgba(234, 179, 8, 0.3)" strokeWidth="2" markerEnd="url(#arrow)" />
              </svg>

              {/* Nodes */}
              {architectureNodes.map((node) => {
                const Icon = node.icon;
                return (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    className={`absolute cursor-pointer`}
                    style={{ 
                      left: `${node.x}%`, 
                      top: `${node.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div className={`
                      flex flex-col items-center gap-2 p-4 rounded-lg bg-black/90 border-2 
                      border-${node.color}-500/50 hover:border-${node.color}-500 
                      shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(0,0,0,0.7)]
                      transition-all duration-300 w-32 text-center
                    `}>
                      <div className={`p-2 rounded-full bg-${node.color}-500/20`}>
                        <Icon className={`h-6 w-6 text-${node.color}-400`} />
                      </div>
                      <div>
                        <h4 className={`text-xs font-bold text-${node.color}-400 font-mono`}>{node.title}</h4>
                        <p className="text-[10px] text-gray-400 leading-tight mt-1">{node.description}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
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

          <div className="mt-8 pt-6 border-t border-cyan-900/30 flex flex-wrap gap-4">
            <span className="text-gray-500 text-sm font-mono py-2">Related Documentation:</span>
            <Button 
              variant="outline" 
              onClick={() => onNavigate("api")}
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 font-mono text-xs"
            >
              API Reference <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onNavigate("workflow")}
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 font-mono text-xs"
            >
              System Workflow <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
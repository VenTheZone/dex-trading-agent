import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Terminal, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApiReferenceTabProps {
  onNavigate: (tab: string) => void;
}

export function ApiReferenceTab({ onNavigate }: ApiReferenceTabProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-black/90 border-cyan-500/50">
        <CardHeader>
          <CardTitle className="text-2xl text-cyan-400 font-mono flex items-center gap-2">
            <Terminal className="h-6 w-6" />
            API Endpoints
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
                className="group flex items-center gap-4 p-4 bg-black/50 border border-cyan-500/20 rounded-lg font-mono text-sm hover:border-cyan-500/50 hover:bg-cyan-950/10 transition-all"
              >
                <Badge 
                  variant="outline" 
                  className={`${
                    api.method === 'GET' ? 'text-green-400 border-green-500/50 bg-green-500/10' : 'text-blue-400 border-blue-500/50 bg-blue-500/10'
                  } font-bold w-16 justify-center`}
                >
                  {api.method}
                </Badge>
                <code className="text-cyan-300 flex-1 font-bold group-hover:text-cyan-200 transition-colors">{api.endpoint}</code>
                <span className="text-gray-500 text-xs hidden md:inline-block">{api.description}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Copy className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded">
            <p className="text-blue-300 text-sm font-mono">
              📖 <strong>Full API Documentation:</strong> Visit <code className="text-cyan-400">http://localhost:8000/docs</code> for interactive Swagger UI
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-cyan-900/30 flex justify-end">
            <Button 
              variant="ghost" 
              onClick={() => onNavigate("architecture")}
              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 font-mono"
            >
              View System Architecture <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
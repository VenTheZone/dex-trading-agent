import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bot, CheckCircle2, AlertTriangle } from "lucide-react";

export function PaperTradingGuide() {
  return (
    <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/50">
      <CardHeader>
        <CardTitle className="text-blue-400 font-mono flex items-center gap-2">
          <Bot className="h-5 w-5" />
          DeepSeek Paper Trading Test Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-blue-500/10 border-blue-500/50">
          <CheckCircle2 className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-200 text-sm">
            <strong>Paper Trading Mode Active:</strong> All trades are simulated with a $10,000 virtual balance. No real funds at risk.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="text-cyan-400 font-mono font-bold text-sm">Quick Start Steps:</h4>
          
          <div className="space-y-2 text-sm text-gray-300 font-mono">
            <div className="flex items-start gap-2">
              <span className="text-green-400 font-bold">1.</span>
              <div>
                <strong className="text-cyan-400">Configure OpenRouter API Key</strong>
                <p className="text-gray-400 text-xs mt-1">
                  Click the logo dropdown → Settings → Add your OpenRouter API key (starts with "sk-or-v1-")
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-green-400 font-bold">2.</span>
              <div>
                <strong className="text-cyan-400">Select Trading Coins</strong>
                <p className="text-gray-400 text-xs mt-1">
                  In Trading Controls → Allowed Coins → Select 1-4 coins (default: BTC, ETH, SOL)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-green-400 font-bold">3.</span>
              <div>
                <strong className="text-cyan-400">Enable AI Auto-Trading</strong>
                <p className="text-gray-400 text-xs mt-1">
                  Click "AI OFF" button in Trading Controls to toggle to "AI ON"
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-green-400 font-bold">4.</span>
              <div>
                <strong className="text-cyan-400">Monitor AI Analysis</strong>
                <p className="text-gray-400 text-xs mt-1">
                  Watch the AI Thoughts panel for real-time analysis and trading decisions
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-green-400 font-bold">5.</span>
              <div>
                <strong className="text-cyan-400">Check Trading Logs</strong>
                <p className="text-gray-400 text-xs mt-1">
                  View detailed trade execution logs in the Trading Logs panel
                </p>
              </div>
            </div>
          </div>
        </div>

        <Alert className="bg-yellow-500/10 border-yellow-500/50">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-200 text-xs">
            <strong>AI Model:</strong> DeepSeek V3.1 (Free) is selected by default. The AI will analyze markets every 60 seconds and execute paper trades based on technical analysis.
          </AlertDescription>
        </Alert>

        <div className="bg-black/50 border border-cyan-500/30 rounded p-3 space-y-2">
          <h4 className="text-cyan-400 font-mono font-bold text-xs">What to Expect:</h4>
          <ul className="text-xs text-gray-400 font-mono space-y-1">
            <li>• AI analyzes selected coins every 60 seconds</li>
            <li>• Dual chart analysis (5min timeframe + 1000-tick range)</li>
            <li>• Automatic position sizing based on balance and risk settings</li>
            <li>• Stop-loss and take-profit orders automatically set</li>
            <li>• Real-time P&L tracking and balance updates</li>
            <li>• Detailed reasoning for each trading decision</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
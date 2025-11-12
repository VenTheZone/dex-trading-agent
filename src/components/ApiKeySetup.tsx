import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { storage, ApiKeys } from '@/lib/storage';
import { AlertTriangle, Key, Save, ExternalLink, Info, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletConnect } from '@/components/WalletConnect';

interface ApiKeySetupProps {
  onComplete: () => void;
}

export function ApiKeySetup({ onComplete }: ApiKeySetupProps) {
  const [keys, setKeys] = useState<ApiKeys>(storage.getApiKeys() || {
    hyperliquid: { apiKey: '', apiSecret: '', walletAddress: '' },
    openRouter: '',
  });
  const [mode, setMode] = useState<'wallet' | 'api' | 'demo'>('wallet');

  const handleWalletConnect = (address: string) => {
    setKeys({
      ...keys,
      hyperliquid: { ...keys.hyperliquid, walletAddress: address }
    });
  };

  const handleDemoMode = () => {
    storage.saveApiKeys({
      hyperliquid: { apiKey: 'DEMO_MODE', apiSecret: 'DEMO_MODE', walletAddress: 'DEMO_MODE' },
      openRouter: 'DEMO_MODE',
    });
    toast.success('Demo mode activated - Using simulated data');
    onComplete();
  };

  const handleSave = () => {
    if (!keys.hyperliquid.apiKey || !keys.openRouter) {
      toast.error('Please fill in all required API keys');
      return;
    }

    // Validate private key format
    if (keys.hyperliquid.apiSecret && keys.hyperliquid.apiSecret !== 'DEMO_MODE') {
      const privateKey = keys.hyperliquid.apiSecret.trim();
      if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
        toast.error('Invalid private key format. Must start with "0x" and be 66 characters long.');
        return;
      }
    }

    storage.saveApiKeys(keys);
    toast.success('API keys saved securely in browser storage');
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto p-6"
    >
      <Tabs defaultValue="wallet" className="w-full" onValueChange={(v) => setMode(v as any)}>
        <TabsList className="grid w-full grid-cols-3 bg-black/50 mb-6">
          <TabsTrigger 
            value="wallet" 
            className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-mono"
          >
            🔗 Wallet
          </TabsTrigger>
          <TabsTrigger 
            value="api" 
            className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-mono"
          >
            🔑 API Keys
          </TabsTrigger>
          <TabsTrigger 
            value="demo" 
            className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-mono"
          >
            🎮 Demo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallet">
          <WalletConnect onConnect={handleWalletConnect} />
        </TabsContent>

        <TabsContent value="api">
          <Card className="bg-black/90 border-cyan-500/50 shadow-[0_0_30px_rgba(0,255,255,0.3)]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Key className="h-8 w-8 text-cyan-400" />
                <div>
                  <CardTitle className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'monospace' }}>
                    API Configuration
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    For automated trading - Full control
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <Alert className="bg-red-500/10 border-red-500/50">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-200">
                  <strong>⚠️ CRITICAL SECURITY WARNING:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Your private key has FULL CONTROL over your funds</li>
                    <li>• Keys are stored in browser localStorage (vulnerable to XSS attacks)</li>
                    <li>• NEVER share your private key with anyone</li>
                    <li>• Consider using a separate wallet with limited funds for trading</li>
                    <li>• This app is open-source - verify the code before use</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Alert className="bg-yellow-500/10 border-yellow-500/50">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-200">
                  <strong>💡 RECOMMENDED SECURITY PRACTICES:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Create a new wallet specifically for this trading bot</li>
                    <li>• Only deposit funds you're willing to risk</li>
                    <li>• Start with testnet to verify functionality</li>
                    <li>• Regularly monitor your positions and balance</li>
                    <li>• Use hardware wallet for main funds storage</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Accordion type="single" collapsible className="w-full">
                {/* ... keep existing accordion items ... */}
              </Accordion>
              
              <div className="space-y-4">
                {/* ... keep existing input fields ... */}
                <div className="space-y-2">
                  <Label className="text-cyan-400 font-mono">Hyperliquid API Key *</Label>
                  <Input
                    type="password"
                    placeholder="Enter Hyperliquid API Key"
                    value={keys.hyperliquid.apiKey}
                    onChange={(e) => setKeys({
                      ...keys,
                      hyperliquid: { ...keys.hyperliquid, apiKey: e.target.value }
                    })}
                    className="bg-black/50 border-cyan-500/30 text-cyan-100 font-mono focus:border-cyan-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-cyan-400 font-mono">Hyperliquid API Secret (Private Key) *</Label>
                  <Input
                    type="password"
                    placeholder="0x..."
                    value={keys.hyperliquid.apiSecret}
                    onChange={(e) => setKeys({
                      ...keys,
                      hyperliquid: { ...keys.hyperliquid, apiSecret: e.target.value }
                    })}
                    className="bg-black/50 border-cyan-500/30 text-cyan-100 font-mono focus:border-cyan-500"
                  />
                  <p className="text-xs text-gray-500 font-mono">Should start with "0x" and be 66 characters long</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-cyan-400 font-mono">Wallet Address (Optional)</Label>
                  <Input
                    placeholder="0x..."
                    value={keys.hyperliquid.walletAddress}
                    onChange={(e) => setKeys({
                      ...keys,
                      hyperliquid: { ...keys.hyperliquid, walletAddress: e.target.value }
                    })}
                    className="bg-black/50 border-cyan-500/30 text-cyan-100 font-mono focus:border-cyan-500"
                  />
                  <p className="text-xs text-gray-500 font-mono">Your Ethereum wallet address for position tracking</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-cyan-400 font-mono">OpenRouter API Key *</Label>
                  <Input
                    type="password"
                    placeholder="sk-or-v1-..."
                    value={keys.openRouter}
                    onChange={(e) => setKeys({ ...keys, openRouter: e.target.value })}
                    className="bg-black/50 border-cyan-500/30 text-cyan-100 font-mono focus:border-cyan-500"
                  />
                  <p className="text-xs text-gray-500 font-mono">Required for AI-powered market analysis</p>
                </div>
              </div>
            </CardContent>
            <Button
              onClick={handleSave}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold font-mono shadow-[0_0_20px_rgba(0,255,255,0.5)]"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Configuration
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="demo">
          <Card className="bg-black/90 border-cyan-500/50 shadow-[0_0_30px_rgba(0,255,255,0.3)]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Info className="h-8 w-8 text-cyan-400" />
                <div>
                  <CardTitle className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'monospace' }}>
                    Demo Mode
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Try the platform with simulated data
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <Alert className="bg-green-500/10 border-green-500/50">
                <Info className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-200">
                  <strong>✨ Demo Mode Features:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• No API keys required</li>
                    <li>• Simulated trading with $10,000 virtual balance</li>
                    <li>• Real-time market data from public sources</li>
                    <li>• Test all features risk-free</li>
                    <li>• Perfect for learning and experimentation</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="bg-black/50 border border-cyan-500/30 rounded p-6 space-y-4">
                <h3 className="text-cyan-400 font-mono font-bold text-lg">What you can do in Demo Mode:</h3>
                <ul className="space-y-2 text-gray-300 font-mono text-sm">
                  <li>✅ View live market charts</li>
                  <li>✅ Test AI trading analysis</li>
                  <li>✅ Practice with paper trading</li>
                  <li>✅ Explore all dashboard features</li>
                  <li>✅ Learn risk management strategies</li>
                </ul>
                <p className="text-yellow-400 text-sm font-mono mt-4">
                  ⚠️ Note: Demo mode uses simulated data. No real trades will be executed.
                </p>
              </div>

              <Button
                onClick={handleDemoMode}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-black font-bold font-mono shadow-[0_0_20px_rgba(0,255,255,0.5)]"
              >
                <Activity className="mr-2 h-4 w-4" />
                Start Demo Mode
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
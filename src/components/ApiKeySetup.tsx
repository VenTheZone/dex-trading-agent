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
    // Get initial balance from input
    const balanceInput = document.getElementById('demo-initial-balance') as HTMLInputElement;
    const initialBalance = balanceInput ? parseFloat(balanceInput.value) || 10000 : 10000;
    
    // Validate balance
    if (initialBalance < 100 || initialBalance > 1000000) {
      toast.error('Initial balance must be between $100 and $1,000,000');
      return;
    }
    
    // Preserve OpenRouter key if provided, otherwise use DEMO_MODE
    const openRouterKey = keys.openRouter && keys.openRouter.trim() !== '' ? keys.openRouter : 'DEMO_MODE';
    
    storage.saveApiKeys({
      hyperliquid: { apiKey: 'DEMO_MODE', apiSecret: 'DEMO_MODE', walletAddress: 'DEMO_MODE' },
      openRouter: openRouterKey,
    });
    
    // Set initial balance in store
    import('@/store/tradingStore').then(m => {
      const { setInitialBalance } = m.useTradingStore.getState();
      setInitialBalance(initialBalance);
    });
    
    if (openRouterKey !== 'DEMO_MODE') {
      toast.success(`Demo mode activated with ${initialBalance.toLocaleString()} - Using your OpenRouter API key for real AI analysis`);
    } else {
      toast.success(`Demo mode activated with ${initialBalance.toLocaleString()} - Using DeepSeek free tier`);
    }
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
      
      if (!privateKey.startsWith('0x')) {
        toast.error('Invalid private key: Must start with "0x"', {
          description: `Your key starts with: ${privateKey.substring(0, 4)}...`,
          duration: 5000,
        });
        return;
      }
      
      if (privateKey.length !== 66) {
        toast.error(`Invalid private key length: ${privateKey.length} characters`, {
          description: `Expected 66 characters (0x + 64 hex digits). You have ${privateKey.length}.`,
          duration: 5000,
        });
        return;
      }
      
      // Check if it contains only valid hex characters after 0x
      const hexPart = privateKey.slice(2);
      if (!/^[0-9a-fA-F]+$/.test(hexPart)) {
        toast.error('Invalid private key: Contains non-hexadecimal characters', {
          description: 'Private key should only contain 0-9 and a-f after "0x"',
          duration: 5000,
        });
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
              <Alert className="bg-green-500/10 border-green-500/50">
                <Info className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-200">
                  <strong>✅ RECOMMENDED: Use Hyperliquid API Wallet (Agent Wallet)</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Agent wallets can trade but CANNOT withdraw funds</li>
                    <li>• Much safer than using your main wallet's private key</li>
                    <li>• Generate at <a href="https://app.hyperliquid.xyz/API" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">app.hyperliquid.xyz/API</a></li>
                    <li>• Valid for up to 180 days</li>
                    <li>• Can be revoked anytime from the Hyperliquid dashboard</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Alert className="bg-yellow-500/10 border-yellow-500/50">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-200">
                  <strong>⚠️ SECURITY NOTES:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Keys are stored in browser localStorage only</li>
                    <li>• NEVER share your private keys with anyone</li>
                    <li>• Start with testnet to verify functionality</li>
                    <li>• Regularly monitor your positions and balance</li>
                    <li>• Agent wallet private key is shown only once - save it securely!</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Accordion type="single" collapsible className="w-full">
                {/* ... keep existing accordion items ... */}
              </Accordion>
              
              <div className="space-y-4">
                {/* ... keep existing input fields ... */}
                <Alert className="bg-blue-500/10 border-blue-500/50 mb-4">
                  <Info className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-blue-200">
                    <strong>🔐 Recommended: Use Hyperliquid API Wallet (Agent Wallet)</strong>
                    <ol className="mt-2 space-y-1 text-sm list-decimal list-inside">
                      <li>Go to <a href="https://app.hyperliquid.xyz/API" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">app.hyperliquid.xyz/API</a></li>
                      <li>Click "Generate" to create an API wallet</li>
                      <li>Set validity period (up to 180 days)</li>
                      <li>Save the Agent Wallet Private Key (shown once!)</li>
                      <li>Click "Authorize" to complete setup</li>
                    </ol>
                    <p className="mt-2 text-xs text-green-300 font-bold">
                      ✅ Agent wallets can trade but CANNOT withdraw funds - much safer!
                    </p>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label className="text-cyan-400 font-mono">Master Account Address (Your Main Wallet) *</Label>
                  <Input
                    placeholder="0x... (Your main wallet address)"
                    value={keys.hyperliquid.apiKey}
                    onChange={(e) => setKeys({
                      ...keys,
                      hyperliquid: { ...keys.hyperliquid, apiKey: e.target.value.trim() }
                    })}
                    className="bg-black/50 border-cyan-500/30 text-cyan-100 font-mono focus:border-cyan-500"
                  />
                  <p className="text-xs text-gray-500 font-mono">
                    Your main wallet address (used for info requests)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-cyan-400 font-mono">Agent Wallet Private Key (API Secret) *</Label>
                  <Input
                    type="password"
                    placeholder="0x... (Agent wallet private key from Hyperliquid)"
                    value={keys.hyperliquid.apiSecret}
                    onChange={(e) => setKeys({
                      ...keys,
                      hyperliquid: { ...keys.hyperliquid, apiSecret: e.target.value.trim() }
                    })}
                    className="bg-black/50 border-cyan-500/30 text-cyan-100 font-mono focus:border-cyan-500"
                  />
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 font-mono">
                      Format: 0x + 64 hexadecimal characters (total 66 chars)
                    </p>
                    <p className="text-xs text-green-400 font-mono">
                      🔒 This agent wallet can trade but cannot withdraw funds
                    </p>
                    {keys.hyperliquid.apiSecret && (
                      <p className="text-xs text-cyan-400 font-mono">
                        Current length: {keys.hyperliquid.apiSecret.trim().length} characters
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-cyan-400 font-mono">Agent Wallet Address (Optional)</Label>
                  <Input
                    placeholder="0x... (Agent wallet address for tracking)"
                    value={keys.hyperliquid.walletAddress}
                    onChange={(e) => setKeys({
                      ...keys,
                      hyperliquid: { ...keys.hyperliquid, walletAddress: e.target.value.trim() }
                    })}
                    className="bg-black/50 border-cyan-500/30 text-cyan-100 font-mono focus:border-cyan-500"
                  />
                  <p className="text-xs text-gray-500 font-mono">The agent wallet address generated by Hyperliquid (optional for tracking)</p>
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
                  <li>✅ Simulate perpetual futures trading</li>
                  <li>✅ Explore all dashboard features</li>
                  <li>✅ Learn risk management strategies</li>
                </ul>
                <p className="text-yellow-400 text-sm font-mono mt-4">
                  ⚠️ Note: Demo mode uses simulated perpetual futures. No real trades will be executed.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-cyan-400 font-mono">Initial Balance (USD)</Label>
                  <Input
                    type="number"
                    placeholder="10000"
                    defaultValue="10000"
                    min="100"
                    max="1000000"
                    step="1000"
                    id="demo-initial-balance"
                    className="bg-black/50 border-cyan-500/30 text-cyan-100 font-mono focus:border-cyan-500"
                  />
                  <p className="text-xs text-gray-500 font-mono">
                    Set your starting capital for demo trading simulation
                  </p>
                </div>
=======
                <div className="space-y-2">
                  <Label className="text-cyan-400 font-mono">OpenRouter API Key (Optional)</Label>
                  <Input
                    type="password"
                    placeholder="sk-or-v1-... (optional for enhanced AI)"
                    value={keys.openRouter}
                    onChange={(e) => setKeys({ ...keys, openRouter: e.target.value })}
                    className="bg-black/50 border-cyan-500/30 text-cyan-100 font-mono focus:border-cyan-500"
                  />
                  <p className="text-xs text-gray-500 font-mono">
                    Add your OpenRouter key to test real DeepSeek AI analysis in demo mode
                  </p>
                </div>

                <Button
                  onClick={handleDemoMode}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-black font-bold font-mono shadow-[0_0_20px_rgba(0,255,255,0.5)]"
                >
                  <Activity className="mr-2 h-4 w-4" />
                  Start Demo Mode
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
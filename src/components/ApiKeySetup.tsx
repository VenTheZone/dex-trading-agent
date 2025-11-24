import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { storage, ApiKeys } from "@/lib/storage";
import { AlertTriangle, Key, Save, Info, Activity, CheckCircle2, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletConnect } from "@/components/WalletConnect";
import { sanitizeApiKey, sanitizeWalletAddress, sanitizePrivateKey, sanitizeNumberWithBounds } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface ApiKeySetupProps {
  onComplete: () => void;
}

export function ApiKeySetup({ onComplete }: ApiKeySetupProps) {
  const [keys, setKeys] = useState<ApiKeys>(storage.getApiKeys() || {
    hyperliquid: { apiKey: '', apiSecret: '', walletAddress: '' },
    openRouter: '',
  });
  const [, setMode] = useState<'wallet' | 'api' | 'demo'>('wallet');
  const [backendKeysConfigured, setBackendKeysConfigured] = useState(false);

  useEffect(() => {
    const checkBackendKeys = async () => {
      try {
        const response = await fetch((import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000') + '/api/check-backend-keys');
        if (response.ok) {
          const data = await response.json();
          setBackendKeysConfigured(data.hasBackendKeys || false);
        }
      } catch (error) {
        setBackendKeysConfigured(false);
      }
    };
    checkBackendKeys();
  }, []);

  const handleWalletConnect = (address: string) => {
    setKeys({
      ...keys,
      hyperliquid: { ...keys.hyperliquid, walletAddress: address }
    });
  };

  const handleDemoMode = () => {
    const balanceInput = document.getElementById('demo-initial-balance') as HTMLInputElement;
    const rawBalance = balanceInput ? balanceInput.value : '10000';
    const initialBalance = sanitizeNumberWithBounds(rawBalance, 100, 1000000, 10000);
    const rawOpenRouterKey = keys.openRouter && keys.openRouter.trim() !== '' ? keys.openRouter : 'DEMO_MODE';
    const openRouterKey = rawOpenRouterKey === 'DEMO_MODE' ? 'DEMO_MODE' : sanitizeApiKey(rawOpenRouterKey);
    
    storage.saveApiKeys({
      hyperliquid: { apiKey: 'DEMO_MODE', apiSecret: 'DEMO_MODE', walletAddress: 'DEMO_MODE' },
      openRouter: openRouterKey,
    });
    
    import('@/store/tradingStore').then(m => {
      const { setInitialBalance } = m.useTradingStore.getState();
      setInitialBalance(initialBalance);
    });
    
    if (openRouterKey !== 'DEMO_MODE') {
      toast.success(`Demo mode activated with $${initialBalance.toLocaleString()} - Using your OpenRouter API key for real AI analysis`);
    } else {
      toast.success(`Demo mode activated with $${initialBalance.toLocaleString()} - Using DeepSeek free tier`);
    }
    onComplete();
  };

  const handleSave = async () => {
    const sanitizedApiKey = sanitizeWalletAddress(keys.hyperliquid.apiKey.trim());
    const sanitizedApiSecret = sanitizePrivateKey(keys.hyperliquid.apiSecret.trim());
    const sanitizedWalletAddress = keys.hyperliquid.walletAddress ? sanitizeWalletAddress(keys.hyperliquid.walletAddress.trim()) : '';
    const sanitizedOpenRouter = sanitizeApiKey(keys.openRouter.trim());
    
    if (!sanitizedApiKey || !sanitizedOpenRouter) {
      toast.error('Please fill in all required API keys');
      return;
    }

    if (sanitizedOpenRouter && sanitizedOpenRouter !== 'DEMO_MODE') {
      if (!sanitizedOpenRouter.startsWith('sk-or-v1-')) {
        toast.error('Invalid OpenRouter API key format', {
          description: 'OpenRouter keys must start with "sk-or-v1-"',
          duration: 5000,
        });
        return;
      }
    }

    if (sanitizedApiSecret && sanitizedApiSecret !== 'DEMO_MODE') {
      let privateKey = sanitizedApiSecret;
      
      if (privateKey.length === 64) {
        if (!/^[0-9a-fA-F]+$/.test(privateKey)) {
          toast.error('Invalid private key: Contains non-hexadecimal characters', {
            description: 'Private key should only contain 0-9 and a-f',
            duration: 5000,
          });
          return;
        }
        privateKey = '0x' + privateKey;
      } else if (privateKey.length === 66) {
        if (!privateKey.startsWith('0x')) {
          toast.error('Invalid private key: 66-character key must start with "0x"', {
            description: `Your key starts with: ${privateKey.substring(0, 4)}...`,
            duration: 5000,
          });
          return;
        }
        
        const hexPart = privateKey.slice(2);
        if (!/^[0-9a-fA-F]{64}$/.test(hexPart)) {
          toast.error('Invalid private key: Must contain exactly 64 hexadecimal characters after "0x"', {
            description: 'Private key should only contain 0-9 and a-f after "0x"',
            duration: 5000,
          });
          return;
        }
      } else if (privateKey.length === 42 && privateKey.startsWith('0x')) {
        toast.error('This looks like a wallet ADDRESS, not a private key!', {
          description: 'You need the PRIVATE KEY (64-66 chars), not the wallet address (42 chars). The private key is shown ONCE when you generate the agent wallet.',
          duration: 8000,
        });
        return;
      } else {
        toast.error(`Invalid private key length: ${privateKey.length} characters`, {
          description: `Expected 64 characters (no prefix) or 66 characters (0x + 64 hex digits). You have ${privateKey.length}.`,
          duration: 5000,
        });
        return;
      }
      
      keys.hyperliquid.apiSecret = privateKey;
    }

    storage.saveApiKeys({
      hyperliquid: {
        apiKey: sanitizedApiKey,
        apiSecret: keys.hyperliquid.apiSecret,
        walletAddress: sanitizedWalletAddress,
      },
      openRouter: sanitizedOpenRouter,
    });
    
    const { setMode } = await import('@/store/tradingStore').then(m => m.useTradingStore.getState());
    setMode('live');
    
    toast.success('API keys saved - Fetching live balance...', {
      description: 'Switch to LIVE mode in dashboard to see your balance',
    });
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto p-6"
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
                  <CardTitle className="text-2xl font-bold text-cyan-400 font-mono">
                    API Configuration
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    For automated trading - Full control
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            {backendKeysConfigured && (
              <div className="px-6 pb-4">
                <Alert className="bg-green-500/10 border-green-500/50">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-200">
                    <strong>✅ Backend API Keys Detected</strong>
                    <p className="mt-2 text-sm">
                      Your OpenRouter and/or CryptoPanic API keys are configured in the backend environment.
                    </p>
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            <CardContent className="space-y-8">
              {/* Security Notices Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-cyan-400 font-mono flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Important Security Information
                </h3>
                
                <Alert className="bg-green-500/10 border-green-500/50">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-200">
                    <strong>✅ RECOMMENDED: Use Hyperliquid Agent Wallet</strong>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Agent wallets can trade but CANNOT withdraw funds</li>
                      <li>• Much safer than using your main wallet's private key</li>
                      <li>• Generate at <a href="https://app.hyperliquid.xyz/API" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">app.hyperliquid.xyz/API</a></li>
                      <li>• Valid for up to 180 days</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <Alert className="bg-yellow-500/10 border-yellow-500/50">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-200">
                    <strong>⚠️ CRITICAL SECURITY NOTES:</strong>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• <strong className="text-red-300">ALWAYS use a separate/dedicated wallet for AI trading</strong></li>
                      <li>• <strong className="text-red-300">NEVER use your main wallet with significant funds</strong></li>
                      <li>• Keys are stored in browser localStorage only</li>
                      <li>• Start with testnet to verify functionality</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>

              <Separator className="bg-cyan-500/30" />

              {/* Setup Guide Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-cyan-400 font-mono flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Step-by-Step Setup Guide
                </h3>

                <div className="grid gap-4">
                  <Card className="bg-black/50 border-cyan-500/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-bold text-cyan-400 font-mono">
                        STEP 1: Get Your Hyperliquid Wallet Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-300 space-y-2">
                      <p>• Go to <a href="https://app.hyperliquid.xyz" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">app.hyperliquid.xyz</a></p>
                      <p>• Connect your wallet (MetaMask, etc.)</p>
                      <p>• Copy your wallet address (top right corner)</p>
                      <p className="text-yellow-300 font-mono">👉 This goes in "Hyperliquid Wallet Address" below</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/50 border-green-500/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-bold text-green-400 font-mono">
                        STEP 2: Generate Agent Wallet
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-300 space-y-2">
                      <p>• Go to <a href="https://app.hyperliquid.xyz/API" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">app.hyperliquid.xyz/API</a></p>
                      <p>• Click "Generate" to create an agent wallet</p>
                      <p>• Set validity (up to 180 days)</p>
                      <p>• <strong className="text-red-400">IMPORTANT:</strong> Copy the Private Key (shown only once!)</p>
                      <p>• Click "Authorize" to complete</p>
                      <p className="text-yellow-300 font-mono">👉 Private Key goes in "Agent Wallet Private Key" below</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator className="bg-cyan-500/30" />

              {/* Input Fields Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-cyan-400 font-mono flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Enter Your API Keys
                </h3>

                <div className="space-y-5">
                  {/* Hyperliquid Wallet Address */}
                  <div className="space-y-2">
                    <Label className="text-cyan-400 font-mono text-base font-bold">
                      1️⃣ Hyperliquid Wallet Address *
                    </Label>
                    <Input
                      placeholder="0x1234...5678"
                      value={keys.hyperliquid.apiKey}
                      onChange={(e) => {
                        const sanitized = sanitizeWalletAddress(e.target.value);
                        setKeys({
                          ...keys,
                          hyperliquid: { ...keys.hyperliquid, apiKey: sanitized }
                        });
                      }}
                      className="bg-black/50 border-cyan-500/30 text-cyan-100 font-mono focus:border-cyan-500 h-12"
                    />
                    <p className="text-xs text-gray-400 font-mono">
                      💰 Your Hyperliquid wallet address (where your funds are stored)
                    </p>
                  </div>

                  {/* Agent Wallet Private Key */}
                  <div className="space-y-2">
                    <Label className="text-cyan-400 font-mono text-base font-bold">
                      2️⃣ Agent Wallet Private Key (From Hyperliquid API Page) *
                    </Label>
                    <Input
                      type="password"
                      placeholder="0xabcd...ef01 (64-66 chars)"
                      value={keys.hyperliquid.apiSecret}
                      onChange={(e) => {
                        const sanitized = sanitizePrivateKey(e.target.value);
                        setKeys({
                          ...keys,
                          hyperliquid: { ...keys.hyperliquid, apiSecret: sanitized }
                        });
                      }}
                      className="bg-black/50 border-cyan-500/30 text-cyan-100 font-mono focus:border-cyan-500 h-12"
                    />
                    <div className="flex items-start gap-2">
                      <p className="text-xs text-gray-400 font-mono flex-1">
                        🔒 Private key shown ONCE when you clicked "Generate" (64 or 66 characters)
                      </p>
                      {keys.hyperliquid.apiSecret && (
                        <p className={`text-xs font-mono ${
                          keys.hyperliquid.apiSecret.trim().length === 64 || keys.hyperliquid.apiSecret.trim().length === 66 
                            ? 'text-green-400' 
                            : keys.hyperliquid.apiSecret.trim().length === 42
                            ? 'text-red-400 font-bold'
                            : 'text-red-400'
                        }`}>
                          {keys.hyperliquid.apiSecret.trim().length} chars {
                            keys.hyperliquid.apiSecret.trim().length === 64 || keys.hyperliquid.apiSecret.trim().length === 66 
                              ? '✅' 
                              : keys.hyperliquid.apiSecret.trim().length === 42
                              ? '❌ ADDRESS!'
                              : '❌'
                          }
                        </p>
                      )}
                    </div>
                  </div>

                  {/* OpenRouter API Key */}
                  <div className="space-y-2">
                    <Label className="text-cyan-400 font-mono text-base font-bold">
                      3️⃣ OpenRouter API Key *
                    </Label>
                    <Input
                      type="password"
                      placeholder="sk-or-v1-..."
                      value={keys.openRouter}
                      onChange={(e) => {
                        const sanitized = sanitizeApiKey(e.target.value);
                        setKeys({ ...keys, openRouter: sanitized });
                      }}
                      className="bg-black/50 border-cyan-500/30 text-cyan-100 font-mono focus:border-cyan-500 h-12"
                    />
                    <p className="text-xs text-gray-400 font-mono">
                      🤖 Required for AI-powered market analysis (get from <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">openrouter.ai</a>)
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSave}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold font-mono shadow-[0_0_20px_rgba(0,255,255,0.5)] h-12 text-base"
              >
                <Save className="mr-2 h-5 w-5" />
                Save Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demo">
          <Card className="bg-black/90 border-cyan-500/50 shadow-[0_0_30px_rgba(0,255,255,0.3)]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-cyan-400" />
                <div>
                  <CardTitle className="text-2xl font-bold text-cyan-400 font-mono">
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
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-200">
                  <strong>✨ Demo Mode Features:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• No API keys required</li>
                    <li>• Simulated trading with $10,000 virtual balance</li>
                    <li>• Real-time market data from public sources</li>
                    <li>• Test all features risk-free</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Separator className="bg-cyan-500/30" />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-cyan-400 font-mono text-base">Initial Balance (USD)</Label>
                  <Input
                    type="number"
                    placeholder="10000"
                    defaultValue="10000"
                    min="100"
                    max="1000000"
                    step="1000"
                    id="demo-initial-balance"
                    className="bg-black/50 border-cyan-500/30 text-cyan-100 font-mono focus:border-cyan-500 h-12"
                  />
                  <p className="text-xs text-gray-400 font-mono">
                    Set your starting capital for demo trading simulation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-cyan-400 font-mono text-base">OpenRouter API Key (Optional)</Label>
                  <Input
                    type="password"
                    placeholder="sk-or-v1-... (optional for enhanced AI)"
                    value={keys.openRouter}
                    onChange={(e) => {
                      const sanitized = sanitizeApiKey(e.target.value);
                      setKeys({ ...keys, openRouter: sanitized });
                    }}
                    className="bg-black/50 border-cyan-500/30 text-cyan-100 font-mono focus:border-cyan-500 h-12"
                  />
                  <p className="text-xs text-gray-400 font-mono">
                    Add your OpenRouter key to test real DeepSeek AI analysis in demo mode
                  </p>
                </div>

                <Button
                  onClick={handleDemoMode}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-black font-bold font-mono shadow-[0_0_20px_rgba(0,255,255,0.5)] h-12 text-base"
                >
                  <Activity className="mr-2 h-5 w-5" />
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
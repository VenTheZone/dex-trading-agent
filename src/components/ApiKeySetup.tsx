import { useState, useEffect } from 'react';
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
import { sanitizeApiKey, sanitizeWalletAddress, sanitizePrivateKey, sanitizeNumberWithBounds } from '@/lib/utils';

interface ApiKeySetupProps {
  onComplete: () => void;
}

export function ApiKeySetup({ onComplete }: ApiKeySetupProps) {
  const [keys, setKeys] = useState<ApiKeys>(storage.getApiKeys() || {
    hyperliquid: { apiKey: '', apiSecret: '', walletAddress: '' },
    openRouter: '',
  });
  const [mode, setMode] = useState<'wallet' | 'api' | 'demo'>('wallet');
  const [backendKeysConfigured, setBackendKeysConfigured] = useState(false);

  // Check if backend keys are configured
  useEffect(() => {
    const checkBackendKeys = async () => {
      try {
        // Check if backend has OpenRouter key configured
        const response = await fetch(import.meta.env.VITE_CONVEX_URL + '/api/check-backend-keys');
        if (response.ok) {
          const data = await response.json();
          setBackendKeysConfigured(data.hasBackendKeys || false);
        }
      } catch (error) {
        // Backend check failed, assume no backend keys
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
    // Get initial balance from input
    const balanceInput = document.getElementById('demo-initial-balance') as HTMLInputElement;
    const rawBalance = balanceInput ? balanceInput.value : '10000';
    
    // Sanitize and validate balance
    const initialBalance = sanitizeNumberWithBounds(rawBalance, 100, 1000000, 10000);
    
    // Preserve OpenRouter key if provided, otherwise use DEMO_MODE
    const rawOpenRouterKey = keys.openRouter && keys.openRouter.trim() !== '' ? keys.openRouter : 'DEMO_MODE';
    const openRouterKey = rawOpenRouterKey === 'DEMO_MODE' ? 'DEMO_MODE' : sanitizeApiKey(rawOpenRouterKey);
    
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
      toast.success(`Demo mode activated with $${initialBalance.toLocaleString()} - Using your OpenRouter API key for real AI analysis`);
    } else {
      toast.success(`Demo mode activated with $${initialBalance.toLocaleString()} - Using DeepSeek free tier`);
    }
    onComplete();
  };

  const handleSave = async () => {
    // Sanitize all inputs before validation
    const sanitizedApiKey = sanitizeWalletAddress(keys.hyperliquid.apiKey.trim());
    const sanitizedApiSecret = sanitizePrivateKey(keys.hyperliquid.apiSecret.trim());
    const sanitizedWalletAddress = keys.hyperliquid.walletAddress ? sanitizeWalletAddress(keys.hyperliquid.walletAddress.trim()) : '';
    const sanitizedOpenRouter = sanitizeApiKey(keys.openRouter.trim());
    
    if (!sanitizedApiKey || !sanitizedOpenRouter) {
      toast.error('Please fill in all required API keys');
      return;
    }

    // Validate OpenRouter API key format
    if (sanitizedOpenRouter && sanitizedOpenRouter !== 'DEMO_MODE') {
      if (!sanitizedOpenRouter.startsWith('sk-or-v1-')) {
        toast.error('Invalid OpenRouter API key format', {
          description: 'OpenRouter keys must start with "sk-or-v1-"',
          duration: 5000,
        });
        return;
      }
    }

    // Validate private key format
    if (sanitizedApiSecret && sanitizedApiSecret !== 'DEMO_MODE') {
      let privateKey = sanitizedApiSecret;
      
      // Accept both formats: 64 chars (no 0x) or 66 chars (with 0x)
      if (privateKey.length === 64) {
        // Must be valid hex
        if (!/^[0-9a-fA-F]+$/.test(privateKey)) {
          toast.error('Invalid private key: Contains non-hexadecimal characters', {
            description: 'Private key should only contain 0-9 and a-f',
            duration: 5000,
          });
          return;
        }
        // Valid 64-char format, add 0x prefix for storage
        privateKey = '0x' + privateKey;
      } else if (privateKey.length === 66) {
        // Must start with 0x
        if (!privateKey.startsWith('0x')) {
          toast.error('Invalid private key: 66-character key must start with "0x"', {
            description: `Your key starts with: ${privateKey.substring(0, 4)}...`,
            duration: 5000,
          });
          return;
        }
        
        // Check if it contains only valid hex characters after 0x
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
      
      // Update with validated private key
      keys.hyperliquid.apiSecret = privateKey;
    }

    // Save sanitized keys
    storage.saveApiKeys({
      hyperliquid: {
        apiKey: sanitizedApiKey,
        apiSecret: keys.hyperliquid.apiSecret, // Already validated above
        walletAddress: sanitizedWalletAddress,
      },
      openRouter: sanitizedOpenRouter,
    });
    
    // Set mode to live to trigger balance fetching
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

            {backendKeysConfigured && (
              <div className="px-6 pb-4">
                <Alert className="bg-green-500/10 border-green-500/50">
                  <Info className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-200">
                    <strong>✅ Backend API Keys Detected</strong>
                    <p className="mt-2 text-sm">
                      Your OpenRouter and/or CryptoPanic API keys are configured in the backend environment (.env or Convex Dashboard).
                    </p>
                    <p className="mt-1 text-sm">
                      You can still add Hyperliquid keys below for trading, or use Demo Mode.
                    </p>
                    <p className="mt-2 text-xs text-yellow-300">
                      ⚠️ To change backend keys, update your .env file or Convex Dashboard environment variables.
                    </p>
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            <CardContent className="space-y-6">
              <Alert className="bg-green-500/10 border-green-500/50">
                <Info className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-200">
                  <strong>✅ RECOMMENDED: Use Hyperliquid Agent Wallet</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Agent wallets can trade but CANNOT withdraw funds</li>
                    <li>• Much safer than using your main wallet's private key</li>
                    <li>• Generate at <a href="https://app.hyperliquid.xyz/API" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">app.hyperliquid.xyz/API</a></li>
                    <li>• Valid for up to 180 days</li>
                    <li>• Can be revoked anytime from the Hyperliquid dashboard</li>
                    <li>• <strong className="text-yellow-300">⚠️ Use a separate/dedicated wallet for AI trading - never your main wallet!</strong></li>
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

                <Alert className="bg-purple-500/10 border-purple-500/50 mb-4">
                  <Info className="h-4 w-4 text-purple-500" />
                  <AlertDescription className="text-purple-200">
                    <strong>📋 STEP-BY-STEP: What Goes Where</strong>
                    <div className="mt-3 space-y-3 text-sm">
                      <div className="bg-black/30 p-3 rounded border border-cyan-500/30">
                        <p className="font-bold text-cyan-400 mb-1">STEP 1: Get Your Main Wallet Address</p>
                        <p className="text-gray-300">• Go to <a href="https://app.hyperliquid.xyz" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">app.hyperliquid.xyz</a></p>
                        <p className="text-gray-300">• Connect your wallet (MetaMask, etc.)</p>
                        <p className="text-gray-300">• Copy your wallet address (top right corner)</p>
                        <p className="text-yellow-300 mt-1">👉 Paste this in "Master Account Address" below</p>
                      </div>
                      
                      <div className="bg-black/30 p-3 rounded border border-green-500/30">
                        <p className="font-bold text-green-400 mb-1">STEP 2: Generate Agent Wallet</p>
                        <p className="text-gray-300">• Go to <a href="https://app.hyperliquid.xyz/API" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">app.hyperliquid.xyz/API</a></p>
                        <p className="text-gray-300">• Click "Generate" to create an agent wallet</p>
                        <p className="text-gray-300">• Set validity (up to 180 days)</p>
                        <p className="text-gray-300">• <strong className="text-red-400">IMPORTANT:</strong> Copy the Private Key (shown only once!)</p>
                        <p className="text-gray-300">• Click "Authorize" to complete</p>
                        <p className="text-yellow-300 mt-1">👉 Paste the Private Key in "Agent Wallet Private Key" below</p>
                      </div>
                      
                      <div className="bg-black/30 p-3 rounded border border-blue-500/30">
                        <p className="font-bold text-blue-400 mb-1">STEP 3: (Optional) Agent Wallet Address</p>
                        <p className="text-gray-300">• This is the NEW address Hyperliquid created when you clicked "Generate"</p>
                        <p className="text-gray-300">• It's different from your main wallet address</p>
                        <p className="text-gray-300">• Only needed for tracking purposes</p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label className="text-cyan-400 font-mono text-base font-bold">
                    1️⃣ Master Account Address (Your Main Wallet) *
                  </Label>
                  <Input
                    placeholder="Example: 0x1234...5678 (YOUR wallet address from app.hyperliquid.xyz)"
                    value={keys.hyperliquid.apiKey}
                    onChange={(e) => {
                      const sanitized = sanitizeWalletAddress(e.target.value);
                      setKeys({
                        ...keys,
                        hyperliquid: { ...keys.hyperliquid, apiKey: sanitized }
                      });
                    }}
                    className="bg-black/50 border-cyan-500/30 text-cyan-100 font-mono focus:border-cyan-500"
                  />
                  <div className="bg-cyan-500/10 p-2 rounded border border-cyan-500/30">
                    <p className="text-xs text-cyan-300 font-mono font-bold">
                      💰 This is YOUR main wallet address - where your PERPETUAL balance is stored
                    </p>
                    <p className="text-xs text-gray-400 font-mono mt-1">
                      • The address you use to login to Hyperliquid
                    </p>
                    <p className="text-xs text-gray-400 font-mono">
                      • Your perpetual wallet balance will be fetched from this address
                    </p>
                    <p className="text-xs text-gray-400 font-mono">
                      • Same as your MetaMask/connected wallet address
                    </p>
                    <p className="text-xs text-yellow-300 font-mono mt-1">
                      📍 Find it: Top right corner when connected to app.hyperliquid.xyz (or use the "Wallet" tab above)
                    </p>
                    <p className="text-xs text-purple-300 font-mono mt-1">
                      🌐 Supports: Ethereum & Arbitrum networks (balance auto-switches with network toggle)
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-cyan-400 font-mono text-base font-bold">
                    2️⃣ Agent Wallet Private Key (From Hyperliquid API Page) *
                  </Label>
                  <Input
                    type="password"
                    placeholder="Example: 0xabcd...ef01 (64-66 chars) - PRIVATE KEY, not address!"
                    value={keys.hyperliquid.apiSecret}
                    onChange={(e) => {
                      const sanitized = sanitizePrivateKey(e.target.value);
                      setKeys({
                        ...keys,
                        hyperliquid: { ...keys.hyperliquid, apiSecret: sanitized }
                      });
                    }}
                    className="bg-black/50 border-cyan-500/30 text-cyan-100 font-mono focus:border-cyan-500"
                  />
                  <div className="bg-green-500/10 p-2 rounded border border-green-500/30">
                    <p className="text-xs text-green-300 font-mono font-bold">
                      🔒 This is the PRIVATE KEY shown ONCE when you clicked "Generate"
                    </p>
                    <p className="text-xs text-yellow-300 font-mono mt-1">
                      ⚠️ Accepts: 64 characters (no prefix) OR 66 characters (0x + 64 hex digits)
                    </p>
                    <p className="text-xs text-red-300 font-mono mt-1">
                      ❌ NOT the 42-character wallet address! That goes in field #3 below.
                    </p>
                    {keys.hyperliquid.apiSecret && (
                      <p className={`text-xs font-mono mt-1 ${
                        keys.hyperliquid.apiSecret.trim().length === 64 || keys.hyperliquid.apiSecret.trim().length === 66 
                          ? 'text-green-400' 
                          : keys.hyperliquid.apiSecret.trim().length === 42
                          ? 'text-red-400 font-bold'
                          : 'text-red-400'
                      }`}>
                        Current length: {keys.hyperliquid.apiSecret.trim().length} characters {
                          keys.hyperliquid.apiSecret.trim().length === 64 || keys.hyperliquid.apiSecret.trim().length === 66 
                            ? '✅' 
                            : keys.hyperliquid.apiSecret.trim().length === 42
                            ? '❌ This is an ADDRESS, not a PRIVATE KEY!'
                            : '❌'
                        }
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-cyan-400 font-mono text-base text-gray-500">
                    3️⃣ Agent Wallet Address (Optional - Not Required)
                  </Label>
                  <Input
                    placeholder="Not needed - Leave empty (automatically derived from private key)"
                    value={keys.hyperliquid.walletAddress}
                    onChange={(e) => {
                      const sanitized = sanitizeWalletAddress(e.target.value);
                      setKeys({
                        ...keys,
                        hyperliquid: { ...keys.hyperliquid, walletAddress: sanitized }
                      });
                    }}
                    className="bg-black/50 border-cyan-500/30 text-cyan-100 font-mono focus:border-cyan-500 opacity-50"
                    disabled
                  />
                  <div className="bg-gray-500/10 p-2 rounded border border-gray-500/30">
                    <p className="text-xs text-gray-400 font-mono font-bold">
                      ℹ️ This field is NOT required - the agent address is automatically derived from the private key
                    </p>
                    <p className="text-xs text-gray-500 font-mono mt-1">
                      • You only need Fields 1 & 2 above to start trading
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      • The system will automatically use the correct agent wallet address
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-cyan-400 font-mono">OpenRouter API Key *</Label>
                  <Input
                    type="password"
                    placeholder="sk-or-v1-..."
                    value={keys.openRouter}
                    onChange={(e) => {
                      const sanitized = sanitizeApiKey(e.target.value);
                      setKeys({ ...keys, openRouter: sanitized });
                    }}
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

                <div className="space-y-2">
                  <Label className="text-cyan-400 font-mono">OpenRouter API Key (Optional)</Label>
                  <Input
                    type="password"
                    placeholder="sk-or-v1-... (optional for enhanced AI)"
                    value={keys.openRouter}
                    onChange={(e) => {
                      const sanitized = sanitizeApiKey(e.target.value);
                      setKeys({ ...keys, openRouter: sanitized });
                    }}
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
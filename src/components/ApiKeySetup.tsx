import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { storage, ApiKeys } from '@/lib/storage';
import { AlertTriangle, Key, Save, ExternalLink, Info } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ApiKeySetupProps {
  onComplete: () => void;
}

export function ApiKeySetup({ onComplete }: ApiKeySetupProps) {
  const [keys, setKeys] = useState<ApiKeys>({
    hyperliquid: { apiKey: '', apiSecret: '', walletAddress: '' },
    openRouter: '',
  });
  
  const handleSave = () => {
    if (!keys.hyperliquid.apiKey || !keys.openRouter) {
      toast.error('Please fill in all required API keys');
      return;
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
      <Card className="bg-black/90 border-cyan-500/50 shadow-[0_0_30px_rgba(0,255,255,0.3)]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Key className="h-8 w-8 text-cyan-400" />
            <div>
              <CardTitle className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'monospace' }}>
                API Configuration
              </CardTitle>
              <CardDescription className="text-gray-400">
                Secure browser-based credential storage
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert className="bg-yellow-500/10 border-yellow-500/50">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-200">
              Your API keys are stored locally in your browser and never sent to any server.
              Use read-only or trading-restricted API keys for maximum security.
            </AlertDescription>
          </Alert>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="hyperliquid-instructions" className="border-cyan-500/30">
              <AccordionTrigger className="text-cyan-400 font-mono hover:text-cyan-300">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  How to get Hyperliquid API Keys
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-300 space-y-3 pt-3">
                <div className="bg-black/50 border border-cyan-500/30 rounded p-4 space-y-3">
                  <p className="font-mono text-sm">
                    <strong className="text-cyan-400">Step 1:</strong> Visit{' '}
                    <a 
                      href="https://app.hyperliquid.xyz" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-1"
                    >
                      app.hyperliquid.xyz
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                  <p className="font-mono text-sm">
                    <strong className="text-cyan-400">Step 2:</strong> Connect your wallet (MetaMask, WalletConnect, etc.)
                  </p>
                  <p className="font-mono text-sm">
                    <strong className="text-cyan-400">Step 3:</strong> Go to Settings → API Keys
                  </p>
                  <p className="font-mono text-sm">
                    <strong className="text-cyan-400">Step 4:</strong> Create a new API key with trading permissions
                  </p>
                  <p className="font-mono text-sm">
                    <strong className="text-cyan-400">Step 5:</strong> Copy your API Key (public)
                  </p>
                  <p className="font-mono text-sm">
                    <strong className="text-cyan-400">Step 6:</strong> For the API Secret, use your wallet's private key (the one you use to sign transactions)
                  </p>
                  <Alert className="bg-red-500/10 border-red-500/50 mt-3">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-200 text-xs">
                      <strong>CRITICAL SECURITY:</strong> The API Secret is your wallet's private key (starts with "0x", 66 characters). 
                      This key has FULL CONTROL over your funds. Never share it with anyone. 
                      It's the same private key you exported from MetaMask or your wallet provider.
                    </AlertDescription>
                  </Alert>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="openrouter-instructions" className="border-cyan-500/30">
              <AccordionTrigger className="text-cyan-400 font-mono hover:text-cyan-300">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  How to get OpenRouter API Key
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-300 space-y-3 pt-3">
                <div className="bg-black/50 border border-cyan-500/30 rounded p-4 space-y-3">
                  <p className="font-mono text-sm">
                    <strong className="text-cyan-400">Step 1:</strong> Visit{' '}
                    <a 
                      href="https://openrouter.ai" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-1"
                    >
                      openrouter.ai
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                  <p className="font-mono text-sm">
                    <strong className="text-cyan-400">Step 2:</strong> Sign up or log in to your account
                  </p>
                  <p className="font-mono text-sm">
                    <strong className="text-cyan-400">Step 3:</strong> Go to Keys section in your dashboard
                  </p>
                  <p className="font-mono text-sm">
                    <strong className="text-cyan-400">Step 4:</strong> Create a new API key
                  </p>
                  <p className="font-mono text-sm">
                    <strong className="text-cyan-400">Step 5:</strong> Add credits to your account (required for AI analysis)
                  </p>
                  <Alert className="bg-blue-500/10 border-blue-500/50 mt-3">
                    <Info className="h-4 w-4 text-blue-400" />
                    <AlertDescription className="text-blue-200 text-xs">
                      <strong>NOTE:</strong> OpenRouter provides access to DeepSeek AI for market analysis. 
                      You'll need to add credits to your account to use the AI features.
                    </AlertDescription>
                  </Alert>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <div className="space-y-4">
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
          
          <Button
            onClick={handleSave}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold font-mono shadow-[0_0_20px_rgba(0,255,255,0.5)]"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Configuration
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
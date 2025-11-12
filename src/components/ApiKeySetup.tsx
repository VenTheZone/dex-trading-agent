import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { storage, ApiKeys } from '@/lib/storage';
import { AlertTriangle, Key, Save } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

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
      className="max-w-2xl mx-auto p-6"
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
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-cyan-400 font-mono">Hyperliquid API Key</Label>
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
              <Label className="text-cyan-400 font-mono">Hyperliquid API Secret</Label>
              <Input
                type="password"
                placeholder="Enter Hyperliquid API Secret"
                value={keys.hyperliquid.apiSecret}
                onChange={(e) => setKeys({
                  ...keys,
                  hyperliquid: { ...keys.hyperliquid, apiSecret: e.target.value }
                })}
                className="bg-black/50 border-cyan-500/30 text-cyan-100 font-mono focus:border-cyan-500"
              />
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
            </div>
            
            <div className="space-y-2">
              <Label className="text-cyan-400 font-mono">OpenRouter API Key</Label>
              <Input
                type="password"
                placeholder="Enter OpenRouter API Key"
                value={keys.openRouter}
                onChange={(e) => setKeys({ ...keys, openRouter: e.target.value })}
                className="bg-black/50 border-cyan-500/30 text-cyan-100 font-mono focus:border-cyan-500"
              />
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

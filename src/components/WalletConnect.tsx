import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface WalletConnectProps {
  onConnect: (address: string) => void;
}

export function WalletConnect({ onConnect }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      if (typeof window.ethereum === 'undefined') {
        toast.error('Please install MetaMask or another Web3 wallet');
        return;
      }

      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        setConnectedAddress(address);
        onConnect(address);
        toast.success(`Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
      }
    } catch (error: any) {
      toast.error(`Failed to connect wallet: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className="bg-black/90 border-cyan-500/50 shadow-[0_0_30px_rgba(0,255,255,0.3)]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Wallet className="h-8 w-8 text-cyan-400" />
            <div>
              <CardTitle className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'monospace' }}>
                Connect Wallet
              </CardTitle>
              <CardDescription className="text-gray-400">
                Safe monitoring - No private key required
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert className="bg-blue-500/10 border-blue-500/50">
            <AlertTriangle className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-200">
              Wallet connection provides read-only access. For automated trading, you'll need to enter API keys.
            </AlertDescription>
          </Alert>

          {connectedAddress ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/50 rounded">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <div className="flex-1">
                  <p className="text-green-400 font-mono font-bold">Wallet Connected</p>
                  <p className="text-sm text-gray-400 font-mono">
                    {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
                  </p>
                </div>
              </div>
              
              <Alert className="bg-cyan-500/10 border-cyan-500/50">
                <Info className="h-4 w-4 text-cyan-400" />
                <AlertDescription className="text-cyan-200">
                  <strong>✅ You can now:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• View your Hyperliquid positions</li>
                    <li>• Monitor your account balance</li>
                    <li>• Track P&L in real-time</li>
                  </ul>
                  <p className="mt-3 text-xs text-cyan-300">
                    💡 For automated AI trading, switch to the "API Keys" tab
                  </p>
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <Button
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold font-mono shadow-[0_0_20px_rgba(0,255,255,0.5)]"
            >
              <Wallet className="mr-2 h-4 w-4" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
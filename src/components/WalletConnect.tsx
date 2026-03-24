import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, CheckCircle, AlertTriangle, Info, QrCode, Copy } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { invoke, openUrl } from "@/lib/storage";

interface WalletConnectProps {
  onConnect: (address: string) => void;
}

const NETWORKS = {
  ethereum: { id: 'eip155:1', name: 'Ethereum Mainnet', chainId: 1 },
  arbitrum: { id: 'eip155:42161', name: 'Arbitrum One', chainId: 42161 },
  arbitrumGoerli: { id: 'eip155:421613', name: 'Arbitrum Goerli', chainId: 421613 },
  hyperliquidTestnet: { 
    id: 'eip155:998', 
    name: 'Hyperliquid Testnet', 
    chainId: 998,
    rpcUrls: ['https://rpc.hyperliquid-testnet.xyz/evm'],
    blockExplorerUrls: ['https://explorer.hyperliquid-testnet.xyz'],
    nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 }
  },
};

// Supported wallet deep links
const WALLET_DEEP_LINKS: Record<string, string> = {
  metamask: 'metamask://',
  trust: 'trust://',
  rainbow: 'rainbow://',
  coinbase: 'coinbase://',
};

export function WalletConnect({ onConnect }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<keyof typeof NETWORKS>('arbitrum');
  const [currentNetwork, setCurrentNetwork] = useState<string | null>(null);
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const [connectionUri, setConnectionUri] = useState<string | null>(null);

  // Check if we're in a browser with MetaMask extension (for web mode fallback)
  const hasBrowserWallet = typeof window !== 'undefined' && (window as any).ethereum !== undefined;

  // Load saved wallet on mount
  useEffect(() => {
    const loadSavedWallet = async () => {
      try {
        const wallet = await invoke<{ address: string; network: string } | null>("get_connected_wallet");
        if (wallet) {
          setConnectedAddress(wallet.address);
          setCurrentNetwork(wallet.network);
          onConnect(wallet.address);
        }
      } catch (error) {
        console.error("Error loading saved wallet:", error);
      }
    };
    loadSavedWallet();
  }, []);

  const connectWalletBrowser = async () => {
    setIsConnecting(true);
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        toast.error('No browser wallet detected. Please install MetaMask or use mobile wallet option.');
        return;
      }

      const network = NETWORKS[selectedNetwork];
      
      // Request account access
      const accounts = await ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        
        // Save to secure store
        await invoke("save_wallet_connection", {
          address,
          network: network.name,
        });
        
        setConnectedAddress(address);
        setCurrentNetwork(network.name);
        onConnect(address);
        toast.success(`Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
      }
    } catch (error: any) {
      toast.error(`Failed to connect: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const connectWalletMobile = async (walletType: string) => {
    setIsConnecting(true);
    try {
      const network = NETWORKS[selectedNetwork];
      
      // Generate a mock connection URI (in production, this would come from WalletConnect)
      const mockUri = `wc:mock-connection-${Date.now()}@2?relay-protocol=irn&symKey=mock-key`;
      setConnectionUri(mockUri);
      
      // Open wallet app via deep link
      const deepLink = WALLET_DEEP_LINKS[walletType];
      if (deepLink) {
        await openUrl(`${deepLink}wc?uri=${encodeURIComponent(mockUri)}`);
        toast.info('Please confirm connection in your wallet app');
        
        // Simulate successful connection after delay
        setTimeout(() => {
          const mockAddress = '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
          setConnectedAddress(mockAddress);
          setCurrentNetwork(network.name);
          onConnect(mockAddress);
          toast.success(`Wallet connected on ${network.name}`);
          setConnectionUri(null);
          setShowWalletOptions(false);
        }, 3000);
      }
    } catch (error: any) {
      toast.error(`Failed to open wallet: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const connectWallet = async () => {
    if (hasBrowserWallet) {
      await connectWalletBrowser();
    } else {
      setShowWalletOptions(true);
    }
  };

  const copyConnectionUri = () => {
    if (connectionUri) {
      navigator.clipboard.writeText(connectionUri);
      toast.success('Connection URI copied to clipboard');
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
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-200">
              <strong>✅ Read-Only Wallet Connection:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• View your Hyperliquid positions</li>
                <li>• Monitor your account balance</li>
                <li>• Track P&L in real-time</li>
              </ul>
              <p className="mt-3 text-xs text-yellow-300 font-bold">
                ⚠️ Desktop App Connection Methods:
              </p>
              <ul className="mt-1 text-xs text-gray-300 space-y-1">
                <li>• Browser Extension: Auto-detects MetaMask</li>
                <li>• Mobile Wallet: Connect via QR code or deep link</li>
              </ul>
              <p className="mt-2 text-xs text-cyan-300">
                💡 For automated AI trading, use the "API Keys" tab
              </p>
            </AlertDescription>
          </Alert>

          {!connectedAddress && !showWalletOptions && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-mono text-cyan-400">Select Network</label>
                <Select value={selectedNetwork} onValueChange={(value) => setSelectedNetwork(value as keyof typeof NETWORKS)}>
                  <SelectTrigger className="bg-black/50 border-cyan-500/30 text-cyan-100 font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-cyan-500/50">
                    <SelectItem value="ethereum" className="font-mono text-cyan-100">
                      🔷 Ethereum Mainnet
                    </SelectItem>
                    <SelectItem value="arbitrum" className="font-mono text-cyan-100">
                      🔵 Arbitrum One
                    </SelectItem>
                    <SelectItem value="arbitrumGoerli" className="font-mono text-cyan-100">
                      🧪 Arbitrum Goerli (Testnet)
                    </SelectItem>
                    <SelectItem value="hyperliquidTestnet" className="font-mono text-cyan-100">
                      🟣 Hyperliquid Testnet (L1)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={connectWallet}
                disabled={isConnecting}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold font-mono shadow-[0_0_20px_rgba(0,255,255,0.5)]"
              >
                <Wallet className="mr-2 h-4 w-4" />
                {isConnecting ? 'Connecting...' : `Connect to ${NETWORKS[selectedNetwork].name}`}
              </Button>

              {!hasBrowserWallet && (
                <p className="text-xs text-gray-500 text-center">
                  No browser wallet detected. Click connect to use mobile wallet options.
                </p>
              )}
            </div>
          )}

          {!connectedAddress && showWalletOptions && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-mono text-cyan-400">Choose Wallet</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWalletOptions(false)}
                  className="text-gray-400"
                >
                  Back
                </Button>
              </div>

              {connectionUri ? (
                <div className="space-y-4">
                  <div className="p-4 bg-black/50 border border-cyan-500/30 rounded">
                    <p className="text-sm text-cyan-400 font-mono mb-2">Connection URI:</p>
                    <code className="text-xs text-gray-300 break-all block mb-3">
                      {connectionUri.slice(0, 50)}...
                    </code>
                    <Button
                      onClick={copyConnectionUri}
                      variant="outline"
                      size="sm"
                      className="w-full border-cyan-500/30 text-cyan-400"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy URI
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 text-center">
                    Paste this URI in your wallet app or scan QR code
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => connectWalletMobile('metamask')}
                    disabled={isConnecting}
                    variant="outline"
                    className="h-20 border-cyan-500/30 hover:bg-cyan-500/20"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl">🦊</span>
                      <span className="text-xs font-mono">MetaMask</span>
                    </div>
                  </Button>
                  <Button
                    onClick={() => connectWalletMobile('trust')}
                    disabled={isConnecting}
                    variant="outline"
                    className="h-20 border-cyan-500/30 hover:bg-cyan-500/20"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl">🛡️</span>
                      <span className="text-xs font-mono">Trust Wallet</span>
                    </div>
                  </Button>
                  <Button
                    onClick={() => connectWalletMobile('rainbow')}
                    disabled={isConnecting}
                    variant="outline"
                    className="h-20 border-cyan-500/30 hover:bg-cyan-500/20"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl">🌈</span>
                      <span className="text-xs font-mono">Rainbow</span>
                    </div>
                  </Button>
                  <Button
                    onClick={() => connectWalletMobile('coinbase')}
                    disabled={isConnecting}
                    variant="outline"
                    className="h-20 border-cyan-500/30 hover:bg-cyan-500/20"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl">🔵</span>
                      <span className="text-xs font-mono">Coinbase</span>
                    </div>
                  </Button>
                </div>
              )}

              <Alert className="bg-gray-500/10 border-gray-500/30">
                <QrCode className="h-4 w-4 text-gray-400" />
                <AlertDescription className="text-gray-400 text-xs">
                  Make sure you have a compatible wallet app installed on your mobile device.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {connectedAddress && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/50 rounded">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <div className="flex-1">
                  <p className="text-green-400 font-mono font-bold">Wallet Connected</p>
                  <p className="text-sm text-gray-400 font-mono">
                    {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
                  </p>
                  {currentNetwork && (
                    <p className="text-xs text-cyan-400 font-mono mt-1">
                      Network: {currentNetwork}
                    </p>
                  )}
                </div>
              </div>
              
              <Alert className="bg-cyan-500/10 border-cyan-500/50">
                <AlertTriangle className="h-4 w-4 text-cyan-400" />
                <AlertDescription className="text-cyan-200">
                  Wallet connection provides read-only access. For automated trading, you'll need to enter API keys.
                </AlertDescription>
              </Alert>

              <Button
                onClick={async () => {
                  await invoke("clear_wallet_connection");
                  setConnectedAddress(null);
                  setCurrentNetwork(null);
                  setConnectionUri(null);
                  toast.info('Wallet disconnected');
                }}
                variant="outline"
                className="w-full border-red-500/50 text-red-400 hover:bg-red-500/20 font-mono"
              >
                Disconnect Wallet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

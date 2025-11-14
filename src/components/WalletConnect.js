import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
const NETWORKS = {
    ethereum: { id: '0x1', name: 'Ethereum Mainnet', chainId: 1 },
    arbitrum: { id: '0xa4b1', name: 'Arbitrum One', chainId: 42161 },
    arbitrumGoerli: { id: '0x66eed', name: 'Arbitrum Goerli', chainId: 421613 },
    hyperliquidTestnet: {
        id: '0x3e6',
        name: 'Hyperliquid Testnet',
        chainId: 998,
        rpcUrls: ['https://rpc.hyperliquid-testnet.xyz/evm'],
        blockExplorerUrls: ['https://explorer.hyperliquid-testnet.xyz'],
        nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 }
    },
};
export function WalletConnect({ onConnect }) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectedAddress, setConnectedAddress] = useState(null);
    const [selectedNetwork, setSelectedNetwork] = useState('arbitrum');
    const [currentNetwork, setCurrentNetwork] = useState(null);
    const switchNetwork = async (networkKey) => {
        try {
            if (typeof window.ethereum === 'undefined') {
                toast.error('Please install MetaMask or another Web3 wallet');
                return false;
            }
            const network = NETWORKS[networkKey];
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: network.id }],
                });
                setCurrentNetwork(network.name);
                toast.success(`Switched to ${network.name}`);
                return true;
            }
            catch (switchError) {
                // This error code indicates that the chain has not been added to MetaMask
                if (switchError.code === 4902) {
                    try {
                        const chainParams = {
                            chainId: network.id,
                            chainName: network.name,
                        };
                        if (networkKey === 'hyperliquidTestnet') {
                            chainParams.rpcUrls = ['https://rpc.hyperliquid-testnet.xyz/evm'];
                            chainParams.nativeCurrency = { name: 'HYPE', symbol: 'HYPE', decimals: 18 };
                            chainParams.blockExplorerUrls = ['https://explorer.hyperliquid-testnet.xyz'];
                        }
                        else if (networkKey === 'arbitrum') {
                            chainParams.rpcUrls = ['https://arb1.arbitrum.io/rpc'];
                            chainParams.nativeCurrency = { name: 'ETH', symbol: 'ETH', decimals: 18 };
                            chainParams.blockExplorerUrls = ['https://arbiscan.io'];
                        }
                        else if (networkKey === 'arbitrumGoerli') {
                            chainParams.rpcUrls = ['https://goerli-rollup.arbitrum.io/rpc'];
                            chainParams.nativeCurrency = { name: 'ETH', symbol: 'ETH', decimals: 18 };
                            chainParams.blockExplorerUrls = ['https://goerli.arbiscan.io'];
                        }
                        else {
                            chainParams.rpcUrls = ['https://mainnet.infura.io/v3/'];
                            chainParams.nativeCurrency = { name: 'ETH', symbol: 'ETH', decimals: 18 };
                            chainParams.blockExplorerUrls = ['https://etherscan.io'];
                        }
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [chainParams],
                        });
                        setCurrentNetwork(network.name);
                        toast.success(`Added and switched to ${network.name}`);
                        return true;
                    }
                    catch (addError) {
                        toast.error(`Failed to add network: ${addError.message}`);
                        return false;
                    }
                }
                toast.error(`Failed to switch network: ${switchError.message}`);
                return false;
            }
        }
        catch (error) {
            toast.error(`Network switch error: ${error.message}`);
            return false;
        }
    };
    const connectWallet = async () => {
        setIsConnecting(true);
        try {
            if (typeof window.ethereum === 'undefined') {
                toast.error('Please install MetaMask or another Web3 wallet');
                return;
            }
            // First switch to selected network
            const switched = await switchNetwork(selectedNetwork);
            if (!switched) {
                setIsConnecting(false);
                return;
            }
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            if (accounts && accounts.length > 0) {
                const address = accounts[0];
                setConnectedAddress(address);
                onConnect(address);
                toast.success(`Wallet connected on ${NETWORKS[selectedNetwork].name}: ${address.slice(0, 6)}...${address.slice(-4)}`);
            }
        }
        catch (error) {
            toast.error(`Failed to connect wallet: ${error.message}`);
        }
        finally {
            setIsConnecting(false);
        }
    };
    return (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
      <Card className="bg-black/90 border-cyan-500/50 shadow-[0_0_30px_rgba(0,255,255,0.3)]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Wallet className="h-8 w-8 text-cyan-400"/>
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
            <Info className="h-4 w-4 text-blue-500"/>
            <AlertDescription className="text-blue-200">
              <strong>✅ Read-Only Wallet Connection:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• View your Hyperliquid positions</li>
                <li>• Monitor your account balance</li>
                <li>• Track P&L in real-time</li>
              </ul>
              <p className="mt-3 text-xs text-yellow-300 font-bold">
                ⚠️ Note: Hyperliquid uses a dual-chain architecture
              </p>
              <p className="mt-1 text-xs text-gray-300">
                • Trading: Hyperliquid L1 (Chain ID 998)<br />
                • Deposits: Arbitrum One (USDC bridge)
              </p>
              <p className="mt-2 text-xs text-cyan-300">
                💡 For automated AI trading, use the "API Keys" tab
              </p>
            </AlertDescription>
          </Alert>

          {!connectedAddress && (<div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-mono text-cyan-400">Select Network</label>
                <Select value={selectedNetwork} onValueChange={(value) => setSelectedNetwork(value)}>
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

              <Button onClick={connectWallet} disabled={isConnecting} className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold font-mono shadow-[0_0_20px_rgba(0,255,255,0.5)]">
                <Wallet className="mr-2 h-4 w-4"/>
                {isConnecting ? 'Connecting...' : `Connect to ${NETWORKS[selectedNetwork].name}`}
              </Button>
            </div>)}

          {connectedAddress && (<div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/50 rounded">
                <CheckCircle className="h-6 w-6 text-green-400"/>
                <div className="flex-1">
                  <p className="text-green-400 font-mono font-bold">Wallet Connected</p>
                  <p className="text-sm text-gray-400 font-mono">
                    {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
                  </p>
                  {currentNetwork && (<p className="text-xs text-cyan-400 font-mono mt-1">
                      Network: {currentNetwork}
                    </p>)}
                </div>
              </div>
              
              <Alert className="bg-cyan-500/10 border-cyan-500/50">
                <AlertTriangle className="h-4 w-4 text-cyan-400"/>
                <AlertDescription className="text-cyan-200">
                  Wallet connection provides read-only access. For automated trading, you'll need to enter API keys.
                </AlertDescription>
              </Alert>

              <Button onClick={() => {
                setConnectedAddress(null);
                setCurrentNetwork(null);
                toast.info('Wallet disconnected');
            }} variant="outline" className="w-full border-red-500/50 text-red-400 hover:bg-red-500/20 font-mono">
                Disconnect Wallet
              </Button>
            </div>)}
        </CardContent>
      </Card>
    </motion.div>);
}

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface TradeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tradeDetails: {
    symbol: string;
    action: string;
    side?: 'long' | 'short';
    price: number;
    size: number;
    stopLoss?: number;
    takeProfit?: number;
    leverage: number;
    mode: 'paper' | 'live';
    network: 'mainnet' | 'testnet';
  };
}

export function TradeConfirmationModal({ isOpen, onClose, onConfirm, tradeDetails }: TradeConfirmationModalProps) {
  const isLive = tradeDetails.mode === 'live';
  const totalValue = tradeDetails.price * tradeDetails.size * tradeDetails.leverage;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/95 border-cyan-500/50 text-cyan-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-cyan-400 font-mono text-xl flex items-center gap-2">
            {isLive && <AlertTriangle className="h-5 w-5 text-red-400" />}
            Confirm Trade Execution
          </DialogTitle>
          <DialogDescription className="text-gray-400 font-mono">
            Review the trade details before execution
          </DialogDescription>
        </DialogHeader>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 py-4"
        >
          {/* Mode Warning */}
          {isLive && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-400 text-sm font-mono flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                LIVE TRADING - Real funds will be used
              </p>
            </div>
          )}
          
          {/* Trade Details */}
          <div className="space-y-3 bg-black/50 border border-cyan-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-mono text-sm">Symbol</span>
              <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 font-mono">
                {tradeDetails.symbol}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-mono text-sm">Action</span>
              <Badge 
                variant={tradeDetails.side === 'long' ? 'default' : 'destructive'}
                className="font-mono"
              >
                {tradeDetails.side === 'long' ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {tradeDetails.action.toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-mono text-sm">Price</span>
              <span className="text-cyan-100 font-mono font-bold">
                ${tradeDetails.price.toLocaleString()}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-mono text-sm">Size</span>
              <span className="text-cyan-100 font-mono font-bold">
                {tradeDetails.size}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-mono text-sm">Leverage</span>
              <span className="text-cyan-100 font-mono font-bold">
                {tradeDetails.leverage}x
              </span>
            </div>
            
            <div className="flex items-center justify-between border-t border-cyan-500/30 pt-3">
              <span className="text-gray-400 font-mono text-sm">Total Value</span>
              <span className="text-cyan-400 font-mono font-bold text-lg">
                ${totalValue.toLocaleString()}
              </span>
            </div>
            
            {tradeDetails.stopLoss && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-mono text-sm">Stop Loss</span>
                <span className="text-red-400 font-mono">
                  ${tradeDetails.stopLoss.toLocaleString()}
                </span>
              </div>
            )}
            
            {tradeDetails.takeProfit && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-mono text-sm">Take Profit</span>
                <span className="text-green-400 font-mono">
                  ${tradeDetails.takeProfit.toLocaleString()}
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-mono text-sm">Network</span>
              <Badge 
                variant="outline"
                className={tradeDetails.network === 'mainnet' 
                  ? 'border-purple-500/50 text-purple-400' 
                  : 'border-blue-500/50 text-blue-400'
                }
              >
                {tradeDetails.network.toUpperCase()}
              </Badge>
            </div>
          </div>
        </motion.div>
        
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 font-mono"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className={`font-mono font-bold ${
              isLive 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-cyan-500 hover:bg-cyan-600 text-black'
            }`}
          >
            {isLive ? '⚠️ Execute Live Trade' : 'Execute Paper Trade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
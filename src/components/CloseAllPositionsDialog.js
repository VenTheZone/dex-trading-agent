import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';
export function CloseAllPositionsDialog({ isOpen, onClose, onConfirm, positionCount, mode, }) {
    return (<AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-black/95 border-red-500/50 text-cyan-100">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-400 font-mono text-xl flex items-center gap-2">
            <AlertTriangle className="h-5 w-5"/>
            Close All Positions?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400 font-mono">
            This action will close all {positionCount} open position{positionCount !== 1 ? 's' : ''}.
            {mode === 'live' && (<span className="block mt-2 text-red-400 font-bold">
                ⚠️ WARNING: This will execute LIVE trades on Hyperliquid!
              </span>)}
            {mode === 'demo' && (<span className="block mt-2 text-cyan-400">
                Demo mode: This will close simulated positions only.
              </span>)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 font-mono">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={`font-mono font-bold ${mode === 'live'
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-cyan-500 hover:bg-cyan-600 text-black'}`}>
            {mode === 'live' ? '⚠️ Close All (LIVE)' : mode === 'demo' ? 'Close All (Demo)' : 'Close All Positions'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>);
}

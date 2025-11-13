import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTradingStore } from '@/store/tradingStore';
import { Brain, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AiThoughtsPanel() {
  const { isAiThinking, aiThoughts } = useTradingStore();

  return (
    <Card className="bg-black/80 border-cyan-500/50 shadow-[0_0_20px_rgba(0,255,255,0.2)] h-full">
      <CardHeader className="border-b border-cyan-500/30 pb-3">
        <CardTitle className="text-cyan-400 font-mono flex items-center gap-2 text-sm">
          <Brain className="h-4 w-4" />
          AI Thoughts
          <AnimatePresence>
            {isAiThinking && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1 ml-auto"
              >
                <Loader2 className="h-3 w-3 animate-spin text-green-400" />
                <span className="text-xs text-green-400 font-bold">ANALYZING...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <ScrollArea className="h-[400px] pr-4">
          <AnimatePresence mode="wait">
            {aiThoughts ? (
              <motion.div
                key="thoughts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <pre className="text-xs text-cyan-100 font-mono whitespace-pre-wrap leading-relaxed">
                  {aiThoughts}
                </pre>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full text-center py-12"
              >
                <Brain className="h-12 w-12 text-cyan-500/30 mb-4" />
                <p className="text-sm text-gray-500 font-mono">
                  {isAiThinking 
                    ? 'AI is analyzing market data...' 
                    : 'Enable auto-trading to see AI analysis'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

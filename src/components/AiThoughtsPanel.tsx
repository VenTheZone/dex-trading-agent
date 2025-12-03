import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Loader2 } from "lucide-react";
import { useTradingStore } from "@/store/tradingStore";
import { useEffect, useRef } from "react";

export function AiThoughtsPanel() {
  const { aiThoughts, isAiThinking } = useTradingStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when thoughts update
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [aiThoughts]);

  if (!aiThoughts && !isAiThinking) return null;

  return (
    <Card className="w-full bg-black/40 border-cyan-500/30 backdrop-blur-sm mt-4">
      <CardHeader className="pb-2 border-b border-cyan-500/20">
        <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
          {isAiThinking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Brain className="h-4 w-4" />
          )}
          AI Agent Thoughts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[200px] w-full p-4" ref={scrollRef}>
          <div className="font-mono text-xs text-cyan-100/80 whitespace-pre-wrap leading-relaxed">
            {aiThoughts || "Waiting for analysis..."}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
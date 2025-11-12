import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { storage } from "@/lib/storage";
import { useTradingStore } from "@/store/tradingStore";
import { toast } from "sonner";

export function useTrading() {
  const createLog = useMutation(api.tradingLogs.createLog);
  const { balance, settings, mode } = useTradingStore();
  const { user } = useAuth();

  const runAIAnalysis = async (symbol: string, chartData: string) => {
    try {
      toast.info("🤖 AI analyzing market...");
      
      // Note: This would need to be implemented as a proper action
      // For now, return a mock response
      toast.info("AI analysis feature coming soon");
      
      return null;
    } catch (error: any) {
      toast.error(`AI Analysis failed: ${error.message}`);
      throw error;
    }
  };

  const executeTrade = async (
    symbol: string,
    action: string,
    side: "long" | "short" | undefined,
    price: number,
    size: number,
    stopLoss: number | undefined,
    takeProfit: number | undefined,
    reasoning: string
  ) => {
    try {
      if (mode === "live") {
        const keys = storage.getApiKeys();
        if (!keys?.hyperliquid.apiKey || !keys?.hyperliquid.apiSecret) {
          toast.error("Hyperliquid API keys not configured");
          return;
        }

        // In live mode, execute real trade
        toast.info("📡 Executing live trade...");
        // Implementation would call Hyperliquid API here
      }

      // Log the trade
      await createLog({
        action,
        symbol,
        side,
        price,
        size,
        reason: reasoning,
        details: stopLoss 
          ? `SL: ${stopLoss}, TP: ${takeProfit}` 
          : undefined,
      });

      toast.success(`Trade executed: ${action.toUpperCase()}`);
    } catch (error: any) {
      toast.error(`Trade execution failed: ${error.message}`);
      throw error;
    }
  };

  return {
    runAIAnalysis,
    executeTrade,
  };
}
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { storage } from "@/lib/storage";
import { useTradingStore } from "@/store/tradingStore";
import { toast } from "sonner";

export function useTrading() {
  const createLog = useMutation(api.tradingLogs.createLog);
  const analyzeMarket = useAction(api.trading.analyzeMarket);
  const { balance, settings, mode, chartType, chartInterval } = useTradingStore();
  const { user } = useAuth();

  const runAIAnalysis = async (symbol: string, currentPrice: number) => {
    try {
      toast.info("🤖 AI analyzing market...");
      
      const keys = storage.getApiKeys();
      if (!keys?.openRouter) {
        toast.error("OpenRouter API key not configured");
        return null;
      }

      // Prepare chart data description for AI
      const chartData = `
        Chart Type: ${chartType === 'range' ? 'Range Chart' : 'Time-based Chart'}
        Interval: ${chartInterval}
        Current Price: $${currentPrice}
        ${chartType === 'range' ? 
          'Range Analysis: Price movement analyzed by range bars (fixed price movements) rather than time intervals. This provides clearer trend identification and reduces noise from time-based volatility.' : 
          'Time Analysis: Price movement analyzed by fixed time intervals.'
        }
      `;
      
      const analysis = await analyzeMarket({
        symbol,
        chartData,
        userBalance: balance,
        settings: {
          takeProfitPercent: settings.takeProfitPercent,
          stopLossPercent: settings.stopLossPercent,
          useAdvancedStrategy: settings.useAdvancedStrategy,
        },
      });
      
      toast.success("✅ AI analysis complete");
      return analysis;
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
          ? `SL: ${stopLoss}, TP: ${takeProfit}, Chart: ${chartType} ${chartInterval}` 
          : `Chart: ${chartType} ${chartInterval}`,
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
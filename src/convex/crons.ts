import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run AI analysis every 5 minutes for auto-trading
crons.interval(
  "ai_trading_analysis",
  { minutes: 5 },
  (internal as any).trading.scheduledAIAnalysis,
  {}
);

export default crons;
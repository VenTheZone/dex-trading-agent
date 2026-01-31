"""
Trading Service - AI-powered market analysis
Handles AI analysis for single and multi-chart scenarios
"""

import logging
from typing import Optional, List, Dict, Any
import json

logger = logging.getLogger(__name__)

class TradingService:
    """Service for AI-powered trading analysis"""
    
    def __init__(self):
        self.base_url = "https://openrouter.ai/api/v1"
    
    async def analyze_market_single_chart(
        self,
        api_key: str,
        symbol: str,
        chart_data: str,
        user_balance: float,
        settings: dict,
        is_demo_mode: bool = False,
        ai_model: str = "deepseek/deepseek-chat-v3-0324:free",
        custom_prompt: Optional[str] = None,
    ) -> dict:
        """Analyze market using AI for a single chart"""
        try:
            headers = {
                "Content-Type": "application/json",
                "HTTP-Referer": "https://dex-trading-agent.local",
                "X-Title": "DeX Trading Agent Demo" if is_demo_mode else "DeX Trading Agent",
                "Authorization": f"Bearer {api_key}",
            }
            
            # Build the prompt
            tp = settings.get("takeProfitPercent", 50)
            sl = settings.get("stopLossPercent", 10)
            leverage = settings.get("leverage", 3)
            strategy = "advanced" if settings.get("useAdvancedStrategy") else "basic"
            
            prompt = custom_prompt or f"""
You are an expert cryptocurrency trading analyst specializing in perpetual futures on Hyperliquid.

Analyze the chart data for {symbol} and provide trading signals based on:
- Current market structure and trend
- Risk management (max {sl}% stop loss, {tp}% take profit target)
- Position sizing appropriate for ${user_balance} account
- Recommended leverage: {leverage}x (or suggest better if analysis supports)

Respond in JSON format:
{{
    "action": "open_long" | "open_short" | "close" | "hold",
    "confidence": 0.0-1.0,
    "reasoning": "detailed analysis",
    "entryPrice": float,
    "stopLoss": float,
    "takeProfit": float,
    "positionSize": float (as % of account),
    "liquidationPrice": float (optional),
    "riskRewardRatio": float (optional)
}}
"""

            payload = {
                "model": ai_model,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a professional crypto trading analyst. Always respond in valid JSON format."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.3,
                "max_tokens": 1000
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"AI API error: {error_text}")
                        return self._mock_analysis(symbol, user_balance)
                    
                    data = await response.json()
                    content = data["choices"][0]["message"]["content"]
                    
                    # Parse JSON response
                    try:
                        analysis = json.loads(content)
                        return self._normalize_analysis(analysis, symbol)
                    except json.JSONDecodeError:
                        # If JSON parsing fails, return mock
                        logger.warning("Failed to parse AI response as JSON, using mock")
                        return self._mock_analysis(symbol, user_balance)
                        
        except Exception as e:
            logger.error(f"Error in AI analysis: {e}")
            return self._mock_analysis(symbol, user_balance)
    
    async def analyze_market_multi_chart(
        self,
        api_key: str,
        charts: List[dict],
        user_balance: float,
        settings: dict,
        is_demo_mode: bool = False,
        ai_model: str = "deepseek/deepseek-chat-v3-0324:free",
        custom_prompt: Optional[str] = None,
    ) -> dict:
        """Analyze market using AI across multiple charts"""
        try:
            if not charts:
                return self._mock_analysis("BTC", user_balance)
            
            # Build context from multiple charts
            symbols = [c.get("symbol", "UNKNOWN") for c in charts]
            symbol_list = ", ".join(symbols)
            
            headers = {
                "Content-Type": "application/json",
                "HTTP-Referer": "https://dex-trading-agent.local",
                "X-Title": "DeX Trading Agent Demo" if is_demo_mode else "DeX Trading Agent",
                "Authorization": f"Bearer {api_key}",
            }
            
            # Build the prompt
            tp = settings.get("takeProfitPercent", 50)
            sl = settings.get("stopLossPercent", 10)
            leverage = settings.get("leverage", 3)
            
            charts_context = "\n\n".join([
                f"Symbol: {c.get('symbol')}\n"
                f"Current Price: ${c.get('currentPrice', 'N/A')}\n"
                f"Chart Type: {c.get('chartType', 'N/A')}\n"
                f"Technical Context: {c.get('technicalContext', 'N/A')}\n"
                f"Mark Price: ${c.get('markPrice', 'N/A')}\n"
                f"Funding Rate: {c.get('fundingRate', 'N/A')}\n"
                for c in charts
            ])
            
            prompt = custom_prompt or f"""
You are an expert cryptocurrency trading analyst specializing in perpetual futures on Hyperliquid.

Analyze multiple charts for: {symbol_list}

Market Data:
{charts_context}

Trading Parameters:
- Account Balance: ${user_balance}
- Risk Management: {sl}% stop loss, {tp}% take profit
- Recommended Leverage: {leverage}x

Select the BEST trading opportunity across all symbols and provide:
- Which symbol has the strongest setup
- Entry price and position sizing
- Risk management parameters

Respond in JSON format:
{{
    "recommendedSymbol": "BEST_SYMBOL",
    "action": "open_long" | "open_short" | "close" | "hold",
    "confidence": 0.0-1.0,
    "reasoning": "detailed analysis comparing all symbols",
    "entryPrice": float,
    "stopLoss": float,
    "takeProfit": float,
    "positionSize": float (as % of account),
    "marketContext": "brief market overview",
    "liquidationPrice": float (optional),
    "riskRewardRatio": float (optional)
}}
"""

            payload = {
                "model": ai_model,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a professional crypto trading analyst. Always respond in valid JSON format. When analyzing multiple charts, identify the best opportunity."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.3,
                "max_tokens": 1500
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"AI API error: {error_text}")
                        return self._mock_multi_analysis(charts, user_balance)
                    
                    data = await response.json()
                    content = data["choices"][0]["message"]["content"]
                    
                    # Parse JSON response
                    try:
                        analysis = json.loads(content)
                        return self._normalize_analysis(analysis, analysis.get("recommendedSymbol", charts[0].get("symbol", "BTC")))
                    except json.JSONDecodeError:
                        logger.warning("Failed to parse AI response as JSON, using mock")
                        return self._mock_multi_analysis(charts, user_balance)
                        
        except Exception as e:
            logger.error(f"Error in multi-chart AI analysis: {e}")
            return self._mock_multi_analysis(charts, user_balance)
    
    def _normalize_analysis(self, analysis: dict, default_symbol: str) -> dict:
        """Normalize AI analysis response to standard format"""
        return {
            "recommendedSymbol": analysis.get("recommendedSymbol", default_symbol),
            "action": analysis.get("action", "hold"),
            "confidence": float(analysis.get("confidence", 0.5)),
            "reasoning": analysis.get("reasoning", "Analysis completed"),
            "entryPrice": float(analysis.get("entryPrice", 0)),
            "stopLoss": float(analysis.get("stopLoss", 0)),
            "takeProfit": float(analysis.get("takeProfit", 0)),
            "positionSize": float(analysis.get("positionSize", 0)),
            "marketContext": analysis.get("marketContext", ""),
            "liquidationPrice": float(analysis.get("liquidationPrice", 0)) if analysis.get("liquidationPrice") else None,
            "riskRewardRatio": float(analysis.get("riskRewardRatio", 0)) if analysis.get("riskRewardRatio") else None
        }
    
    def _mock_analysis(self, symbol: str, user_balance: float) -> dict:
        """Generate mock analysis for testing/fallback"""
        import random
        
        # Simulate realistic values based on symbol
        base_price = 50000.0 if "BTC" in symbol.upper() else (3000.0 if "ETH" in symbol.upper() else 100.0)
        entry = base_price * random.uniform(0.98, 1.02)
        
        return {
            "recommendedSymbol": symbol,
            "action": random.choice(["open_long", "open_short", "hold"]),
            "confidence": random.uniform(0.6, 0.9),
            "reasoning": f"Mock analysis for {symbol}. Market shows mixed signals with moderate volatility. Technical indicators suggest potential breakout. Use proper risk management.",
            "entryPrice": round(entry, 2),
            "stopLoss": round(entry * 0.95, 2),
            "takeProfit": round(entry * 1.08, 2),
            "positionSize": min(10.0, user_balance * 0.01),  # 1% of balance
            "marketContext": f"{symbol} showing consolidation pattern with potential for breakout in either direction.",
            "liquidationPrice": round(entry * (0.8 if "long" in random.choice(["long", "short"]) else 1.2), 2),
            "riskRewardRatio": 1.6
        }
    
    def _mock_multi_analysis(self, charts: List[dict], user_balance: float) -> dict:
        """Generate mock analysis for multiple charts"""
        # Pick first chart as primary
        primary = charts[0] if charts else {"symbol": "BTC"}
        symbol = primary.get("symbol", "BTC")
        
        result = self._mock_analysis(symbol, user_balance)
        result["marketContext"] = f"Analyzed {len(charts)} charts. {symbol} shows the clearest setup."
        return result


# Create singleton instance
trading_service = TradingService()

# Convenience functions for direct import
async def analyze_market_single_chart(
    api_key: str,
    symbol: str,
    chart_data: str,
    user_balance: float,
    settings: dict,
    is_demo_mode: bool = False,
    ai_model: str = "deepseek/deepseek-chat-v3-0324:free",
    custom_prompt: Optional[str] = None
) -> dict:
    """Standalone function for single chart analysis"""
    return await trading_service.analyze_market_single_chart(
        api_key=api_key,
        symbol=symbol,
        chart_data=chart_data,
        user_balance=user_balance,
        settings=settings,
        is_demo_mode=is_demo_mode,
        ai_model=ai_model,
        custom_prompt=custom_prompt
    )

async def analyze_market_multi_chart(
    api_key: str,
    charts: List[dict],
    user_balance: float,
    settings: dict,
    is_demo_mode: bool = False,
    ai_model: str = "deepseek/deepseek-chat-v3-0324:free",
    custom_prompt: Optional[str] = None
) -> dict:
    """Standalone function for multi-chart analysis"""
    return await trading_service.analyze_market_multi_chart(
        api_key=api_key,
        charts=charts,
        user_balance=user_balance,
        settings=settings,
        is_demo_mode=is_demo_mode,
        ai_model=ai_model,
        custom_prompt=custom_prompt
    )

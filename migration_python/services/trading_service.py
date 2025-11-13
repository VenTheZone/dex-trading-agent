"""
Trading Service - AI-powered trading analysis and decision making
Replaces: Convex trading.ts actions
"""

import httpx
import json
import os
from typing import Dict, List, Optional
from sqlalchemy.orm import Session

class TradingService:
    """
    Handles AI-powered trading analysis and decision making
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.openrouter_base_url = "https://openrouter.ai/api/v1/chat/completions"
    
    def _get_openrouter_key(self, client_key: str) -> str:
        """
        Get OpenRouter API key with priority: client > backend env
        """
        # If client provides valid key, use it
        if client_key and client_key != 'DEMO_MODE' and client_key.startswith('sk-or-v1-'):
            return client_key
        
        # Fallback to backend environment variable
        backend_key = os.getenv('OPENROUTER_API_KEY')
        if backend_key and backend_key.startswith('sk-or-v1-'):
            print('[PYTHON] Using backend OpenRouter API key')
            return backend_key
        
        raise ValueError("OpenRouter API key is required. Please add your API key in Settings or configure OPENROUTER_API_KEY in backend environment.")
    
    async def analyze_single_market(
        self,
        api_key: str,
        symbol: str,
        chart_data: str,
        user_balance: float,
        settings: Dict,
        is_demo_mode: bool = False,
        ai_model: Optional[str] = None,
        custom_prompt: Optional[str] = None
    ) -> Dict:
        """
        Analyzes market data for a single symbol using AI
        """
        # Get API key (client or backend)
        api_key = self._get_openrouter_key(api_key)
        
        model = ai_model or "deepseek/deepseek-chat-v3-0324:free"
        
        base_prompt = custom_prompt or "You are an expert crypto trading analyst. Analyze the following market data and provide a trading recommendation."
        
        prompt = f"""{base_prompt}

Symbol: {symbol}
Current Balance: {user_balance}
Chart Data: {chart_data}
Risk Settings: TP {settings['takeProfitPercent']}%, SL {settings['stopLossPercent']}%

Provide your analysis in JSON format with:
{{
  "action": "open_long" | "open_short" | "close" | "hold",
  "confidence": 0-100,
  "reasoning": "detailed explanation",
  "entryPrice": number,
  "stopLoss": number,
  "takeProfit": number,
  "positionSize": number
}}"""
        
        headers = {
            "Content-Type": "application/json",
            "HTTP-Referer": "https://dex-trading-agent.vly.site",
            "X-Title": "DeX Trading Agent Demo" if is_demo_mode else "DeX Trading Agent",
            "Authorization": f"Bearer {api_key}",
        }
        
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a professional crypto trading analyst. Always respond with valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "response_format": {"type": "json_object"},
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.openrouter_base_url,
                    headers=headers,
                    json=payload
                )
                
                if response.status_code != 200:
                    error_text = response.text
                    print(f'[PYTHON] OpenRouter API error: {response.status_code} - {error_text}')
                    
                    if response.status_code == 401:
                        raise ValueError('Invalid OpenRouter API key. Please check your API key in Settings.')
                    elif response.status_code == 429:
                        raise ValueError('OpenRouter API rate limit exceeded. Please try again later.')
                    elif response.status_code >= 500:
                        raise ValueError('OpenRouter API server error. Please try again later.')
                    
                    raise ValueError(f'OpenRouter API error ({response.status_code}): {response.reason_phrase}')
                
                data = response.json()
                
                if not data.get('choices') or len(data['choices']) == 0:
                    print(f'[PYTHON] Invalid API response structure: {data}')
                    raise ValueError('OpenRouter API returned invalid response structure. No choices array found.')
                
                if not data['choices'][0].get('message', {}).get('content'):
                    print(f'[PYTHON] Missing message content in API response: {data["choices"][0]}')
                    raise ValueError('OpenRouter API returned empty message content.')
                
                analysis = json.loads(data['choices'][0]['message']['content'])
                return analysis
                
        except httpx.TimeoutException:
            raise ValueError('OpenRouter API request timed out after 30 seconds. Please try again.')
        except Exception as e:
            print(f"[PYTHON] AI Analysis error: {str(e)}")
            raise ValueError(f"AI analysis failed: {str(e)}")
    
    async def analyze_multiple_charts(
        self,
        api_key: str,
        charts: List[Dict],
        user_balance: float,
        settings: Dict,
        is_demo_mode: bool = False,
        ai_model: Optional[str] = None,
        custom_prompt: Optional[str] = None
    ) -> Dict:
        """
        Analyzes multiple charts and recommends best trading opportunity
        """
        # Get API key (client or backend)
        api_key = self._get_openrouter_key(api_key)
        
        model = ai_model or "deepseek/deepseek-chat-v3-0324:free"
        
        base_prompt = custom_prompt or "You are an expert crypto trading analyst. Analyze multiple trading pairs and recommend the best opportunity."
        
        charts_data = "\n".join([
            f"- {chart['symbol']}: ${chart['currentPrice']:,.2f} ({chart.get('chartType', 'time')}, {chart.get('chartInterval', '15m')})"
            for chart in charts
        ])
        
        prompt = f"""{base_prompt}

Current Balance: ${user_balance:,.2f}
Risk Settings: TP {settings['takeProfitPercent']}%, SL {settings['stopLossPercent']}%
Leverage: {settings['leverage']}x

Available Trading Pairs:
{charts_data}

Analyze all pairs and provide your recommendation in JSON format:
{{
  "action": "open_long" | "open_short" | "hold",
  "recommendedSymbol": "BTC" | "ETH" | etc,
  "confidence": 0-100,
  "reasoning": "detailed multi-chart analysis",
  "marketContext": "overall market conditions",
  "entryPrice": number,
  "stopLoss": number,
  "takeProfit": number,
  "positionSize": number
}}"""
        
        headers = {
            "Content-Type": "application/json",
            "HTTP-Referer": "https://dex-trading-agent.vly.site",
            "X-Title": "DeX Trading Agent Demo" if is_demo_mode else "DeX Trading Agent",
            "Authorization": f"Bearer {api_key}",
        }
        
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a professional crypto trading analyst specializing in multi-chart analysis. Always respond with valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "response_format": {"type": "json_object"},
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.openrouter_base_url,
                    headers=headers,
                    json=payload
                )
                
                if response.status_code != 200:
                    error_text = response.text
                    print(f'[PYTHON] OpenRouter API error: {response.status_code} - {error_text}')
                    
                    if response.status_code == 401:
                        raise ValueError('Invalid OpenRouter API key.')
                    elif response.status_code == 429:
                        raise ValueError('Rate limit exceeded.')
                    
                    raise ValueError(f'API error: {response.status_code}')
                
                data = response.json()
                analysis = json.loads(data['choices'][0]['message']['content'])
                return analysis
                
        except Exception as e:
            print(f"[PYTHON] Multi-chart AI Analysis error: {str(e)}")
            raise ValueError(f"Multi-chart analysis failed: {str(e)}")

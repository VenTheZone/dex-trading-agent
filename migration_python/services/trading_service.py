# ... keep existing code (imports and class definition)

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
        headers = {
            "Content-Type": "application/json",
            "HTTP-Referer": "https://dex-trading-agent.local",
            "X-Title": "DeX Trading Agent Demo" if is_demo_mode else "DeX Trading Agent",
            "Authorization": f"Bearer {api_key}",
        }

# ... keep existing code

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
        headers = {
            "Content-Type": "application/json",
            "HTTP-Referer": "https://dex-trading-agent.local",
            "X-Title": "DeX Trading Agent Demo" if is_demo_mode else "DeX Trading Agent",
            "Authorization": f"Bearer {api_key}",
        }

# ... keep existing code

"""
PSEUDO-CODE: Crypto News Service
Replaces: Convex cryptoPanic.ts action

This file shows how to implement CryptoPanic news fetching in Python.
"""

import httpx
import os
from typing import Dict, List, Optional

class CryptoNewsService:
    """
    Handles cryptocurrency news fetching from CryptoPanic API
    """
    
    def __init__(self):
        self.api_token = os.getenv("CRYPTOPANIC_AUTH_TOKEN", "free")
        self.base_url = "https://cryptopanic.com/api/v1"
    
    async def fetch_crypto_news(
        self,
        filter_type: Optional[str] = None,
        currencies: Optional[List[str]] = None,
        limit: int = 20
    ) -> Dict:
        """
        Fetch cryptocurrency news from CryptoPanic
        Replaces: cryptoPanic.fetchCryptoNews
        """
        try:
            # Validate inputs
            valid_filters = ['hot', 'bullish', 'bearish', 'important', 'saved', 'lol']
            if filter_type and filter_type not in valid_filters:
                filter_type = None
            
            # Limit currencies to prevent abuse (max 10)
            if currencies:
                currencies = [
                    c.upper().replace(r'[^A-Z0-9]', '')[:10]
                    for c in currencies[:10]
                ]
                currencies = [c for c in currencies if c]
            
            # Limit results (max 50)
            limit = max(1, min(limit, 50))
            
            # Build query parameters
            params = {"public": "true"}
            
            if self.api_token and self.api_token != "free":
                params["auth_token"] = self.api_token
            
            if filter_type:
                params["filter"] = filter_type
            
            if currencies:
                params["currencies"] = ",".join(currencies)
            
            # Fetch news
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/posts/",
                    params=params,
                    headers={
                        "Accept": "application/json",
                        "User-Agent": "DeX-Trading-Agent/1.0"
                    }
                )
                
                if response.status_code == 429:
                    return {
                        "success": False,
                        "error": "CryptoPanic API rate limit exceeded. Please add CRYPTOPANIC_AUTH_TOKEN for higher limits.",
                        "posts": [],
                        "count": 0
                    }
                
                if response.status_code >= 500:
                    return {
                        "success": False,
                        "error": "CryptoPanic API server error. Please try again later.",
                        "posts": [],
                        "count": 0
                    }
                
                response.raise_for_status()
                data = response.json()
                
                # Validate response structure
                if not data or not isinstance(data, dict) or "results" not in data:
                    raise ValueError("Invalid API response structure")
                
                # Sanitize response data
                posts = []
                for post in data.get("results", [])[:limit]:
                    if not post or not isinstance(post, dict):
                        continue
                    
                    sanitized_post = {
                        "id": str(post.get("id", ""))[:50],
                        "title": str(post.get("title", ""))[:300],
                        "url": str(post.get("url", ""))[:500],
                        "created_at": str(post.get("created_at", "")),
                        "domain": str(post.get("domain", ""))[:100],
                        "votes": {
                            "positive": min(post.get("votes", {}).get("positive", 0), 999999),
                            "negative": min(post.get("votes", {}).get("negative", 0), 999999),
                            "important": min(post.get("votes", {}).get("important", 0), 999999)
                        },
                        "currencies": [
                            {
                                "code": str(c.get("code", ""))[:10],
                                "title": str(c.get("title", ""))[:50]
                            }
                            for c in post.get("currencies", [])[:5]
                            if c.get("code")
                        ]
                    }
                    
                    if sanitized_post["id"] and sanitized_post["title"] and sanitized_post["url"]:
                        posts.append(sanitized_post)
                
                return {
                    "success": True,
                    "posts": posts,
                    "count": min(data.get("count", 0), 999999)
                }
        except Exception as e:
            print(f"Error fetching CryptoPanic news: {e}")
            return {
                "success": False,
                "error": str(e),
                "posts": [],
                "count": 0
            }

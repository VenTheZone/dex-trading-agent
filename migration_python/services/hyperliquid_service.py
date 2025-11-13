"""
PSEUDO-CODE: Hyperliquid Service
Replaces: Convex hyperliquid.ts actions

This file shows how to implement Hyperliquid API integration in Python.
"""

import httpx
import json
from typing import Dict, Optional, List
from eth_account import Account
from eth_account.signers.local import LocalAccount

class HyperliquidService:
    """
    Handles all Hyperliquid exchange interactions
    """
    
    def __init__(self, is_testnet: bool = False):
        self.is_testnet = is_testnet
        self.base_url = (
            "https://api.hyperliquid-testnet.xyz" if is_testnet 
            else "https://api.hyperliquid.xyz"
        )
        self.app_url = (
            "https://app.hyperliquid-testnet.xyz" if is_testnet
            else "https://app.hyperliquid.xyz"
        )
    
    async def test_connection(self) -> Dict:
        """
        Test connection to Hyperliquid (mainnet or testnet)
        Replaces: hyperliquid.testConnection
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.base_url}/info",
                    json={"type": "meta"}
                )
                response.raise_for_status()
                meta = response.json()
                
                return {
                    "success": True,
                    "network": "testnet" if self.is_testnet else "mainnet",
                    "apiEndpoint": self.base_url,
                    "appUrl": self.app_url,
                    "assetsCount": len(meta.get("universe", [])),
                    "availableAssets": ", ".join([a["name"] for a in meta.get("universe", [])[:10]]),
                    "message": f"Successfully connected to Hyperliquid {'Testnet' if self.is_testnet else 'Mainnet'}"
                }
        except Exception as e:
            return {
                "success": False,
                "network": "testnet" if self.is_testnet else "mainnet",
                "error": str(e),
                "message": f"Failed to connect to Hyperliquid {'Testnet' if self.is_testnet else 'Mainnet'}"
            }
    
    async def get_account_info(self, wallet_address: str) -> Dict:
        """
        Get account info from Hyperliquid (Perpetual Wallet Balance)
        Replaces: hyperliquid.getAccountInfo
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.base_url}/info",
                    json={
                        "type": "clearinghouseState",
                        "user": wallet_address
                    }
                )
                response.raise_for_status()
                state = response.json()
                
                return {
                    "success": True,
                    "perpetualBalance": float(state["marginSummary"]["accountValue"]),
                    "withdrawable": float(state["withdrawable"]),
                    "totalMarginUsed": float(state["marginSummary"].get("totalMarginUsed", "0")),
                    "positions": len(state["assetPositions"]),
                    "network": "testnet" if self.is_testnet else "mainnet",
                    "spotBalances": []
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "network": "testnet" if self.is_testnet else "mainnet"
            }
    
    async def get_orderbook(self, coin: str) -> Dict:
        """
        Fetch L2 orderbook data from Hyperliquid for a specific coin
        Replaces: hyperliquid.getOrderBook
        """
        try:
            if not coin or not isinstance(coin, str) or not coin.strip():
                raise ValueError("Invalid coin symbol provided")
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.base_url}/info",
                    json={
                        "type": "l2Book",
                        "coin": coin.strip()
                    }
                )
                response.raise_for_status()
                orderbook = response.json()
                
                if not orderbook or "levels" not in orderbook or not isinstance(orderbook["levels"], list):
                    raise ValueError(f"Invalid orderbook data received for {coin}")
                
                bids = [
                    {
                        "price": float(level["px"]),
                        "size": float(level["sz"]),
                        "orders": level["n"]
                    }
                    for level in orderbook["levels"][0]
                ]
                
                asks = [
                    {
                        "price": float(level["px"]),
                        "size": float(level["sz"]),
                        "orders": level["n"]
                    }
                    for level in orderbook["levels"][1]
                ]
                
                spread = asks[0]["price"] - bids[0]["price"] if asks and bids else 0
                mid_price = (asks[0]["price"] + bids[0]["price"]) / 2 if asks and bids else 0
                
                return {
                    "success": True,
                    "coin": orderbook["coin"],
                    "timestamp": orderbook["time"],
                    "bids": bids,
                    "asks": asks,
                    "spread": spread,
                    "midPrice": mid_price
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "coin": coin
            }
    
    async def execute_trade(
        self,
        api_secret: str,
        symbol: str,
        side: str,
        size: float,
        price: float,
        leverage: int,
        stop_loss: Optional[float] = None,
        take_profit: Optional[float] = None
    ) -> Dict:
        """
        Execute a live trade on Hyperliquid exchange
        Replaces: trading.executeHyperliquidTrade
        
        NOTE: This requires the @nktkas/hyperliquid Python equivalent
        or direct implementation of Hyperliquid's signing protocol
        """
        try:
            # Create account from private key
            account: LocalAccount = Account.from_key(api_secret)
            
            # Get asset metadata
            async with httpx.AsyncClient(timeout=10.0) as client:
                meta_response = await client.post(
                    f"{self.base_url}/info",
                    json={"type": "meta"}
                )
                meta = meta_response.json()
                
                asset_index = next(
                    (i for i, asset in enumerate(meta["universe"]) if asset["name"] == symbol),
                    None
                )
                
                if asset_index is None:
                    raise ValueError(f"Asset {symbol} not found")
                
                # Set leverage (requires signing)
                # ... implement leverage update with signature ...
                
                # Place order (requires signing)
                # ... implement order placement with signature ...
                
                return {
                    "success": True,
                    "message": "Trade executed successfully"
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

"""
Hyperliquid Service - Exchange API integration
Replaces: Convex hyperliquid.ts actions
"""

import httpx
import json
from typing import Dict, Optional
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
        """Test connection to Hyperliquid"""
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
        """Get account info from Hyperliquid"""
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
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "network": "testnet" if self.is_testnet else "mainnet"
            }
    
    async def get_positions(self, wallet_address: str) -> Dict:
        """Get all open positions"""
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
                    "positions": state,
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }

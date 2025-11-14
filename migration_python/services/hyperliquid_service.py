"""
Hyperliquid Service - Exchange API integration
Replaces: Convex hyperliquid.ts actions
"""

import httpx
import json
import time
from typing import Dict, Optional
from eth_account import Account
from eth_account.signers.local import LocalAccount
from eth_account.messages import encode_structured_data

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
    
    async def get_asset_index(self, symbol: str) -> int:
        """Get asset index for a symbol"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.base_url}/info",
                    json={"type": "meta"}
                )
                response.raise_for_status()
                meta = response.json()
                
                for idx, asset in enumerate(meta.get("universe", [])):
                    if asset["name"] == symbol:
                        return idx
                
                raise ValueError(f"Asset {symbol} not found")
        except Exception as e:
            raise ValueError(f"Failed to get asset index: {str(e)}")
    
    def _sign_l1_action(self, wallet: LocalAccount, action: Dict, nonce: int) -> Dict:
        """Sign an L1 action using EIP-712"""
        
        # EIP-712 domain for Hyperliquid
        domain = {
            "name": "Exchange",
            "version": "1",
            "chainId": 1337 if self.is_testnet else 42161,  # Testnet uses 1337, Mainnet uses Arbitrum One (42161)
            "verifyingContract": "0x0000000000000000000000000000000000000000"
        }
        
        # EIP-712 types
        types = {
            "Agent": [
                {"name": "source", "type": "string"},
                {"name": "connectionId", "type": "bytes32"}
            ],
            "HyperliquidTransaction:Order": [
                {"name": "a", "type": "uint32"},
                {"name": "b", "type": "bool"},
                {"name": "p", "type": "string"},
                {"name": "s", "type": "string"},
                {"name": "r", "type": "bool"},
                {"name": "t", "type": "string"}
            ]
        }
        
        # Create structured data
        structured_data = {
            "types": types,
            "primaryType": "HyperliquidTransaction:Order",
            "domain": domain,
            "message": action
        }
        
        # Sign the message
        encoded_data = encode_structured_data(structured_data)
        signed_message = wallet.sign_message(encoded_data)
        
        return {
            "r": "0x" + signed_message.r.to_bytes(32, "big").hex(),
            "s": "0x" + signed_message.s.to_bytes(32, "big").hex(),
            "v": signed_message.v
        }
    
    async def place_order(
        self,
        api_secret: str,
        symbol: str,
        side: str,  # "buy" or "sell"
        size: float,
        price: Optional[float] = None,
        order_type: str = "market",  # "market" or "limit"
        reduce_only: bool = False,
        leverage: Optional[int] = None
    ) -> Dict:
        """Place an order on Hyperliquid"""
        try:
            # Create wallet from private key
            wallet = Account.from_key(api_secret)
            
            # Get asset index
            asset_index = await self.get_asset_index(symbol)
            
            # Set leverage if provided
            if leverage:
                await self._set_leverage(wallet, asset_index, leverage)
            
            # Build order action
            order_action = {
                "a": asset_index,
                "b": side.lower() == "buy",
                "p": str(price) if price else "0",
                "s": str(size),
                "r": reduce_only,
                "t": json.dumps({"market": {}} if order_type == "market" else {"limit": {"tif": "Gtc"}})
            }
            
            # Get nonce (timestamp in milliseconds)
            nonce = int(time.time() * 1000)
            
            # Sign the action
            signature = self._sign_l1_action(wallet, order_action, nonce)
            
            # Build request payload
            payload = {
                "action": {
                    "type": "order",
                    "orders": [order_action],
                    "grouping": "na"
                },
                "nonce": nonce,
                "signature": signature,
                "vaultAddress": None
            }
            
            # Send order to exchange
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/exchange",
                    json=payload
                )
                response.raise_for_status()
                result = response.json()
                
                return {
                    "success": True,
                    "result": result,
                    "orderId": result.get("response", {}).get("data", {}).get("statuses", [{}])[0].get("resting", {}).get("oid")
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _set_leverage(self, wallet: LocalAccount, asset_index: int, leverage: int) -> None:
        """Set leverage for an asset"""
        try:
            leverage_action = {
                "type": "updateLeverage",
                "asset": asset_index,
                "isCross": True,
                "leverage": leverage
            }
            
            nonce = int(time.time() * 1000)
            signature = self._sign_l1_action(wallet, leverage_action, nonce)
            
            payload = {
                "action": leverage_action,
                "nonce": nonce,
                "signature": signature,
                "vaultAddress": None
            }
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.base_url}/exchange",
                    json=payload
                )
                response.raise_for_status()
                
        except Exception as e:
            print(f"Warning: Failed to set leverage: {str(e)}")
    
    async def place_stop_loss(
        self,
        api_secret: str,
        symbol: str,
        side: str,
        size: float,
        trigger_price: float
    ) -> Dict:
        """Place a stop loss order"""
        try:
            wallet = Account.from_key(api_secret)
            asset_index = await self.get_asset_index(symbol)
            
            order_action = {
                "a": asset_index,
                "b": side.lower() == "buy",
                "p": "0",
                "s": str(size),
                "r": False,
                "t": json.dumps({
                    "trigger": {
                        "isMarket": True,
                        "tpsl": "sl",
                        "triggerPx": str(trigger_price)
                    }
                })
            }
            
            nonce = int(time.time() * 1000)
            signature = self._sign_l1_action(wallet, order_action, nonce)
            
            payload = {
                "action": {
                    "type": "order",
                    "orders": [order_action],
                    "grouping": "normalTpsl"
                },
                "nonce": nonce,
                "signature": signature,
                "vaultAddress": None
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/exchange",
                    json=payload
                )
                response.raise_for_status()
                result = response.json()
                
                return {
                    "success": True,
                    "result": result
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def place_take_profit(
        self,
        api_secret: str,
        symbol: str,
        side: str,
        size: float,
        trigger_price: float
    ) -> Dict:
        """Place a take profit order"""
        try:
            wallet = Account.from_key(api_secret)
            asset_index = await self.get_asset_index(symbol)
            
            order_action = {
                "a": asset_index,
                "b": side.lower() == "buy",
                "p": "0",
                "s": str(size),
                "r": False,
                "t": json.dumps({
                    "trigger": {
                        "isMarket": True,
                        "tpsl": "tp",
                        "triggerPx": str(trigger_price)
                    }
                })
            }
            
            nonce = int(time.time() * 1000)
            signature = self._sign_l1_action(wallet, order_action, nonce)
            
            payload = {
                "action": {
                    "type": "order",
                    "orders": [order_action],
                    "grouping": "normalTpsl"
                },
                "nonce": nonce,
                "signature": signature,
                "vaultAddress": None
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/exchange",
                    json=payload
                )
                response.raise_for_status()
                result = response.json()
                
                return {
                    "success": True,
                    "result": result
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

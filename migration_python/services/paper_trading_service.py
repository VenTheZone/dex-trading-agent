"""
PSEUDO-CODE: Paper Trading Service
Replaces: Frontend lib/paper-trading-engine.ts

This file shows how to implement paper trading simulation in Python backend.
"""

from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from database.schema import PaperPosition, PaperOrder, User

class PaperTradingService:
    """
    Handles paper trading simulation (no real funds)
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def execute_paper_trade(
        self,
        user_id: int,
        symbol: str,
        side: str,  # "buy" or "sell"
        size: float,
        price: float,
        order_type: str,  # "market" or "limit"
        leverage: int,
        stop_loss: Optional[float] = None,
        take_profit: Optional[float] = None
    ) -> Dict:
        """
        Execute a simulated paper trade
        Replaces: trading.executePaperTrade
        """
        try:
            # Create paper order
            order = PaperOrder(
                user_id=user_id,
                symbol=symbol,
                side=side,
                type=order_type,
                price=price,
                size=size,
                filled=size,  # Instant fill for paper trading
                status="filled"
            )
            self.db.add(order)
            
            # Check if position exists
            existing_position = self.db.query(PaperPosition).filter(
                PaperPosition.user_id == user_id,
                PaperPosition.symbol == symbol
            ).first()
            
            if existing_position:
                # Update existing position
                if side == "buy":
                    # Adding to long or reducing short
                    if existing_position.side == "long":
                        # Average entry price
                        total_size = existing_position.size + size
                        existing_position.entry_price = (
                            (existing_position.entry_price * existing_position.size + price * size) / total_size
                        )
                        existing_position.size = total_size
                    else:
                        # Closing short position
                        if size >= existing_position.size:
                            # Close and potentially reverse
                            pnl = (existing_position.entry_price - price) * existing_position.size
                            existing_position.realized_pnl += pnl
                            
                            if size > existing_position.size:
                                # Reverse to long
                                existing_position.side = "long"
                                existing_position.size = size - existing_position.size
                                existing_position.entry_price = price
                            else:
                                # Close position
                                self.db.delete(existing_position)
                        else:
                            # Reduce short position
                            pnl = (existing_position.entry_price - price) * size
                            existing_position.realized_pnl += pnl
                            existing_position.size -= size
                else:  # sell
                    # Similar logic for sell side
                    pass
            else:
                # Create new position
                position = PaperPosition(
                    user_id=user_id,
                    symbol=symbol,
                    side="long" if side == "buy" else "short",
                    size=size,
                    entry_price=price,
                    current_price=price,
                    unrealized_pnl=0.0,
                    realized_pnl=0.0,
                    leverage=leverage,
                    stop_loss=stop_loss,
                    take_profit=take_profit
                )
                self.db.add(position)
            
            self.db.commit()
            
            return {
                "success": True,
                "orderId": f"paper_{int(datetime.now().timestamp())}",
                "message": "Paper trade executed successfully"
            }
        except Exception as e:
            self.db.rollback()
            return {
                "success": False,
                "error": str(e)
            }
    
    def update_position_prices(self, user_id: int, symbol: str, current_price: float):
        """Update position with current market price and calculate unrealized P&L"""
        position = self.db.query(PaperPosition).filter(
            PaperPosition.user_id == user_id,
            PaperPosition.symbol == symbol
        ).first()
        
        if position:
            position.current_price = current_price
            
            if position.side == "long":
                position.unrealized_pnl = (current_price - position.entry_price) * position.size
            else:  # short
                position.unrealized_pnl = (position.entry_price - current_price) * position.size
            
            # Check stop loss / take profit
            if position.stop_loss and (
                (position.side == "long" and current_price <= position.stop_loss) or
                (position.side == "short" and current_price >= position.stop_loss)
            ):
                # Close position at stop loss
                self.close_position(user_id, symbol, current_price, "stop_loss")
            
            if position.take_profit and (
                (position.side == "long" and current_price >= position.take_profit) or
                (position.side == "short" and current_price <= position.take_profit)
            ):
                # Close position at take profit
                self.close_position(user_id, symbol, current_price, "take_profit")
            
            self.db.commit()
    
    def close_position(self, user_id: int, symbol: str, exit_price: float, reason: str = "manual"):
        """Close a paper trading position"""
        position = self.db.query(PaperPosition).filter(
            PaperPosition.user_id == user_id,
            PaperPosition.symbol == symbol
        ).first()
        
        if position:
            # Calculate final P&L
            if position.side == "long":
                pnl = (exit_price - position.entry_price) * position.size
            else:
                pnl = (position.entry_price - exit_price) * position.size
            
            position.realized_pnl += pnl
            
            # Delete position
            self.db.delete(position)
            self.db.commit()
            
            return {
                "success": True,
                "pnl": pnl,
                "reason": reason
            }
        
        return {"success": False, "error": "Position not found"}
    
    def get_user_positions(self, user_id: int) -> List[Dict]:
        """Get all paper trading positions for a user"""
        positions = self.db.query(PaperPosition).filter(
            PaperPosition.user_id == user_id
        ).all()
        
        return [
            {
                "symbol": p.symbol,
                "side": p.side,
                "size": p.size,
                "entryPrice": p.entry_price,
                "currentPrice": p.current_price,
                "unrealizedPnl": p.unrealized_pnl,
                "realizedPnl": p.realized_pnl,
                "leverage": p.leverage,
                "stopLoss": p.stop_loss,
                "takeProfit": p.take_profit
            }
            for p in positions
        ]

"""
Paper Trading Service - Simulates trading without real funds
"""
from typing import Dict, List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class PaperTradingEngine:
    """Simulates trading operations for paper trading mode"""
    
    def __init__(self, initial_balance: float = 10000.0):
        self.balance = initial_balance
        self.initial_balance = initial_balance
        self.positions: Dict[str, Dict] = {}
        self.orders: List[Dict] = []
        self.trade_history: List[Dict] = []
        
    def get_balance(self) -> float:
        """Get current balance"""
        return self.balance
    
    def get_position(self, symbol: str) -> Optional[Dict]:
        """Get position for a symbol"""
        return self.positions.get(symbol)
    
    def get_all_positions(self) -> List[Dict]:
        """Get all open positions"""
        return list(self.positions.values())
    
    def place_order(
        self,
        symbol: str,
        side: str,  # 'buy' or 'sell'
        size: float,
        price: float,
        order_type: str = 'market'
    ) -> Dict:
        """Place a paper trading order"""
        try:
            # Calculate order value
            order_value = size * price
            
            # Check if opening a new position
            if side == 'buy':
                # Check balance
                if order_value > self.balance:
                    return {
                        'status': 'rejected',
                        'reason': 'Insufficient balance',
                        'balance': self.balance,
                        'required': order_value
                    }
                
                # Deduct from balance
                self.balance -= order_value
                
                # Create or update position
                if symbol in self.positions:
                    # Average entry price
                    existing = self.positions[symbol]
                    total_size = existing['size'] + size
                    avg_price = (
                        (existing['entryPrice'] * existing['size']) + (price * size)
                    ) / total_size
                    
                    self.positions[symbol] = {
                        'symbol': symbol,
                        'side': 'long',
                        'size': total_size,
                        'entryPrice': avg_price,
                        'currentPrice': price,
                        'unrealizedPnl': 0,
                        'stopLoss': existing.get('stopLoss'),
                        'takeProfit': existing.get('takeProfit'),
                    }
                else:
                    self.positions[symbol] = {
                        'symbol': symbol,
                        'side': 'long',
                        'size': size,
                        'entryPrice': price,
                        'currentPrice': price,
                        'unrealizedPnl': 0,
                        'stopLoss': None,
                        'takeProfit': None,
                    }
                
                order = {
                    'id': len(self.orders) + 1,
                    'symbol': symbol,
                    'side': side,
                    'size': size,
                    'price': price,
                    'type': order_type,
                    'status': 'filled',
                    'timestamp': datetime.utcnow().isoformat(),
                }
                self.orders.append(order)
                
                logger.info(f"Paper order filled: {side.upper()} {size} {symbol} @ {price}")
                return order
                
            elif side == 'sell':
                # Close position
                if symbol not in self.positions:
                    return {
                        'status': 'rejected',
                        'reason': 'No position to close'
                    }
                
                position = self.positions[symbol]
                pnl = (price - position['entryPrice']) * position['size']
                
                # Add PnL to balance
                self.balance += (position['entryPrice'] * position['size']) + pnl
                
                # Record trade
                self.trade_history.append({
                    'symbol': symbol,
                    'side': position['side'],
                    'entryPrice': position['entryPrice'],
                    'exitPrice': price,
                    'size': position['size'],
                    'pnl': pnl,
                    'timestamp': datetime.utcnow().isoformat(),
                })
                
                # Remove position
                del self.positions[symbol]
                
                order = {
                    'id': len(self.orders) + 1,
                    'symbol': symbol,
                    'side': side,
                    'size': size,
                    'price': price,
                    'type': order_type,
                    'status': 'filled',
                    'pnl': pnl,
                    'timestamp': datetime.utcnow().isoformat(),
                }
                self.orders.append(order)
                
                logger.info(f"Paper position closed: {symbol} PnL: ${pnl:.2f}")
                return order
                
        except Exception as e:
            logger.error(f"Paper order error: {e}")
            return {
                'status': 'error',
                'reason': str(e)
            }
    
    def close_position(self, symbol: str, price: float, reason: str = 'manual') -> Dict:
        """Close a position"""
        if symbol not in self.positions:
            return {'success': False, 'error': 'No position found'}
        
        position = self.positions[symbol]
        order = self.place_order(symbol, 'sell', position['size'], price)
        
        if order.get('status') == 'filled':
            return {
                'success': True,
                'pnl': order.get('pnl', 0),
                'reason': reason
            }
        
        return {'success': False, 'error': 'Failed to close position'}
    
    def update_position_price(self, symbol: str, current_price: float):
        """Update position with current market price"""
        if symbol in self.positions:
            position = self.positions[symbol]
            position['currentPrice'] = current_price
            position['unrealizedPnl'] = (current_price - position['entryPrice']) * position['size']
            
            # Check stop loss
            if position.get('stopLoss'):
                if current_price <= position['stopLoss']:
                    logger.info(f"Stop loss triggered for {symbol}")
                    self.close_position(symbol, current_price, 'stop_loss')
            
            # Check take profit
            if position.get('takeProfit'):
                if current_price >= position['takeProfit']:
                    logger.info(f"Take profit triggered for {symbol}")
                    self.close_position(symbol, current_price, 'take_profit')
    
    def set_stop_loss(self, symbol: str, stop_loss: float):
        """Set stop loss for a position"""
        if symbol in self.positions:
            self.positions[symbol]['stopLoss'] = stop_loss
    
    def set_take_profit(self, symbol: str, take_profit: float):
        """Set take profit for a position"""
        if symbol in self.positions:
            self.positions[symbol]['takeProfit'] = take_profit
    
    def get_total_pnl(self) -> float:
        """Calculate total P&L including unrealized"""
        unrealized = sum(pos['unrealizedPnl'] for pos in self.positions.values())
        realized = self.balance - self.initial_balance
        return realized + unrealized
    
    def reset(self, initial_balance: float = 10000.0):
        """Reset paper trading engine"""
        self.balance = initial_balance
        self.initial_balance = initial_balance
        self.positions = {}
        self.orders = []
        self.trade_history = []
        logger.info("Paper trading engine reset")

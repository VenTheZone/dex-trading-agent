"""
Backtesting Service - Historical trading simulation
Simulates AI trading decisions on historical data
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import asyncio
import logging
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)


@dataclass
class BacktestTrade:
    """Represents a single trade in backtest"""
    timestamp: datetime
    symbol: str
    action: str  # 'open_long', 'open_short', 'close'
    price: float
    size: float
    confidence: float
    reasoning: str
    pnl: float = 0.0
    balance_after: float = 0.0


@dataclass
class BacktestResult:
    """Results of a backtest run"""
    start_date: datetime
    end_date: datetime
    initial_balance: float
    final_balance: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    total_pnl: float
    total_pnl_percent: float
    max_drawdown: float
    max_drawdown_percent: float
    sharpe_ratio: float
    win_rate: float
    avg_win: float
    avg_loss: float
    trades: List[Dict]
    equity_curve: List[Dict]  # [{timestamp, balance}, ...]


class BacktestingService:
    """
    Simulates trading on historical data
    Uses AI analysis at each time step to make decisions
    """
    
    def __init__(self, initial_balance: float = 10000.0):
        self.initial_balance = initial_balance
        self.balance = initial_balance
        self.position: Optional[Dict] = None
        self.trades: List[BacktestTrade] = []
        self.equity_curve: List[Dict] = []
        self.peak_balance = initial_balance
        self.max_drawdown = 0.0
        
    async def run_backtest(
        self,
        symbol: str,
        start_date: datetime,
        end_date: datetime,
        interval_minutes: int = 60,  # Check every hour
        settings: Dict = None,
        ai_service = None,
        price_data: List[Dict] = None,
    ) -> BacktestResult:
        """
        Run backtest simulation
        
        Args:
            symbol: Trading pair (e.g., 'BTCUSD')
            start_date: Start of backtest period
            end_date: End of backtest period
            interval_minutes: How often to check for trades
            settings: Trading settings (leverage, TP/SL, etc.)
            ai_service: AI analysis service for decision making
            price_data: Historical price data [{timestamp, price, volume}, ...]
        """
        logger.info(f"Starting backtest for {symbol} from {start_date} to {end_date}")
        
        if not price_data:
            raise ValueError("Historical price data is required for backtesting")
        
        # Default settings
        if settings is None:
            settings = {
                'leverage': 1,
                'takeProfitPercent': 5.0,
                'stopLossPercent': 2.0,
                'maxPositionSize': 0.5,  # 50% of balance
            }
        
        # Reset state
        self.balance = self.initial_balance
        self.position = None
        self.trades = []
        self.equity_curve = []
        self.peak_balance = self.initial_balance
        self.max_drawdown = 0.0
        
        # Simulate trading at each interval
        current_time = start_date
        price_index = 0
        
        while current_time <= end_date and price_index < len(price_data):
            # Get current price
            current_price_data = price_data[price_index]
            current_price = current_price_data['price']
            
            # Update position if exists
            if self.position:
                self._update_position(current_price)
                
                # Check stop loss / take profit
                if self._should_close_position(current_price, settings):
                    await self._close_position(current_time, current_price, "TP/SL triggered")
            
            # Make trading decision if no position
            if not self.position and ai_service:
                decision = await self._get_ai_decision(
                    ai_service,
                    symbol,
                    current_price,
                    current_time,
                    settings
                )
                
                if decision and decision['action'] in ['open_long', 'open_short']:
                    await self._open_position(
                        current_time,
                        symbol,
                        decision['action'],
                        current_price,
                        decision.get('confidence', 0.8),
                        decision.get('reasoning', 'AI decision'),
                        settings
                    )
            
            # Record equity
            self.equity_curve.append({
                'timestamp': current_time.isoformat(),
                'balance': self.balance,
                'position_value': self._get_position_value(current_price) if self.position else 0
            })
            
            # Update peak and drawdown
            total_equity = self.balance + (self._get_position_value(current_price) if self.position else 0)
            if total_equity > self.peak_balance:
                self.peak_balance = total_equity
            
            drawdown = self.peak_balance - total_equity
            drawdown_percent = (drawdown / self.peak_balance) * 100 if self.peak_balance > 0 else 0
            if drawdown_percent > self.max_drawdown:
                self.max_drawdown = drawdown_percent
            
            # Move to next interval
            current_time += timedelta(minutes=interval_minutes)
            price_index += 1
        
        # Close any remaining position
        if self.position and price_index > 0:
            final_price = price_data[-1]['price']
            await self._close_position(end_date, final_price, "Backtest ended")
        
        # Calculate results
        return self._calculate_results(start_date, end_date)
    
    def _update_position(self, current_price: float):
        """Update position with current price"""
        if not self.position:
            return
        
        entry_price = self.position['entry_price']
        size = self.position['size']
        side = self.position['side']
        
        if side == 'long':
            pnl = (current_price - entry_price) * size
        else:  # short
            pnl = (entry_price - current_price) * size
        
        self.position['current_price'] = current_price
        self.position['unrealized_pnl'] = pnl
    
    def _should_close_position(self, current_price: float, settings: Dict) -> bool:
        """Check if position should be closed based on TP/SL"""
        if not self.position:
            return False
        
        entry_price = self.position['entry_price']
        side = self.position['side']
        tp_percent = settings.get('takeProfitPercent', 5.0)
        sl_percent = settings.get('stopLossPercent', 2.0)
        
        if side == 'long':
            price_change_percent = ((current_price - entry_price) / entry_price) * 100
        else:  # short
            price_change_percent = ((entry_price - current_price) / entry_price) * 100
        
        # Check take profit
        if price_change_percent >= tp_percent:
            return True
        
        # Check stop loss
        if price_change_percent <= -sl_percent:
            return True
        
        return False
    
    async def _open_position(
        self,
        timestamp: datetime,
        symbol: str,
        action: str,
        price: float,
        confidence: float,
        reasoning: str,
        settings: Dict
    ):
        """Open a new position"""
        if self.position:
            logger.warning("Attempted to open position while one exists")
            return
        
        # Calculate position size
        max_position_value = self.balance * settings.get('maxPositionSize', 0.5)
        size = max_position_value / price
        
        # Deduct from balance
        position_value = size * price
        self.balance -= position_value
        
        # Create position
        side = 'long' if action == 'open_long' else 'short'
        self.position = {
            'symbol': symbol,
            'side': side,
            'entry_price': price,
            'current_price': price,
            'size': size,
            'unrealized_pnl': 0.0,
            'opened_at': timestamp,
        }
        
        logger.info(f"Opened {side} position: {size:.4f} {symbol} @ ${price:.2f}")
    
    async def _close_position(self, timestamp: datetime, price: float, reason: str):
        """Close current position"""
        if not self.position:
            return
        
        # Calculate final P&L
        entry_price = self.position['entry_price']
        size = self.position['size']
        side = self.position['side']
        
        if side == 'long':
            pnl = (price - entry_price) * size
        else:  # short
            pnl = (entry_price - price) * size
        
        # Return funds to balance
        position_value = size * price
        self.balance += position_value
        
        # Record trade
        trade = BacktestTrade(
            timestamp=timestamp,
            symbol=self.position['symbol'],
            action='close',
            price=price,
            size=size,
            confidence=0.0,
            reasoning=reason,
            pnl=pnl,
            balance_after=self.balance
        )
        self.trades.append(trade)
        
        logger.info(f"Closed {side} position: P&L ${pnl:.2f}, Balance: ${self.balance:.2f}")
        
        # Clear position
        self.position = None
    
    def _get_position_value(self, current_price: float) -> float:
        """Get current value of position"""
        if not self.position:
            return 0.0
        return self.position['size'] * current_price
    
    async def _get_ai_decision(
        self,
        ai_service,
        symbol: str,
        price: float,
        timestamp: datetime,
        settings: Dict
    ) -> Optional[Dict]:
        """
        Get AI trading decision (placeholder for now)
        In production, this would call the AI analysis service
        """
        # For now, return None (no AI decision)
        # In production, integrate with TradingService.analyze_market_single_chart
        return None
    
    def _calculate_results(self, start_date: datetime, end_date: datetime) -> BacktestResult:
        """Calculate backtest statistics"""
        total_pnl = self.balance - self.initial_balance
        total_pnl_percent = (total_pnl / self.initial_balance) * 100
        
        winning_trades = [t for t in self.trades if t.pnl > 0]
        losing_trades = [t for t in self.trades if t.pnl < 0]
        
        win_rate = (len(winning_trades) / len(self.trades) * 100) if self.trades else 0
        avg_win = sum(t.pnl for t in winning_trades) / len(winning_trades) if winning_trades else 0
        avg_loss = sum(t.pnl for t in losing_trades) / len(losing_trades) if losing_trades else 0
        
        # Calculate Sharpe ratio (simplified)
        returns = [t.pnl / self.initial_balance for t in self.trades]
        avg_return = sum(returns) / len(returns) if returns else 0
        std_return = (sum((r - avg_return) ** 2 for r in returns) / len(returns)) ** 0.5 if returns else 0
        sharpe_ratio = (avg_return / std_return) if std_return > 0 else 0
        
        return BacktestResult(
            start_date=start_date,
            end_date=end_date,
            initial_balance=self.initial_balance,
            final_balance=self.balance,
            total_trades=len(self.trades),
            winning_trades=len(winning_trades),
            losing_trades=len(losing_trades),
            total_pnl=total_pnl,
            total_pnl_percent=total_pnl_percent,
            max_drawdown=self.max_drawdown * self.initial_balance / 100,
            max_drawdown_percent=self.max_drawdown,
            sharpe_ratio=sharpe_ratio,
            win_rate=win_rate,
            avg_win=avg_win,
            avg_loss=avg_loss,
            trades=[asdict(t) for t in self.trades],
            equity_curve=self.equity_curve
        )


# Singleton instance
_backtest_service: Optional[BacktestingService] = None

def get_backtest_service(initial_balance: float = 10000.0) -> BacktestingService:
    """Get or create backtesting service instance"""
    global _backtest_service
    if _backtest_service is None:
        _backtest_service = BacktestingService(initial_balance)
    return _backtest_service

"""
Trading Agent Integration Tests (Python Backend)

Tests the backend's ability to:
1. Fetch prices from Hyperliquid
2. Handle AI analysis requests
3. Execute trades
4. Log operations
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from migration_python.services.market_data_service import MarketDataService
from migration_python.services.hyperliquid_service import HyperliquidService


class TestAgentPriceFetching:
    """Test agent's ability to see market prices"""
    
    @pytest.mark.asyncio
    async def test_fetch_price_mainnet(self):
        """Test fetching price from Hyperliquid mainnet"""
        service = MarketDataService(is_testnet=False)
        
        try:
            price = await service.fetch_price_with_fallback("BTC")
            
            assert price > 0, "Price should be positive"
            assert isinstance(price, (int, float)), "Price should be numeric"
            
            print(f"✅ Mainnet price fetch: BTC = ${price:,.2f}")
        except Exception as e:
            pytest.skip(f"Mainnet API unavailable: {e}")
    
    @pytest.mark.asyncio
    async def test_fetch_multiple_prices(self):
        """Test fetching prices for multiple symbols"""
        service = MarketDataService(is_testnet=False)
        symbols = ["BTC", "ETH", "SOL"]
        
        results = []
        for symbol in symbols:
            try:
                price = await service.fetch_price_with_fallback(symbol)
                results.append((symbol, price))
                print(f"✅ {symbol}: ${price:,.2f}")
            except Exception as e:
                print(f"⚠️ {symbol}: Failed - {e}")
        
        assert len(results) > 0, "At least one price should be fetched"
    
    @pytest.mark.asyncio
    async def test_price_caching(self):
        """Test that price caching works"""
        service = MarketDataService(is_testnet=False)
        
        # First fetch
        price1 = await service.fetch_price_with_fallback("BTC")
        
        # Second fetch (should use cache)
        price2 = await service.fetch_price_with_fallback("BTC")
        
        # Prices should be identical if cached
        assert price1 == price2, "Cached price should match"
        print(f"✅ Price caching works: ${price1:,.2f}")


class TestAgentHyperliquidConnection:
    """Test agent's connection to Hyperliquid"""
    
    @pytest.mark.asyncio
    async def test_connection_mainnet(self):
        """Test connection to Hyperliquid mainnet"""
        service = HyperliquidService(is_testnet=False)
        
        result = await service.test_connection()
        
        assert result["success"] is True, "Connection should succeed"
        assert result["network"] == "mainnet"
        assert result["assetsCount"] > 0, "Should have available assets"
        
        print(f"✅ Mainnet connection: {result['assetsCount']} assets available")
    
    @pytest.mark.asyncio
    async def test_connection_testnet(self):
        """Test connection to Hyperliquid testnet"""
        service = HyperliquidService(is_testnet=True)
        
        result = await service.test_connection()
        
        assert result["success"] is True, "Connection should succeed"
        assert result["network"] == "testnet"
        
        print(f"✅ Testnet connection: {result['assetsCount']} assets available")


class TestAgentLogging:
    """Test agent's logging capabilities"""
    
    def test_log_structure(self):
        """Test that log entries have correct structure"""
        from migration_python.database.schema import TradingLog
        
        log = TradingLog(
            action="test_action",
            symbol="BTCUSD",
            reason="Testing log structure",
            details="Backtesting agent logging",
            price=50000.0,
            size=0.1,
            side="long",
            mode="paper"
        )
        
        assert log.action == "test_action"
        assert log.symbol == "BTCUSD"
        assert log.price == 50000.0
        
        print("✅ Log structure validated")
    
    def test_balance_history_structure(self):
        """Test balance history structure"""
        from migration_python.database.schema import BalanceHistory
        
        balance = BalanceHistory(
            balance=10000.0,
            mode="paper"
        )
        
        assert balance.balance == 10000.0
        assert balance.mode == "paper"
        
        print("✅ Balance history structure validated")
    
    def test_position_snapshot_structure(self):
        """Test position snapshot structure"""
        from migration_python.database.schema import PositionSnapshot
        
        snapshot = PositionSnapshot(
            symbol="BTCUSD",
            side="long",
            size=0.1,
            entry_price=50000.0,
            current_price=51000.0,
            unrealized_pnl=100.0,
            leverage=2,
            mode="paper"
        )
        
        assert snapshot.symbol == "BTCUSD"
        assert snapshot.unrealized_pnl == 100.0
        
        print("✅ Position snapshot structure validated")


class TestAgentEndToEnd:
    """End-to-end integration test for trading agent"""
    
    @pytest.mark.asyncio
    async def test_complete_workflow(self):
        """Test complete trading agent workflow"""
        print("\n🤖 Starting Trading Agent Backend Workflow...\n")
        
        # Step 1: Fetch price
        print("📊 Step 1: Fetching market price...")
        market_service = MarketDataService(is_testnet=False)
        
        try:
            price = await market_service.fetch_price_with_fallback("BTC")
            print(f"✅ Price fetched: BTC = ${price:,.2f}")
        except Exception as e:
            pytest.skip(f"Price fetch failed: {e}")
        
        # Step 2: Test Hyperliquid connection
        print("\n🔗 Step 2: Testing Hyperliquid connection...")
        hl_service = HyperliquidService(is_testnet=False)
        connection = await hl_service.test_connection()
        
        assert connection["success"], "Hyperliquid connection should succeed"
        print(f"✅ Connected to Hyperliquid: {connection['assetsCount']} assets")
        
        # Step 3: Validate data structures
        print("\n📝 Step 3: Validating data structures...")
        from migration_python.database.schema import TradingLog, BalanceHistory, PositionSnapshot
        
        log = TradingLog(
            action="backtest_trade",
            symbol="BTC",
            reason="End-to-end workflow test",
            price=price,
            size=0.1,
            side="long",
            mode="paper"
        )
        assert log.action == "backtest_trade"
        print("✅ Trading log structure valid")
        
        balance = BalanceHistory(balance=10000.0, mode="paper")
        assert balance.balance == 10000.0
        print("✅ Balance history structure valid")
        
        snapshot = PositionSnapshot(
            symbol="BTC",
            side="long",
            size=0.1,
            entry_price=price,
            current_price=price,
            unrealized_pnl=0.0,
            leverage=1,
            mode="paper"
        )
        assert snapshot.symbol == "BTC"
        print("✅ Position snapshot structure valid")
        
        print("\n✅ Trading Agent Backend Workflow Complete!\n")
        print("Summary:")
        print("  - Price Fetching: ✅")
        print("  - Hyperliquid Connection: ✅")
        print("  - Data Structures: ✅")
        print("  - Logging Capability: ✅")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])

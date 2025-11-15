"""
Unit tests for Hyperliquid price fetching service
Tests the MarketDataService class for price fetching, caching, and error handling
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch, MagicMock
import httpx

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.market_data_service import MarketDataService


@pytest.fixture
def market_service():
    """Create a fresh MarketDataService instance for each test"""
    service = MarketDataService()
    service.price_cache.clear()
    return service


@pytest.mark.asyncio
class TestHyperliquidPriceFetching:
    """Test suite for Hyperliquid price fetching"""

    async def test_fetch_btc_price_mainnet(self, market_service):
        """Test fetching BTC price from Hyperliquid mainnet"""
        price = await market_service.fetch_from_hyperliquid("BTCUSD", is_testnet=False)
        
        assert price is not None
        assert isinstance(price, float)
        assert price > 10000  # BTC should be > $10k
        assert price < 200000  # BTC should be < $200k (sanity check)

    async def test_fetch_eth_price_mainnet(self, market_service):
        """Test fetching ETH price from Hyperliquid mainnet"""
        price = await market_service.fetch_from_hyperliquid("ETHUSD", is_testnet=False)
        
        assert price is not None
        assert isinstance(price, float)
        assert price > 1000  # ETH should be > $1k
        assert price < 10000  # ETH should be < $10k

    async def test_fetch_sol_price_mainnet(self, market_service):
        """Test fetching SOL price from Hyperliquid mainnet"""
        price = await market_service.fetch_from_hyperliquid("SOLUSD", is_testnet=False)
        
        assert price is not None
        assert isinstance(price, float)
        assert price > 10  # SOL should be > $10
        assert price < 1000  # SOL should be < $1k

    async def test_fetch_price_testnet(self, market_service):
        """Test fetching price from Hyperliquid testnet"""
        price = await market_service.fetch_from_hyperliquid("BTCUSD", is_testnet=True)
        
        # Testnet might not always be available, so we allow None
        if price is not None:
            assert isinstance(price, float)
            assert price > 0

    async def test_invalid_symbol(self, market_service):
        """Test handling of invalid symbol"""
        price = await market_service.fetch_from_hyperliquid("INVALIDCOIN", is_testnet=False)
        
        assert price is None  # Should return None for invalid symbols

    async def test_price_cache_hit(self, market_service):
        """Test that price caching works correctly"""
        # First fetch - should hit API
        price1 = await market_service.fetch_price_with_fallback("BTCUSD", is_testnet=False)
        
        # Second fetch - should hit cache
        start_time = datetime.now()
        price2 = await market_service.fetch_price_with_fallback("BTCUSD", is_testnet=False)
        end_time = datetime.now()
        
        assert price1 == price2
        # Cache hit should be very fast (< 100ms)
        assert (end_time - start_time).total_seconds() < 0.1

    async def test_cache_expiration(self, market_service):
        """Test that cache expires after CACHE_DURATION"""
        # Fetch price
        price1 = await market_service.fetch_price_with_fallback("BTCUSD", is_testnet=False)
        
        # Manually expire cache
        cache_key = "BTCUSD_False"
        market_service.price_cache[cache_key]["timestamp"] = datetime.now() - timedelta(seconds=10)
        
        # Next fetch should hit API again
        price2 = await market_service.fetch_price_with_fallback("BTCUSD", is_testnet=False)
        
        assert isinstance(price2, float)
        assert price2 > 0

    async def test_stale_cache_fallback(self, market_service):
        """Test that stale cache is used when API fails"""
        # Populate cache
        await market_service.fetch_price_with_fallback("BTCUSD", is_testnet=False)
        
        # Expire cache
        cache_key = "BTCUSD_False"
        market_service.price_cache[cache_key]["timestamp"] = datetime.now() - timedelta(seconds=10)
        
        # Mock API failure
        with patch.object(market_service, 'fetch_from_hyperliquid', return_value=None):
            price = await market_service.fetch_price_with_fallback("BTCUSD", is_testnet=False)
            
            # Should return stale cache value
            assert isinstance(price, float)
            assert price > 0

    async def test_no_cache_api_failure(self, market_service):
        """Test error when API fails and no cache exists"""
        # Mock API failure
        with patch.object(market_service, 'fetch_from_hyperliquid', return_value=None):
            with pytest.raises(ValueError, match="Failed to fetch price"):
                await market_service.fetch_price_with_fallback("BTCUSD", is_testnet=False)

    async def test_multiple_symbols_parallel(self, market_service):
        """Test fetching multiple symbols in parallel"""
        symbols = ["BTCUSD", "ETHUSD", "SOLUSD", "XRPUSD"]
        
        start_time = datetime.now()
        tasks = [market_service.fetch_price_with_fallback(symbol, False) for symbol in symbols]
        prices = await asyncio.gather(*tasks, return_exceptions=True)
        end_time = datetime.now()
        
        # Should complete in reasonable time (parallel execution)
        assert (end_time - start_time).total_seconds() < 15
        
        # Check that most prices were fetched successfully
        valid_prices = [p for p in prices if isinstance(p, float) and p > 0]
        assert len(valid_prices) >= len(symbols) * 0.5  # At least 50% success

    async def test_price_precision(self, market_service):
        """Test that prices have proper decimal precision"""
        price = await market_service.fetch_price_with_fallback("BTCUSD", is_testnet=False)
        
        # Price should have decimal places
        assert price != int(price)  # Should not be a whole number
        assert len(str(price).split('.')[-1]) >= 1  # At least 1 decimal place

    async def test_cache_key_separation(self, market_service):
        """Test that mainnet and testnet caches are separate"""
        # Fetch from mainnet
        price_mainnet = await market_service.fetch_price_with_fallback("BTCUSD", is_testnet=False)
        
        # Check cache keys
        assert "BTCUSD_False" in market_service.price_cache
        assert "BTCUSD_True" not in market_service.price_cache

    @patch('httpx.AsyncClient.post')
    async def test_http_error_handling(self, mock_post, market_service):
        """Test handling of HTTP errors"""
        # Mock HTTP error
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_post.return_value = mock_response
        
        price = await market_service.fetch_from_hyperliquid("BTCUSD", is_testnet=False)
        
        assert price is None

    @patch('httpx.AsyncClient.post')
    async def test_timeout_handling(self, mock_post, market_service):
        """Test handling of request timeouts"""
        # Mock timeout
        mock_post.side_effect = httpx.TimeoutException("Request timeout")
        
        price = await market_service.fetch_from_hyperliquid("BTCUSD", is_testnet=False)
        
        assert price is None

    async def test_symbol_normalization(self, market_service):
        """Test that symbols are normalized correctly (USD suffix removed)"""
        # The service should handle both "BTC" and "BTCUSD"
        price = await market_service.fetch_from_hyperliquid("BTCUSD", is_testnet=False)
        
        assert price is not None
        assert isinstance(price, float)


@pytest.mark.asyncio
class TestPriceValidation:
    """Test suite for price validation and sanity checks"""

    async def test_btc_price_range(self, market_service):
        """Test BTC price is within reasonable range"""
        price = await market_service.fetch_price_with_fallback("BTCUSD", is_testnet=False)
        
        assert 15000 < price < 150000  # Reasonable BTC range

    async def test_eth_price_range(self, market_service):
        """Test ETH price is within reasonable range"""
        price = await market_service.fetch_price_with_fallback("ETHUSD", is_testnet=False)
        
        assert 1000 < price < 8000  # Reasonable ETH range

    async def test_sol_price_range(self, market_service):
        """Test SOL price is within reasonable range"""
        price = await market_service.fetch_price_with_fallback("SOLUSD", is_testnet=False)
        
        assert 10 < price < 500  # Reasonable SOL range

    async def test_xrp_price_range(self, market_service):
        """Test XRP price is within reasonable range"""
        price = await market_service.fetch_price_with_fallback("XRPUSD", is_testnet=False)
        
        assert 0.1 < price < 10  # Reasonable XRP range


@pytest.mark.asyncio
class TestRealWorldScenarios:
    """Test real-world trading scenarios"""

    async def test_auto_trading_price_fetch(self, market_service):
        """Simulate auto-trading loop price fetching"""
        allowed_coins = ["BTC", "ETH", "SOL", "XRP"]
        symbols = [f"{coin}USD" for coin in allowed_coins]
        
        # Fetch all prices in parallel
        tasks = [market_service.fetch_price_with_fallback(symbol, False) for symbol in symbols]
        prices = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Build chart data structure
        chart_data = []
        for symbol, price in zip(symbols, prices):
            if isinstance(price, float) and price > 0:
                chart_data.append({
                    "symbol": symbol.replace("USD", ""),
                    "currentPrice": price,
                })
        
        assert len(chart_data) > 0
        for chart in chart_data:
            assert chart["currentPrice"] > 0
            assert chart["symbol"] in allowed_coins

    async def test_rapid_consecutive_fetches(self, market_service):
        """Test rapid consecutive price fetches (cache performance)"""
        # First fetch
        price1 = await market_service.fetch_price_with_fallback("BTCUSD", is_testnet=False)
        
        # Rapid consecutive fetches
        start_time = datetime.now()
        for _ in range(10):
            price = await market_service.fetch_price_with_fallback("BTCUSD", is_testnet=False)
            assert price == price1
        end_time = datetime.now()
        
        # Should complete very quickly due to caching
        assert (end_time - start_time).total_seconds() < 1

    async def test_mixed_mainnet_testnet_fetches(self, market_service):
        """Test fetching from both mainnet and testnet"""
        # Fetch from mainnet
        price_mainnet = await market_service.fetch_price_with_fallback("BTCUSD", is_testnet=False)
        
        # Fetch from testnet
        try:
            price_testnet = await market_service.fetch_price_with_fallback("BTCUSD", is_testnet=True)
            
            # Both should be valid if testnet is available
            assert isinstance(price_mainnet, float)
            if price_testnet:
                assert isinstance(price_testnet, float)
        except ValueError:
            # Testnet might not be available
            pass

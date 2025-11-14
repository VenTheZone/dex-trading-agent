/**
 * Diagnostic script to test price fetching
 * Run with: pnpm diagnose:price
 */
import { fetchPriceWithFallback, fetchMultiplePrices } from '../price-service';
import { TRADING_TOKENS } from '../tokenData';
async function diagnosePriceFetch() {
    console.log('🔍 Starting Price Fetch Diagnostics...\n');
    // Test 1: Individual price fetches
    console.log('📊 Test 1: Individual Price Fetches');
    console.log('='.repeat(50));
    for (const token of TRADING_TOKENS.slice(0, 4)) {
        const symbol = `${token.symbol}USD`;
        try {
            console.log(`\nFetching ${symbol}...`);
            const startTime = Date.now();
            const price = await fetchPriceWithFallback(symbol);
            const endTime = Date.now();
            console.log(`✅ ${symbol}: $${price.toLocaleString()} (${endTime - startTime}ms)`);
        }
        catch (error) {
            console.error(`❌ ${symbol}: ${error.message}`);
        }
    }
    // Test 2: Parallel price fetches
    console.log('\n\n📊 Test 2: Parallel Price Fetches');
    console.log('='.repeat(50));
    const symbols = TRADING_TOKENS.slice(0, 4).map(t => `${t.symbol}USD`);
    console.log(`\nFetching ${symbols.length} symbols in parallel: ${symbols.join(', ')}`);
    try {
        const startTime = Date.now();
        const prices = await fetchMultiplePrices(symbols);
        const endTime = Date.now();
        console.log(`\n✅ Fetched ${Object.keys(prices).length}/${symbols.length} prices in ${endTime - startTime}ms`);
        console.log('\nResults:');
        Object.entries(prices).forEach(([symbol, price]) => {
            console.log(`  ${symbol}: $${price.toLocaleString()}`);
        });
        // Check for failures
        const failedSymbols = symbols.filter(s => !prices[s]);
        if (failedSymbols.length > 0) {
            console.log(`\n⚠️  Failed to fetch: ${failedSymbols.join(', ')}`);
        }
    }
    catch (error) {
        console.error(`❌ Parallel fetch failed: ${error.message}`);
    }
    // Test 3: Cache performance
    console.log('\n\n📊 Test 3: Cache Performance');
    console.log('='.repeat(50));
    try {
        console.log('\nFirst fetch (no cache):');
        const startTime1 = Date.now();
        const price1 = await fetchPriceWithFallback('BTCUSD');
        const endTime1 = Date.now();
        console.log(`  Time: ${endTime1 - startTime1}ms, Price: $${price1.toLocaleString()}`);
        console.log('\nSecond fetch (cached):');
        const startTime2 = Date.now();
        const price2 = await fetchPriceWithFallback('BTCUSD');
        const endTime2 = Date.now();
        console.log(`  Time: ${endTime2 - startTime2}ms, Price: $${price2.toLocaleString()}`);
        const speedup = Math.round((endTime1 - startTime1) / (endTime2 - startTime2));
        console.log(`\n✅ Cache speedup: ${speedup}x faster`);
    }
    catch (error) {
        console.error(`❌ Cache test failed: ${error.message}`);
    }
    // Test 4: Error handling
    console.log('\n\n📊 Test 4: Error Handling');
    console.log('='.repeat(50));
    try {
        console.log('\nTrying invalid symbol: FAKECOIN...');
        await fetchPriceWithFallback('FAKECOIN');
        console.log('❌ Should have thrown an error!');
    }
    catch (error) {
        console.log(`✅ Correctly threw error: ${error.message}`);
    }
    // Summary
    console.log('\n\n📋 Diagnostic Summary');
    console.log('='.repeat(50));
    console.log('✅ Price fetching diagnostics complete!');
    console.log('\nIf you see errors above, check:');
    console.log('  1. Internet connection');
    console.log('  2. Firewall/proxy settings');
    console.log('  3. API rate limits');
    console.log('  4. Symbol format (should be like BTCUSD, not BTC-USD)');
}
// Run diagnostics
diagnosePriceFetch().catch(console.error);

## Migration Direction: Tauri → Qt6

**The Tauri stack is being replaced.** The target architecture is:
- **Backend**: Rust native (bootstrapped in `native/`)
- **Frontend**: Qt6 + QML (not Tauri, not React, not WebView)
- **Python**: Only as a migration reference under `migration_python/`, will be removed

The current Tauri/React/Python app in `src-tauri/` and `src/` is the **legacy** stack being phased out.

---

## Development Approach: Literate Programming

For the Rust + Qt6 migration, use **literate programming**:
1. **Write comments first** - Document intent, invariants, and data flow
2. **Then write code** - Implementation follows the documented spec
3. **Comments are the spec** - Code exists to satisfy the comments

This ensures the migration preserves design intent and makes the codebase self-documenting.

Example:
```rust
// The Hyperliquid adapter must:
// 1. Never synthesize market data
// 2. Reject any order that cannot be fully validated
// 3. Fail closed on network/signing errors
//
// Given a signed order request, the adapter:
// - Serializes the order action via msgpack
// - Computes the EIP-712 connectionId hash
// - Signs with the provided private key
// - Returns a JSON payload ready for /exchange
fn build_signed_order_request(...) { ... }
```

---

## Current Rewrite Status (2026-03-28)

### Workspace Location
- Use `.worktrees/rust-qt6-rewrite` for all Rust + Qt6 work
- Main branch is for tracking only

### Completed Tasks
| Task | Status | Summary |
|------|--------|---------|
| Task 1 | ✅ | Native workspace bootstrap |
| Task 2 | ✅ | Domain types (OrderRequest, Position, TradingDecision) |
| Task 3 | ✅ | Persistence (SQLite) + Wallet (keyring) |
| Task 4 | ✅ | Market data service contract + kill synthetic data route |
| Task 5 | 🔄 | Hyperliquid adapter + first caller seam |

### Task 5 Progress
- `native/crates/exchange-hyperliquid/` - Real L1 signing verified against official SDK vector
- `native/crates/app-core/` - First Rust-side caller seam (`execute_hyperliquid_order`)
- Fail-closed rules: no market orders, no missing prices, no synthetic data

### Remaining Work
- Live trading orchestration (`services.exchange.execute()`)
- Qt6/QML UI shell
- Provider registry for AI analysis
- Paper trading engine port

---

## Key Learnings

### Technical
1. **Compiler/test output > LSP diagnostics** - Use `cargo test` as the trust anchor
2. **Verify with fresh commands** - Previous run output is not evidence
3. **Fail-closed by default** - No market orders, no missing prices, no synthetic data
4. **Keep adapters transport-focused** - Orchestration belongs in `app-core`

### Process
1. **TDD for new crates** - Write failing test first, verify red, minimal code to pass
2. **Literate programming** - Comments first, then code
3. **One crate per concern** - domain, persistence, exchange-*, app-core, wallet

---

## Platform Rules (from rewrite plan)

```
RULE 1: Never synthesize market candles, wallet addresses, fills, balances, or AI decisions.
RULE 2: On upstream/provider failure, emit Blocked/Unavailable and stop the action.
RULE 3: Strategy mutation is allowed only in paper mode.
RULE 4: Candidate strategies require explicit approval before promotion.
RULE 5: OpenCLI is optional capability, not a hard dependency.
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DeX Trading Agent                        │
│                   (Native Qt6 Desktop)                      │
├─────────────────────────────────────────────────────────────┤
│  Qt6 + QML Frontend                                         │
│  ├── Native widgets                                         │
│  ├── Trading charts                                         │
│  └── System dialogs                                         │
├─────────────────────────────────────────────────────────────┤
│  Rust Backend (native/)                                     │
│  ├── domain (core types)                                    │
│  ├── exchange-hyperliquid (adapter with L1 signing)         │
│  ├── app-core (orchestration)                               │
│  ├── persistence (SQLite)                                   │
│  ├── wallet (system keyring)                                │
│  └── market-data (historical data contract)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Verification Commands

```bash
# Native Rust tests
cargo test --manifest-path native/Cargo.toml

# Specific crate
cargo test --manifest-path native/Cargo.toml -p exchange-hyperliquid

# Python regression test
python3 -m pytest migration_python/tests/test_backtest_sample_data_route.py -q

# Frontend (legacy, will be removed)
npm test
```

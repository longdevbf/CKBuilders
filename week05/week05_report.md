# CKB Weekly Report - Week 5

**Reporting period:** 12 October 2026
**Participant:** Long Tran

## 1. Week 5 Overview

This week had two parts.

**Part 1: on-chain scripts in Rust.** I set up the toolchain, built two contracts from the `ckb-script-templates` project, ran them with `ckb-debugger`, and tested them with `ckb-testtool`.

- `hello-world`: prints `Hello World` and returns 0.
- `simple-print-args`: loads its own script and prints the length and the bytes of the script `args`.

I also dumped the test transaction to a JSON file and replayed it with `ckb-debugger`, which gave the same result as the Rust test. The project is at [`ckb-rust-script/`](./ckb-rust-script/).

**Part 2: marketplace update with `ckb-dex-sdk`.** I changed the Week 4 marketplace so that DOBs for sale are locked by the DEX contract instead of an escrow wallet. The server builds the list / buy / cancel transactions with `@nervina-labs/ckb-dex` (ckb-dex-sdk), and the user's wallet signs them. A buyer now pays the seller and takes the DOB in one atomic transaction, and the server no longer holds a private key. The app is at [`../marketplace/`](../marketplace/).

This is the smart-contract step I planned at the end of Week 4. I used the existing DEX contract, not a contract of my own.

## 2. Environment

**Part 1**
- WSL (Ubuntu) on Windows 11, project on `/mnt/d`
- Rust with the `riscv64imac-unknown-none-elf` target (CKB-VM runs RISC-V)
- LLVM / clang 19, installed with `llvm.sh`
- `ckb-std` 1.1.0 (contracts), `ckb-testtool` 1.1.1 (tests), `ckb-debugger`
- Contracts use Rust edition 2024 and `no_std`

**Part 2**
- CKB Testnet, Next.js 16.3.8, React 19.2.8
- `@nervina-labs/ckb-dex` 0.7.0 (new this week)
- `@ckb-ccc/connector-react` 2.2.2 and `@ckb-ccc/shell` 1.3.15, as in Week 4
- PostgreSQL on Neon, accessed with `pg`

## 3. Evidence (Part 1)

| ID | Step | Screenshot |
|---|---|---|
| 01 | Build `hello-world` with `make build` | [`built_success_smartcontract.png`](./evidence/built_success_smartcontract.png) |
| 02 | Run `hello-world` with `ckb-debugger` | [`run_with_debugger(hello-world).png`](./evidence/run_with_debugger%28hello-world%29.png) |
| 03 | Build both contracts, including `simple-print-args` | [`built_simple_print_args_success.png`](./evidence/built_simple_print_args_success.png) |
| 04 | Run `simple-print-args` with `ckb-debugger` (no args) | [`run_with_debugger(simple-prints-args).png`](./evidence/run_with_debugger%28simple-prints-args%29.png) |
| 05 | Run the test with `ckb-testtool` | [`run_test_with_ckb-testtool.png`](./evidence/run_test_with_ckb-testtool.png) |
| 06 | Transaction dumped to JSON | [`field_data.png`](./evidence/field_data.png) |
| 07 | Replay the JSON with `ckb-debugger` | [`test_simple_print_args_json.png`](./evidence/test_simple_print_args_json.png) |

## 4. Part 1: Results

| Run | Output | Cycles |
|---|---|---|
| `ckb-debugger --bin build/release/hello-world` | `Hello World`, run result 0 | 7102 |
| `ckb-debugger --bin build/release/simple-print-args` | `Args Len: 0`, `Args Data: []`, run result 0 | 17098 |
| `cargo test test_simple_print_args` (args `[42]`) | `Args Len: 1`, `Args Data: [2a]`, test passed | 17832 |
| `ckb-debugger -f tests/test-vectors/test_simple_print_args.json` | `Args Len: 1`, `Args Data: [2a]`, run result 0 | 17832 |

Running the binary directly gives empty args, because no script is attached. The test builds a lock script with `args = [42]` (`0x2a`), so the contract prints one byte. The JSON replay matches the test exactly, including the cycle count.

## 5. Part 1: How it works

**Project structure**

| Path | Role |
|---|---|
| `contracts/hello-world`, `contracts/simple-print-args` | The on-chain scripts, compiled to RISC-V |
| `tests/` | Rust tests that run the compiled scripts in a mock chain (`ckb-testtool`) |
| `build/release/` | Output of `make build`, the binaries the tests and the debugger load |
| `Makefile`, `scripts/find_clang` | Build settings and the clang finder |

**Contract:** `ckb_std::entry!` sets the entry point and `default_alloc!` sets up the heap. `program_entry` returns `0` for success and a non-zero value for failure. `simple-print-args` calls `load_script()`, reads `args().raw_data()` and prints it with `ckb_std::debug!`.

**Build:** `make build` runs `cargo build --target=riscv64imac-unknown-none-elf --release` inside each contract with the needed `RUSTFLAGS` and clang, then copies the binary to `build/release/`.

**Test:** `test_simple_print_args` deploys the binary, builds a lock script with `args = [42]`, creates an input cell locked by it, builds a transaction and calls `verify_tx`. I added code that dumps the transaction as JSON with `context.dump_tx`, so the same transaction can be replayed with `ckb-debugger -f`.

## 6. Part 1: Problems and fixes

| Problem | Cause | Fix |
|---|---|---|
| `can't find crate for core` | The RISC-V target was not installed | `rustup target add riscv64imac-unknown-none-elf` |
| `Cannot find clang of version 16+`, then `Clang compiler not found` in `ckb-std` | `ckb-std` compiles some C files. `scripts/find_clang` only looks for `llvm-strip` and `-19` to `-22` | Install LLVM 19 with `llvm.sh` |
| `ckb-debugger` said `No such file or directory` | I was in the wrong folder and the binary had not been built yet | Run from `ckb-rust-script/` after a successful `make build` |
| `cannot find macro vec` and `ckb_testtool` not found in the contract | I had put test code (`Context::new`, `ckb_testtool`) inside the contract | Keep that code in `tests/`, the contract only reads its args |
| Hundreds of errors in `make build`, in crates such as `futures-core-preview` | I had added `capsule` to the contract's `Cargo.toml`. It pulls in many `std`-only crates | Remove `capsule`, a contract should only depend on `no_std` crates such as `ckb-std` |
| Thousands of errors in `serde_core` | I ran `cargo build --target=riscv64imac-unknown-none-elf` at the workspace root. That also builds the `tests` crate, which needs `std` | Use `make build`, and run tests without `--target` |

## 7. Part 2: Marketplace with ckb-dex-sdk

**What changed from Week 4**

| | Week 4 | Week 5 |
|---|---|---|
| Who holds a DOB for sale | A market escrow wallet, private key on the server | The DEX contract (an on-chain lock script) |
| Who signs list / buy / cancel | The server (market wallet) for the transfer | Only the user's wallet |
| Buying | Two steps: buyer pays, then the market sends the DOB | One atomic transaction: pay the seller and take the DOB |
| Cancel | No signature check | The DEX contract only accepts it when the seller's own lock signs |
| Source of truth | The database | The chain. The database is a copy |

**Structure**

| File | Role |
|---|---|
| `app/services/dexService.ts` | Builds the **unsigned** list / buy / cancel transactions with `buildMakerTx`, `buildTakerTx`, `buildCancelTx` |
| `app/services/chainService.ts` | Reads a Spore from the chain. If its lock is the DEX lock, it is `listed` and the owner and price are decoded from the lock args (`OrderArgs`). Otherwise it is `owned` |
| `app/api/nfts/[id]/list`, `buy`, `cancel` | Check the request against the chain, then return the unsigned transaction |
| `app/api/nfts/[id]/sync` | Copies the on-chain state (status, owner, price) into the database |
| `app/lib/dexClient.ts` | Browser side: `requestTx`, `signAndSend` (sign with the CCC signer and wait for commit), `syncUntil` |

**Flow**

1. **Sell:** the server checks that the DOB is `owned` on-chain by the seller and that the price covers the minimum cell capacity. It builds an order transaction. The seller signs it and the DOB moves into the DEX contract. Then `/sync` saves the price and `listed` status.
2. **Buy:** the server reads the order from the chain, never from the database, and builds a transaction where the buyer pays the seller and takes the DOB. The DEX contract enforces the price. The buyer signs and sends it.
3. **Cancel:** the server builds a transaction that takes the DOB back from the order cell. The seller signs it.
4. After each transaction, the browser calls `/sync` until the DOB reaches the expected status, so the marketplace page shows the new state.

**Details that needed care**

- **List package.** The order cell is bigger than a plain Spore cell, because its lock args hold the seller's lock and the price. The seller pays the extra capacity (`listPackage`) and gets it back as change when the order is filled or cancelled. To make `price` the net amount both sides pay and receive, the on-chain order value is `price + listPackage`, and `chainService` subtracts it when reading.
- **Stale cell dep.** `ckb-dex` 0.7.0 hard-codes a DEX deployment cell that is no longer live on testnet, so buy and cancel failed with `Resolve failed Unknown(OutPoint...)`. The DEX lock is a Type ID script, so I look up the current cell by its Type ID with `findSingletonCellByType` and replace the SDK's cell dep before the transaction is signed.
- **Indexer lag.** The indexer can be a few seconds behind a committed transaction, so `syncUntil` retries up to 10 times, 1.5 seconds apart.

## 8. What I learned

**Rust scripts**
- A CKB script is a RISC-V binary with no `std`. Its dependencies must be `no_std`, and test code and test crates stay out of it.
- `make build` is not the same as a plain `cargo build`. It sets `RUSTFLAGS`, sets the C compiler for `ckb-std`, builds only the contracts and copies the binaries to `build/release/`.
- A script reads its own `args` with `load_script()`. The same script behaves differently with different args, which is how a lock script gets its parameters. The DEX contract does the same: the order cell's lock args carry the seller's lock and the price.
- `ckb-debugger` is useful for quick checks and for cycle counts. A JSON dump from `ckb-testtool` lets me replay a failing transaction outside the test code.

**Marketplace**
- Moving the rule into a lock script is what makes the trade atomic and trustless. The contract checks the price on-chain, so the server only builds transactions and never needs a key.
- The server should read the chain, not the database, before building a payment. The database can lag or be wrong, the chain cannot.
- An SDK can fall behind the network. Its hard-coded cell dep was stale, and a Type ID lookup fixed it without waiting for a new release.

## 9. Limitations

- The two Rust contracts only print. They do not validate anything yet, so they are not usable as a real lock script.
- The marketplace uses the existing DEX contract. I did not write or deploy a lock script of my own, and I have not deployed any of my own contracts to testnet.
- The marketplace depends on the DEX contract's Type ID deployment staying live. The cell dep workaround is a patch on top of the SDK.
- `ckb_std::debug!` output only shows up in debug runs.
- The `README.md` in `ckb-rust-script/` and in `marketplace/` are still the template's default.

## 10. Next week

Next week I will write a contract that actually validates something, for example a lock script that reads its `args` and rejects the transaction when a condition is not met, and deploy it to CKB testnet. After that I can compare it with the DEX contract that the marketplace uses now.

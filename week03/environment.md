# Week 3 - Environment Assessment

| Item | Value |
|---|---|
| OS | Windows 11 Home Single Language (10.0.26200), x86_64 |
| Shell | PowerShell 5.1 |
| Node.js | v22.14.0 |
| Rust / Cargo | rustc 1.97.1 / cargo 1.97.1 |
| Docker | 28.0.1 (installed, **not used** - native binary chosen) |
| ckb-cli | 1.12.0 |
| Fiber (fnn / fnn-cli) | **0.9.1** (commit `9a561b3 2026-09-10`) |
| Network | CKB **testnet** (`chain_hash 0x10639e08...3f9606`) |
| CKB RPC | `https://testnet.ckbapp.dev/` (public node, no local CKB node needed) |

## Notes

- Week 1/2 used an OffCKB devnet (`127.0.0.1:8114`). Fiber runs against the **public testnet**, so the devnet is not required this week.
- Fiber binaries were not present before this week; they were installed with the official PowerShell installer (see [setup.md](./setup.md)).

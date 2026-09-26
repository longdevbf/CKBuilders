# Week 3 - Fiber Network Installation & Setup

Reference: [Run a Native Node](https://www.fiber.world/docs/quick-start/run-a-node/rust)

## 1. Installation method

Precompiled native release **Fiber v0.9.1 (windows-x86_64)** installed with the official installer.
Reason: no compile step / toolchain dependency, and the bundle ships `fnn.exe`, `fnn-cli.exe` and the testnet/mainnet config templates.

```powershell
$env:INSTALL_REF = "v0.9.1"
$env:FNN_VERSION = "0.9.1"
$env:NETWORK     = "testnet"
$env:INSTALL_DIR = "$HOME\.fiber"
irm https://raw.githubusercontent.com/nervosnetwork/fiber/v0.9.1/tools/install/install.ps1 | iex
```

The installer downloads `fnn_v0.9.1-x86_64-windows.tar.gz`, prepares `config.yml` from the bundled template, creates/imports a CKB account (`ckb\key`, encrypted on first start with `FIBER_SECRET_KEY_PASSWORD`) and generates `start-node.ps1`.

Evidence: [`0_install_fiber.png`](./evidence/0_install_fiber.png)

## 2. Configuration (testnet)

- Fiber chain: `testnet`
- CKB RPC: `https://testnet.ckbapp.dev/`
- Bootnodes (pre-configured):
  - `/ip4/54.179.226.154/tcp/8228/p2p/Qmes1EBD4yNo9Ywkfe6eRw9tG1nVNGLDmMud1xJMsoYFKy`
  - `/ip4/16.163.7.105/tcp/8228/p2p/QmdyQWjPtbK4NWWsvy8s69NGJaQULwgeQDT5ZpNDrTNaeV`
- On-chain scripts: FundingLock / CommitmentLock deployed on testnet, RUSD UDT whitelist.

## 3. Two-node topology

| | Node 1 (Alice) | Node 2 (Bob) |
|---|---|---|
| Base dir | `C:\Users\trand\.fiber` | `week03\node2` |
| P2P | `0.0.0.0:8228` | `0.0.0.0:8229` |
| RPC | `127.0.0.1:8227` | `127.0.0.1:8226` |
| Peer ID | `QmSVxVQvJbHxTaT3M4rkFn8YzReQ7YRbj9dmtafUctnS9m` | `QmPFcjjdM7YPXj44rsBMgAikoBd9bYn5fZ2deqS6LySAJQ` |
| Pubkey | `03a9b512f9bbbc660aaf63d6d594dc90023e77011041e66a014923904622bbc095` | `039757eb8a805b69167fb52fbd806f1a5baca54983b221d94021f67cb10a3f84a9` |
| Funding lock_arg | `0xfc9c9c461b9df18aa09a63be20bf7ad4a5ad05b2` | `0xc9420062167ddfbd1f079d304534937c53c9ff4d` |
| Testnet address | `ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq0unjwyvxua7x92pxnrhcst77k55kkstvslzkxs4` | `ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwfggqxy9nam7737puaxpznfymu20yl7ngep75gz` |

`week03\node2\ckb\key` and the node database are git-ignored (see `week03/.gitignore`).

## 4. Running the nodes

Node 1:
```powershell
cd $HOME\.fiber
.\start-node.ps1        # prompts for FIBER_SECRET_KEY_PASSWORD
```

Node 2:
```powershell
cd D:\CKBuilders\week03
$env:FIBER_SECRET_KEY_PASSWORD = "<node2-password>"
$env:RUST_LOG = "info"
& "$HOME\.fiber\fnn.exe" -c node2\config.yml -d node2
```

Query:
```powershell
.\fnn-cli.exe info                                # node 1 (default RPC 8227)
.\fnn-cli.exe -u http://127.0.0.1:8226 info       # node 2
```

## 5. Channel lifecycle commands used

```powershell
# Node 2 -> Node 1 (direct peer connection)
.\fnn-cli.exe -u http://127.0.0.1:8226 peer connect_peer --address /ip4/127.0.0.1/tcp/8228/p2p/QmSVxVQvJbHxTaT3M4rkFn8YzReQ7YRbj9dmtafUctnS9m

# Alice opens a 400 CKB channel to Bob (amount in shannons)
.\fnn-cli.exe channel open_channel --pubkey 039757eb8a805b69167fb52fbd806f1a5baca54983b221d94021f67cb10a3f84a9 --funding-amount 40000000000

# Bob creates a 1 CKB invoice
.\fnn-cli.exe -u http://127.0.0.1:8226 invoice new_invoice --amount 100000000 --currency Fibt --description "Week03 1 CKB payment"

# Alice pays it
.\fnn-cli.exe payment send_payment --invoice <invoice_address>
.\fnn-cli.exe payment get_payment --payment-hash <payment_hash>

# Inspect
.\fnn-cli.exe -u http://127.0.0.1:8226 invoice get_invoice --payment-hash <payment_hash>
.\fnn-cli.exe channel list_channels
```

Both testnet addresses were funded with 10,000 CKB each from https://faucet.nervos.org/.

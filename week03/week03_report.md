# CKB Weekly Report - Week 3

**Reporting period:** 26 September 2026
**Participant:** [Your Name]

## 1. Week 3 Overview

This week I looked at payment channels on CKB with Fiber Network. I installed Fiber v0.9.1 on Windows, ran two local nodes on CKB testnet, connected them, opened a channel between them and sent a 1 CKB payment through it.

## 2. Environment

Details are in [environment.md](./environment.md) and [setup.md](./setup.md).

- Fiber (fnn / fnn-cli): v0.9.1, testnet
- CKB RPC: `https://testnet.ckbapp.dev/`
- Node 1 (Alice): P2P 8228, RPC 8227
- Node 2 (Bob): P2P 8229, RPC 8226

## 3. Evidence

| ID | Step | Screenshot |
|---|---|---|
| 00 | Install Fiber with the official installer | [`0_install_fiber.png`](./evidence/0_install_fiber.png) |
| 01 | Both nodes running | [`1_node_running.png`](./evidence/1_node_running.png) |
| 02 | Node 2 connects to Node 1 | [`2_connect_peer.png`](./evidence/2_connect_peer.png) |
| 03 | Alice opens a 400 CKB channel to Bob | [`3_open_channel.png`](./evidence/3_open_channel.png) |
| 04 | Funding transaction committed on testnet | [`4_funding_tx_committed.png`](./evidence/4_funding_tx_committed.png) |
| 05 | Channel is `ChannelReady` (Alice 301 / Bob 0 CKB) | [`5_channel_ready.png`](./evidence/5_channel_ready.png) |
| 06 | Bob creates a 1 CKB invoice | [`6_create_invoice.png`](./evidence/6_create_invoice.png) |
| 07 | Alice pays the invoice, status `Success` | [`7_send_payment_success.png`](./evidence/7_send_payment_success.png) |
| 08 | Invoice is `Paid` on Bob's node | [`8_invoice_paid.png`](./evidence/8_invoice_paid.png) |
| 09 | Channel balance after payment (Alice 300 / Bob 1 CKB) | [`9_balance_after_payment.png`](./evidence/9_balance_after_payment.png) |

## 4. Result

| | Before payment | After payment |
|---|---|---|
| Alice (Node 1) | 301 CKB | 300 CKB |
| Bob (Node 2) | 0 CKB | 1 CKB |

- Channel ID: `0x9d9344545fa4bfc07053da6dbf00495c394682414c45c344b7debac68b0331ed`
- Funding tx: `0x574a73401ffa9d2612ed913a902ea2f692e7fe0e56aa5c650d4b944728143e4f` (testnet block 22546600, committed)
- Payment hash: `0x5736eef5e23590fe1aad07538ad8933f520dd037a4e77ab2e803e2ded364a598`, fee 0

## 5. What I learned

- Being connected as peers is not enough to pay. The channel has to be funded on-chain, reach `ChannelReady`, and the sender needs balance on their side.
- Order of steps: connect peer, open channel, wait for the funding tx, `ChannelReady`, create invoice, pay, balances change.
- Only the funding transaction went to CKB L1. The 1 CKB payment was settled between the two nodes inside the channel, with no on-chain transaction.
- An invoice holds the payment hash and amount. Bob's node marks it `Paid` after the payment completes.

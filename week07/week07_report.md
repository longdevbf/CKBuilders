# CKB Weekly Report - Week 7

**Reporting period:** 25 October 2026
**Participant:** Long Tran

## 1. Week 7 Overview

Last week CKBolt was a simulated prototype. This week I built **stage 3, live testnet swaps**. A hub service now runs a Lightning node (LND) and a Fiber node (fnn), and the app runs real swaps between my own wallets on two public test networks: Bitcoin **Mutinynet** (a signet) and **CKB testnet**.

Both directions worked end to end with real wallets:

- **CKB to BTC:** 1,000 CKB from a Fiber node running in my browser became 1,742 sats in my Lightning wallet (Alby Hub). It took 3.4 seconds.
- **BTC to CKB:** 1,000 sats from Alby Hub became 563.79 CKB in the browser node. It took 6.3 seconds.

In both swaps, the Lightning payment and the Fiber payment were locked to the same SHA-256 payment hash, and I checked that the revealed preimage opens it.

BTC to CKB did not work at first: my wallet could not find a route to the hub. Finding the cause took most of a day, and it is the main lesson of the week (section 5).

The hub runs on a VPS and is reached through an SSH tunnel. The app runs on my machine. It is not a public demo yet.

## 2. Environment

- CKBolt hub (NestJS 11) on a VPS: LND v0.21.4 and a Mutinynet bitcoind for Lightning, fnn v0.9.1 on CKB testnet for Fiber
- CKBolt web app (Next.js) on `localhost:3200`, in live mode against the hub
- Lightning wallet: Alby Hub v1.24.4 in Docker on Mutinynet, connected to the app with Nostr Wallet Connect (NWC)
- Fiber wallet: a Fiber node running in the browser (fiber-js 0.9.1, WebAssembly) on the app's `/app/fiber` page
- CKB wallet: JoyID on CKB testnet, connected through CCC, used to fund the Fiber node
- Faucets: Mutinynet faucet (sats and a Lightning channel), faucet.nervos.org (CKB), the RUSD faucet

## 3. Evidence

| ID | Step | Screenshot |
|---|---|---|
| 01 | Alby Hub on Mutinynet: balance and the first swap payout received | [`01_lightning_wallet_allbyhub.png`](./evidence/01_lightning_wallet_allbyhub.png) |
| 02 | JoyID testnet wallet funded with CKB, RUSD and BTCPP | [`02_fund_joyid_wallet_tokens.png`](./evidence/02_fund_joyid_wallet_tokens.png) |
| 03 | Fiber's Browser Node Lab: a WASM node ready to connect to a router | [`03_run_fiber_node.png`](./evidence/03_run_fiber_node.png) |
| 04 | Browser Node Lab: keysend payment to the public node | [`04_fund_to_pub_node.png`](./evidence/04_fund_to_pub_node.png) |
| 05 | CKBolt: the browser Fiber node, unlocked with its password | [`05_fiber_node_on_CKBolt.png`](./evidence/05_fiber_node_on_CKBolt.png) |
| 06 | CKBolt: the node running, its on-chain CKB, connected to the hub | [`06_run_fiber_node_on_CKBolt.png`](./evidence/06_run_fiber_node_on_CKBolt.png) |
| 07 | CKBolt: fund the node from the CKB wallet | [`07_send_to_pub_node.png`](./evidence/07_send_to_pub_node.png) |
| 08 | JoyID asks to sign the transfer to the node | [`08_waitting_confirmation.png`](./evidence/08_waitting_confirmation.png) |
| 09 | Fiber wallet in the swap card: browser node running, hub connected | [`09_connect_fiber_browser_node.png`](./evidence/09_connect_fiber_browser_node.png) |
| 10 | Lightning wallet connected (NWC); an amount below the minimum is refused | [`10_connect_lightning.png`](./evidence/10_connect_lightning.png) |
| 11 | Swap quote: 1,000 CKB to 1,742 sats | [`11_swap_ckb_to_btc.png`](./evidence/11_swap_ckb_to_btc.png) |
| 12 | Swap complete: CKB to BTC | [`12_swap_success.png`](./evidence/12_swap_success.png) |
| 13 | Swap quote: 1,000 sats to 562.36 CKB | [`13_swap_btc_to_ckb.png`](./evidence/13_swap_btc_to_ckb.png) |
| 14 | Swap complete: BTC to CKB | [`14_swap_btc_to_ckb_success.png`](./evidence/14_swap_btc_to_ckb_success.png) |
| 15 | Alby Hub: the 1,000 sats sent for the BTC to CKB swap | [`15_alyhub.png`](./evidence/15_alyhub.png) |

## 4. Design

**Two wallets on each side.** Lightning and Fiber are separate networks, so the user and the hub each need a wallet on both.

| | CKB side (Fiber) | Bitcoin side (Lightning) |
|---|---|---|
| User | Fiber node in the browser (holds CKB) | Alby Hub (holds sats) |
| Hub | Fiber node, fnn (holds CKB) | LND (holds sats) |

**Channels.** Each network needs a channel between the user and the hub:

- **Fiber.** The hub opens a channel to the user's browser node and puts 2,000 CKB on its own side. The user's node adds the CKB the user chooses when it accepts: 1,200 CKB by default, and I used 50,000. The hub's side is what the user can *receive* (BTC to CKB); the user's side is what the user can *send* (CKB to BTC). The hub only takes payments over channels it opened itself, because it knows their safety delay. The opener of a channel sets that delay, and fnn does not report it.
- **Lightning.** Alby Hub has a channel from Megalith, the Mutinynet LSP, and the hub has a channel to Megalith. Payouts to the user go through it. For BTC to CKB, Alby Hub needs a channel straight to the hub (section 5).

**A CKB to BTC swap, step by step**

| Step | What happens | Network |
|---|---|---|
| 1 | Alby Hub makes an invoice for the sats, with a payment hash | Lightning |
| 2 | The hub makes a Fiber hold invoice for the CKB, with the same hash, and locks the quote | Fiber |
| 3 | The browser node pays it. The CKB is held: the hub cannot take it yet | Fiber |
| 4 | The hub pays the sats to Alby Hub, which reveals the preimage to claim them | Lightning |
| 5 | The hub uses the preimage to collect the held CKB | Fiber |

BTC to CKB is the same in the other direction: Alby Hub pays a Lightning hold invoice, and the hub pays the browser node on Fiber. Either both payments complete or the hold is cancelled and the payer gets the funds back.

**Quotes.** The hub signs a firm quote from a median of exchange prices, plus a 1% fee, paid from its own liquidity. Each swap is between 1,000 and 20,000 sats, and a quote is valid for about 3.5 minutes.

## 5. What I built and tried

**Wallets (01, 02).** I ran Alby Hub (an LDK node) in Docker on Mutinynet and got a Lightning channel from the Mutinynet faucet. I created an NWC connection with only the permissions the app needs and a budget. The app keeps the NWC secret in memory and never sends it to the hub. The JoyID testnet wallet held 50,159.9972 CKB, 40 RUSD and 0.1 BTCPP.

**Fiber's Browser Node Lab (03, 04).** Before using my own node page, I tried the Fiber team's lab at fiber.world. It starts Fiber as WebAssembly in the browser, connects to the public router `bottle` over WSS and opens a channel. A 1 CKB keysend payment to the public node succeeded with a fee of 0. A 1,000 CKB payment failed with "max outbound liquidity 400 CKB". That error was the same lesson as in CKBolt: a channel can only send what is on your side of it.

**The browser Fiber node in CKBolt (05-08).** The `/app/fiber` page runs the same fiber-js node:

- The node's keys are encrypted with a password and stored in the browser. The page asks for the password to start the node (05).
- The page runs isolated (cross-origin isolation), as fiber-js needs, and dials the hub over WebSocket.
- Screenshot 06 shows the node running with 159,649.99999754 CKB at its own address, and connected to the hub.
- "Fund this node" opens a funding page where the CKB wallet signs a transfer through CCC. Screenshot 07 shows the funding presets; screenshot 08 shows JoyID asking to sign 600.00051461 CKB, including a 0.00051461 CKB fee.
- The node page has a field "Your node puts in", the CKB the node adds to the hub's channel. After I set 50,000 CKB and asked the hub for a channel, the swap card showed "Can send 49,901 CKB" (11). The 99 CKB difference is the channel's reserve.

**Connecting the wallets in the swap card (09, 10).** The swap card connects the Fiber wallet (browser node or own node) and the Lightning wallet (NWC or WebLN).

- Screenshot 09 is from earlier in the day, after my first swap of 800 CKB on the default 1,200 CKB channel. It shows Send 301 and Receive 2,701 CKB: the 800 CKB had moved to the hub's side.
- Screenshot 10 shows that 30 CKB is refused, because swaps run from 1,000 to 20,000 sats.

**Real swaps (11-15).** These are the swaps I ran with my own wallets, as recorded by the hub:

| Time (UTC) | Direction | Paid | Received | Result | Duration |
|---|---|---|---|---|---|
| 11:48 | CKB to BTC | 800 CKB | 1,395 sats | Complete | 3.5 s |
| 12:47 | CKB to BTC | 1,000 CKB | 1,742 sats | Complete (12) | 3.4 s |
| 13:26 | BTC to CKB | 1,000 sats | 563.79 CKB | Complete (14) | 6.3 s |

The quote in screenshot 11 was 1 BTC = 56.8M CKB with a 1% fee.

Evidence for the BTC to CKB swap `908d488b`:

- **Payment hash:** `1ff22e62d993d0852dba87543b625d425cba3ce4722f4f046b2c5c82873508f1`
- **Preimage:** `4dbdfdec9536d96c57b5fb4c0c858135f584f150c8e9c1e4cfdc764e5c901ecf`
- **Check:** `sha256(preimage)` equals the payment hash.
- **Timeline in the hub's events:**
  - 13:26:01.6, created;
  - 13:26:04.5, Lightning payment held;
  - 13:26:06.6, Fiber payout sent;
  - 13:26:07.9, payout arrived and the held payment collected.

Before the fix below, five BTC to CKB attempts failed in the wallet. In each case the hub cancelled the swap and nothing was paid; Alby Hub lists them as "Failed" (15).

**Why BTC to CKB failed: the CLTV budget.** Alby Hub kept answering `RouteNotFound`. I took the cause apart:

- **Fiber's minimum lock.** fnn locks any payment for at least 400 minutes: 160 minutes for the invoice's minimum final expiry, plus a 4-hour random expiry reserve. I measured this on my devnet: smaller `tlc_expiry_limit` values are refused or find no path.
- **The hold invoice must outlast it.** The Lightning hold invoice has to stay valid longer than the Fiber lock, or the hub could lose funds. Mutinynet makes a block every 30 seconds, so 400 minutes is about 800 blocks. With margins, the hold invoice needs 861 blocks.
- **LDK's limit.** Alby Hub is built on LDK. LDK accepts at most 1,008 blocks for the whole route and keeps 80 of them for a random offset (`router.rs` in rust-lightning). That leaves 1,008 - 861 - 80 = 67 blocks for the nodes between the wallet and the hub.
- **The routes I tried.**
  - The first route went through Megalith (144 blocks) and the faucet node (80 blocks): far over the limit.
  - I replaced the hub's channel to the faucet node with a private channel to Megalith (220,000 sats, 100,000 pushed to Megalith so the hub can receive), with a route hint in every hold invoice. Even one Megalith hop (144) is over 67, so it still failed. That is how I found LDK's 80-block reserve.
- **The fix.** Alby Hub connected to the hub's LND, and the hub opened a 30,000-sat channel to it, pushing 20,000 sats so the wallet can pay. With no node in between, the swap completed at once (14). The hub now counts LDK's 80 blocks when it sizes a hold invoice, and refuses a swap that a payer could not pay.

This is a Mutinynet problem. With Bitcoin's 10-minute blocks, the same hold invoice is about 115 blocks, so LDK wallets can pay through several hops.

**Tests.** All of these pass:

| What | Result |
|---|---|
| Hub unit tests | 2,904 |
| Hub end-to-end tests on a local devnet (both directions and refunds) | 23 |
| Web app tests (unit, plus end-to-end on desktop and mobile) | 727 |
| Deploy tooling tests | 339 |
| Readiness check on the VPS | 38 OK, 0 failing |
| Smoke test on the VPS (hub-run demo wallets) | Both directions |


## 6. What I learned

- **Each side of a channel is separate money.** A node can only send what is on its side and only receive what is on the other side. So the hub has to fund its side for users to receive, and the user has to put CKB in to send. Every swap moves the hub's stock: CKB to BTC spends its sats and earns CKB.
- **Funding a node's address is not funding its channel.** CKB sent to the node's address stays on chain. An open Fiber channel cannot be topped up (no splicing in fnn 0.9), so putting in more means closing it and opening a new one.
- **Time locks set the limits of a cross-chain swap.** Fiber's 400-minute minimum lock, the hold invoice's margins and the payer wallet's own limits all have to fit together. On a network with 30-second blocks, the margin left for routing is small.
- **Wallet implementations differ.** LND accepts 2,016 blocks; LDK accepts 1,008 and keeps 80 for privacy. A hub has to plan for the strictest wallet its users have, and read the wallet's source code when an error says only "no route".
- **A full Fiber node runs in a browser.** It needs cross-origin isolation for `SharedArrayBuffer` and can only dial WebSocket peers. It works only while its tab is open.
- **An NWC secret can spend money.** Alby Hub shows it only once. The app should keep it in memory only and never send it anywhere else.

## 7. Limitations and open issues

- **Not public yet.** The hub is reached only through an SSH tunnel. The browser node dials the hub over plain `ws://`, which browsers allow only from `localhost`.
- **Lightning channels by hand.** On Mutinynet, an Alby Hub (LDK) wallet needs its own channel with the hub to pay BTC to CKB. I opened it by hand. LND wallets do not need one.
- **Small inbound.** The hub puts 2,000 CKB into each channel it opens, so a new browser node can receive at most about 1,900 CKB (about 3,300 sats) in one swap. The swap limit is 20,000 sats. The hub's amount per channel should be raised to match.
- **Adding CKB to a channel takes four steps:** close the channel, choose the new amount, restart the node with its password, and ask again. The hub allows two channel requests per node a day.
- **The browser node is fragile.** Its tab must stay open during a swap, and there is no watchtower.
- **RUSD only in the smoke test.** RUSD swaps passed the hub's smoke test, but I have not swapped RUSD with my own wallets yet.

## 8. Next week

- **Public demo.** Put the hub behind HTTPS and WSS so browser nodes can connect from any site, and put the app online.
- **Inbound and adding CKB.** Raise the hub's inbound amount per channel to match the swap limit, and make adding CKB to the channel a single button.
- **LDK wallets on Mutinynet.** Let them get a channel with the hub without a manual step, or document it clearly in the app.
- **RUSD with real wallets.** Swap RUSD both ways with my own wallets.
- **Repositories and feedback.** Publish the repositories with developer notes, and ask the Nervos community for feedback.

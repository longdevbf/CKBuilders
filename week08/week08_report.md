# CKB Weekly Report - Week 8

**Reporting period:** 1 November 2026
**Participant:** Long Tran

## 1. Week 8 Overview

Last week the live swaps worked, but only on my machine: the app ran on `localhost`, it reached the hub through an SSH tunnel, and the user had to paste a Nostr Wallet Connect (NWC) secret to connect a Lightning wallet. This week I made CKBolt usable by anyone at [ckbolt.texlabs.org](https://ckbolt.texlabs.org), and I worked on three things:

1. **The Fiber node as an extension in the header.** The browser Fiber node now opens from a button in the top right corner of every page, like a wallet extension. It shows what the node can swap, its on-chain CKB and the hub connection, with pages for Add funds, Channels, Withdraw, Settings and History.
2. **Get paid and Pay for Fiber invoices.** Get paid creates a request with a Lightning invoice and a Fiber invoice. Pay reads a Lightning invoice, a Fiber invoice or a CKB address, and the node asks the user to confirm before it pays.
3. **No more NWC.** The app no longer asks for a wallet secret. The Lightning side works as on mainnet: CKBolt shows an invoice as a QR code for any Lightning wallet to pay, or the user pastes an invoice from their own wallet.

With my own wallets on the public demo, both directions completed:

- **CKB to BTC:** 1,649.11 CKB from the browser node became 2,600 sats in Alby Hub, in 4.5 seconds.
- **BTC to CKB:** 2,000 sats from Alby Hub became 1,245.24 CKB in the browser node, 2.9 seconds after the payment arrived at the hub.

Some flows still fail, mostly a Fiber payment from one browser node to another. Section 7 lists them; they are the work for next week.

## 2. Environment

- CKBolt web app (Next.js) on the public demo [ckbolt.texlabs.org](https://ckbolt.texlabs.org), in live mode
- CKBolt hub (NestJS) on a VPS behind HTTPS and WSS (Cloudflare Tunnel): LND v0.21.4 on Mutinynet, fnn v0.9.1 on CKB testnet
- Fiber wallet: the browser Fiber node (fiber-js 0.9.1, WebAssembly) in the header popup
- Lightning wallet: Alby Hub v1.24.4 in Docker on Mutinynet, used only by scanning or pasting invoices (no NWC)
- CKB wallet: JoyID on CKB testnet through CCC, to fund the browser node
- Faucets: faucet.nervos.org (CKB), faucet.mutinynet.com (sats and a Lightning channel)

## 3. Evidence

| ID | Step | Screenshot |
|---|---|---|
| 01 | The Fiber node popup in the header, locked, on the public site | [`01_open_fiber_node_popup.png`](./01_open_fiber_node_popup.png) |
| 02 | Node unlocked and running: Send and Receive per token, on-chain CKB, hub connected | [`02_unlock_and_start_node.png`](./02_unlock_and_start_node.png) |
| 03 | Add funds: the node's CKB testnet address as a QR code, and "Fund from a wallet" | [`03_add_funds_from_l1.png`](./03_add_funds_from_l1.png) |
| 04 | The funding page: 20,000 CKB from JoyID to the node, checked before sending | [`04_send_ckb_from_joyid.png`](./04_send_ckb_from_joyid.png) |
| 05 | JoyID asks to sign the transfer | [`05_sign_and_confirm.png`](./05_sign_and_confirm.png) |
| 06 | Transfer sent, with its transaction hash | [`06_fund_successfully.png`](./06_fund_successfully.png) |
| 07 | The node's on-chain balance after funding: 70,000 CKB | [`07_update_balance.png`](./07_update_balance.png) |
| 08 | Channels: "Your node puts in" and what each new channel lets the node send and receive | [`08_fund_to_channel.png`](./08_fund_to_channel.png) |
| 09 | The hub opens a 3,000 CKB channel to the node | [`09_fund_to_channel_successfully.png`](./09_fund_to_channel_successfully.png) |
| 10 | Get paid: a 1,000 CKB request, with Lightning and Fiber tabs | [`10_create_get_paid_invoice.png`](./10_create_get_paid_invoice.png) |
| 11 | Pay: the Fiber invoice pasted and decoded | [`11_pay_invoice.png`](./11_pay_invoice.png) |
| 12 | The node asks to confirm the payment | [`12_confirm_payment.png`](./12_confirm_payment.png) |
| 13 | Swap complete: CKB to BTC | [`13_swap_successful.png`](./13_swap_successful.png) |
| 14 | Details: swap id, payment hash, preimage, hash checked in the page | [`14_detail_swap.png`](./14_detail_swap.png) |
| 15 | Alby Hub: 2,600 sats received | [`15_payment_received.png`](./15_payment_received.png) |
| 16 | BTC to CKB: the hub's hold invoice as a QR code for any Lightning wallet | [`16_swap_from_lighting.png`](./16_swap_from_lighting.png) |
| 17 | Alby Hub pays the hold invoice | [`17_pay.png`](./17_pay.png) |
| 18 | Alby Hub: payment successful | [`18_pay_success.png`](./18_pay_success.png) |
| 19 | Swap complete: BTC to CKB | [`19_swap_successfully.png`](./19_swap_successfully.png) |

## 4. Design

**One wallet in the app.** Last week the swap card had two wallet buttons, one for Fiber and one for Lightning (NWC or WebLN). Now the only wallet the app holds is the user's Fiber node:

| | Before (week 7) | Now (week 8) |
|---|---|---|
| Fiber side | Browser node on its own page (`/app/fiber`) | Browser node in a popup in the header, on every page |
| Lightning side | NWC secret pasted into the app | A QR code or a pasted invoice, from any Lightning wallet |
| CKB L1 wallet | Funding page | Funding page, and where a withdrawal goes |
| Hub | SSH tunnel to `localhost` | Public HTTPS and WSS |

An NWC secret can spend the user's wallet, so removing it is also safer. A Lightning wallet now only needs to pay or create an invoice, as it would for any payment on mainnet.

**The Fiber node popup.** The popup is an iframe of `/app/wallet`. fiber-js needs `SharedArrayBuffer`, so its page must be cross-origin isolated. The popup gets that isolation from `Document-Isolation-Policy` in Chrome and Edge, so the rest of the site does not have to be isolated. Firefox and Safari open the node in a window instead. The popup has:

- **Home:** Send and Receive per token (what the node can swap now), on-chain CKB, the hub connection, the latest History.
- **Add funds:** the node's address with a QR code, and a link to the funding page where JoyID signs.
- **Channels:** the channel with the hub first, other nodes under Advanced.
- **Withdraw, Settings** (back up, restore, lock) and **History:** everything that moved money through the node.
- **Confirm:** when Pay asks the node to pay, the node shows the amount, payee, maximum fee and expiry, and pays only after the user confirms (12).

**Get paid.** One request gives two ways to pay:

| Tab | Invoice | How it settles |
|---|---|---|
| Lightning | The hub's hold invoice | A swap: the payer's sats are held, the hub pays the user's node in CKB on Fiber, then collects the sats |
| Fiber | The user's node's own invoice | A Fiber payment straight to the node |

Once one tab is paid, the node cancels the other, so a request is paid only once.

**Pay.** One field takes three kinds of input: a Lightning invoice (paid as a CKB to BTC swap), a Fiber invoice (the node pays it after the user confirms, 11-12), or a CKB address (an on-chain send).

## 5. What I built and tried

**The node in the popup (01-03).** The node is stored in the browser, encrypted with a password (01). After unlocking it showed 50,000 CKB on chain, no channel yet, and the hub connected (02). Add funds shows the node's address as a QR code (03).

**Funding from JoyID (04-07).** The funding page shows the From address (JoyID), the full To address, the amount and the network before sending (04). JoyID asked to sign 20,000.00051461 CKB, including a 0.00051461 CKB fee (05). The page then showed the transaction hash with a link to CKB Explorer (06). The first attempt failed with `NotAllowedError` because the passkey prompt timed out (05, top). Signing again worked. After confirmation the node held 70,000 CKB on chain (07).

**A channel with the hub (08-09).** The user chooses how much CKB the node puts into the hub's channel. The page shows what the new channel will let the node send and receive before asking. With 12,000 CKB it read "You can send 11,901 CKB · receive 4,901 CKB" (08); 99 CKB stays as the channel's reserve. With 10,000 CKB the hub opened a channel of 3,000 CKB on its side (09).

I lowered the hub's side from 5,000 to 3,000 CKB this week. With 5,000 CKB the hub refused with HTTP 422: it keeps enough Fiber liquidity to pay out swaps, and two old inbound channels held most of it. I also opened a 50,000 CKB public channel from the hub. The hub now reports in `GET /v1/fiber/node` whether it can fund a channel, so the button can wait instead of failing.

**Get paid and Pay with a Fiber invoice (10-12).** A 1,000 CKB request gave a Lightning and a Fiber invoice, both waiting (10). In a second browser profile with its own node, Pay read the Fiber invoice: 1,000 CKB to `02973869…7a87d919`, maximum fee 5 CKB (11). The node asked to confirm (12). The payment did not go through, though: the paying node found no route to the receiving node (section 7).

**CKB to BTC (13-15).** I created an invoice for 2,600 sats in Alby Hub and pasted it into CKBolt. The node paid the hub's Fiber hold invoice, and the hub paid Alby Hub.

| Item | Value |
|---|---|
| Swap id | `6018516d-8ab5-4e1a-8a99-dcf53ae6e031` |
| Paid | 1,649.10669955 CKB |
| Received | 2,600 sats (15) |
| Quote | 1 BTC = 62.79M CKB, fee 1% |
| Payment hash | `b4ad6b65cec2f21f12e12690cccd6f6bc71ba257807e6d2605f23ed97bf2c0a5` |
| Preimage | `071c3f9bcf06aebb6464b678cf081b6408373806d486d525aba5f504109529dc` |

The hub's timeline (UTC):

- 06:07:09.0, created;
- 06:07:10.9, the Fiber payment held;
- 06:07:13.2, the Lightning payout arrived;
- 06:07:13.5, the held CKB collected.

The whole swap took 4.5 seconds.

**BTC to CKB (16-19).** The swap card showed the hub's hold invoice as a QR code for any Lightning wallet (16). I paid it from Alby Hub (17-18).

| Item | Value |
|---|---|
| Swap id | `ece71fb9-2ff8-4fd5-a520-64a5fbb0bad0` |
| Paid | 2,000 sats |
| Received | 1,245.23639738 CKB (19) |
| Payment hash | `48052dd08488b9cad83daff59847d9b323a67fb203466accead39c80d4c3aa17` |
| Preimage | `a8bc002473d7f139340cd3fdbc25602e2ea1e8c4534e5d8f64a781e77c389e36` |

The hub's timeline (UTC):

- 06:33:02.8, created;
- 06:33:17.1, the Lightning payment held;
- 06:33:19.1, the Fiber payout started;
- 06:33:20.0, settled.

From the held payment to settlement took 2.9 seconds.

For both swaps, `sha256(preimage)` equals the payment hash. The page checks this (14), and I checked it again by hand.

Before it worked, Alby Hub failed to pay several times (`PaymentSendingFailed`). Its balance on the 30,000-sat channel from the hub was used up (17 shows a spendable balance of 0), and Alby Hub (LDK) cannot pay the hub's hold invoice through Megalith. That is the CLTV limit from week 7. Alby Hub needed a new channel straight to the hub's LND, funded from its own on-chain sats.

**Tests.** The web app's Playwright suite in Chrome: 930 passed, 6 failed and 1 skipped. None of the 6 comes from this week's change:

- 3 check that the web's copy of the hub contract matches the hub. They run only when the hub repository is next to the web repository, and the hub deployed on the VPS is behind the web's copy.
- 3 are accessibility (colour-contrast) checks on the swap pages. They fail the same way on the main branch.

I added two tests for "the hub cannot fund a channel now". The hub's tests for that change pass (11 of 11).

## 6. What I learned

- **A wallet extension is the right shape for a node.** A Fiber node is infrastructure, not a page. Putting it in a popup in the header, with its own Confirm step, makes it work like the wallets users already know.
- **Cross-origin isolation can be per frame.** `Document-Isolation-Policy` isolates only the node's iframe, so the rest of the site keeps working with JoyID popups and third-party pages.
- **Lightning should not need a secret.** A QR code or a pasted invoice works with any wallet, as it does on mainnet. NWC was convenient for testing but asked users for a key that can spend their wallet.
- **Private channels need route hints.** The hub opens private channels to browser nodes. A node can use its own channel to reach the hub, but another node cannot see the hub's channel to the payee. A test with `dry_run` showed "no path found" without a hint and a route with a `hop_hints` entry for the hub's channel.
- **Liquidity has to be planned per path.** The hub reaches the public Fiber testnet through only two channels of 901 CKB each. A test payment of 500 CKB found a route; 2,000 CKB did not. Inbound channels also take liquidity from swap payouts, so the hub has to check before it opens one.

## 7. Limitations and open issues

- **Fiber payments between two browser nodes fail.** Pay from one browser node to another's Fiber invoice gives "no path found", because the hub's channels to browser nodes are private. fiber-js 0.9.1 supports `hop_hints`. The hub should give the payer a hint for its channel to the payee.
- **Get paid's Lightning invoice lasts only 3 minutes.** The app asks the hub for an ordinary swap quote. The hub already supports a longer request quote (`purpose: "request"`, 15 minutes), but the app does not ask for it yet.
- **CKBolt's own invoice cannot be paid with CKBolt's Pay.** Pasting Get paid's Lightning invoice into Pay would make the hub pay itself. The app shows "This invoice expires before the quote" instead of saying why.
- **Changing "Your node puts in" needs a restart.** fnn reads the amount only when it starts.
- **Small payments to the public Fiber network.** The hub can send at most about 900 CKB to nodes outside CKBolt, until it opens larger public channels.
- **LDK wallets still need a channel with the hub** to pay BTC to CKB on Mutinynet (week 7).
- **The hub's source.** I made the hub changes this week directly on the VPS. They still need to go into the hub's main repository.

## 8. Next week

- **Fiber payments between browser nodes:** route hints from the hub, so Pay works from one browser node to another.
- **Get paid:** request quotes of 15 minutes for the Lightning invoice, and a clear message when someone tries to pay a CKBolt invoice with CKBolt.
- **Channel amount without a restart:** restart the node by itself, or accept the hub's channel by hand with the chosen amount.
- **More liquidity:** larger public Fiber channels from the hub, and RUSD on the public network.
- **Feedback:** share the public demo with the Nervos community and fix what testers report.

# CKB Weekly Report - Week 6

**Reporting period:** 18 October 2026
**Participant:** Long Tran

## 1. Week 6 Overview

This week I researched how CKB can connect to Bitcoin's Lightning Network, and I am building **CKBolt** on top of that research. CKBolt is a prototype at [ckbolt.texlabs.org](https://ckbolt.texlabs.org). Its goal is to let a user spend CKB anywhere Lightning works, and let a merchant accept Lightning payments but settle in CKB or a CKB token.

**Research.** I studied three things:

- **Lightning:** hold invoices, BOLT11 invoices and BIP21 links.
- **Fiber:** CKB's Lightning-style Layer 2 payment network, and its invoices.
- **Cross-Chain Hub (CCH):** Fiber's module for moving value between Fiber and Lightning, which my shared-hash design builds on.

**Build.** CKBolt is at stage 2 of 6, the prototype. It is a testnet app that shows every step a user takes. This week I used it with real testnet wallets through the three flows:

- **Get paid:** a merchant creates a checkout and the customer pays with Lightning.
- **Pay:** a user pastes a Lightning or Fiber invoice and pays it with CKB.
- **Swap:** CKB or CKB tokens to BTC or ETH, and BTC to CKB.

In the prototype the wallets, invoice decoding and prices are real. Settlement is a step-by-step simulation, so no funds move yet. Real payments are planned for stage 3, the devnet alpha.

## 2. Environment

- CKBolt prototype, stage 2 of 6 (web app, testnet)
- CKB wallet: UTXO Global Wallet on CKB testnet, connected through CCC
- Bitcoin wallet: UTXO Global on Bitcoin Testnet3
- Prices: CoinGecko reference prices, refreshed every 30 seconds (Binance, then KuCoin as fallbacks)

## 3. Evidence

| ID | Step | Screenshot |
|---|---|---|
| 01 | CKBolt landing page | [`01_ckbolt_interface.png`](./01_ckbolt_interface.png) |
| 02 | Roadmap, "We are here" at stage 2 | [`02_ckbolt_plan.png`](./02_ckbolt_plan.png) |
| 03 | The app: Get paid / Pay / Swap | [`03_PoC_demo.png`](./03_PoC_demo.png) |
| 04 | Connect the Bitcoin testnet wallet (UTXO Global popup) | [`04_connect_btc_testnet3_wallet.png`](./04_connect_btc_testnet3_wallet.png) |
| 05 | Bitcoin wallet connected, balance per address | [`05_connect_successfull.png`](./05_connect_successfull.png) |
| 06 | CKB wallet connected | [`06_connect_ckb_wallet_success.png`](./06_connect_ckb_wallet_success.png) |
| 07 | Get paid: new sale form and quote | [`07_demo_get_paid.png`](./07_demo_get_paid.png) |
| 08 | Checkout created (BOLT11 invoice and Fiber invoice) | [`08_created_checkout.png`](./08_created_checkout.png) |
| 09 | Simulate customer payment | [`09_simulate_customer_pay.png`](./09_simulate_customer_pay.png) |
| 10 | Pay: scan or paste a Lightning / Fiber invoice | [`10_demo_scan_lightning_or_fiber_invoice.png`](./10_demo_scan_lightning_or_fiber_invoice.png) |
| 11 | Sign the quote with the CKB wallet | [`11_sign_request.png`](./11_sign_request.png) |
| 12 | Swap: CKB to BTC quote and route | [`12_simulate_swap_2_network_interrface.png`](./12_simulate_swap_2_network_interrface.png) |

## 4. Design

CKBolt does not move coins between the two networks. It makes two payments that depend on the same secret.

- **Shared hash.** The customer's Lightning payment and the merchant's Fiber payment are locked to the same `sha256` payment hash. The merchant's node holds the preimage.
- **Hold invoice.** The hub holds the customer's sats and only claims them after it sees the preimage.
- **All or nothing.** The payment completes on both sides, or the hold is cancelled and the funds go back to the payer.
- **Quotes.** The CKB amount comes from a reference price, plus a 1% assumed hub spread and a 1% slippage limit. The user signs the whole quote, so the signature covers the amounts, the invoice and the destination.

**Route for a Lightning-to-Fiber payment**

| Step | Network |
|---|---|
| Customer pays the Lightning invoice, sats are held at the hub | Bitcoin L2 (Lightning) |
| Hub pays the merchant on Fiber, locked to the same hash | CKB L2 (Fiber) |
| Merchant claims the CKB, which reveals the preimage | CKB L2 (Fiber) |
| Hub uses the preimage to claim the held sats | Bitcoin L2 (Lightning) |

If the Fiber payment fails, the hub cancels the hold and the sats return to the customer at once.

## 5. What I built and tried

**Wallets (01-06).** The app connects a CKB wallet and a Bitcoin wallet. The Bitcoin wallet showed 0.00314935 tBTC in total, spread over five addresses of the same account. Most of it is on the Taproot addresses (0.00141969 and 0.00172966), while the wallet signs with its Native SegWit key, so the app adds all five into one balance. The CKB wallet showed 200,583.80 CKB.

**Get paid (07-09).** I created a sale of 5 USD for "Order 1042, flat white", settled in CKB.

| Item | Value |
|---|---|
| Merchant receives | 3,374.39 CKB (on Fiber) |
| Customer pays | 6,187 sats (from any Lightning wallet) |
| Reference rate | 1 BTC = 55,097,936 CKB |
| Price at reference | 6,125 sats |
| Hub spread and routing | 1% (assumed, paid by the customer) |
| Checkout validity | 119 seconds |

The checkout gives a BOLT11 Lightning invoice with a QR code for the customer, and a Fiber invoice (`new_invoice`, currency `Fibt`, `sha256`) for the merchant. Both share one payment hash. The Lightning invoice is an unsigned demo, so real Lightning wallets reject it. "Simulate customer payment" replays the four settlement steps from the Design section. Screenshot 09 shows steps 1 and 2 completed.

**Pay (10-11).** I pasted a demo Lightning invoice. The app detected a BOLT11 invoice on Bitcoin testnet for 21,000 sats and decoded the amount, description and expiry. It marked the signature as an unsigned demo invoice, so it decodes but no wallet can pay it. The quote:

| Item | Value |
|---|---|
| You pay | 11,680.55 CKB |
| Recipient receives | 21,000 sats on Lightning |
| Invoice value | 11,564.90 CKB |
| Hub costs (1%) | 115.65 CKB |
| Maximum paid (1% slippage) | 11,797.35 CKB |
| Quote expiry | 6 seconds |

The wallet balance check passed. To approve, I signed a message in UTXO Global. The message states the action (pay a Lightning invoice with CKB), the token (native CKB), the payment hash and where the output goes. The signature does not move funds. Real payments start in the devnet alpha.

**Swap (12).** I quoted 100,000 CKB to about 0.001798 BTC. The pay-with list offers CKB, ccBTC, RUSD, USDI and iCKB. The route panel shows: CKB wallet, a Fiber channel (planned), the hub on the Fiber side, the hub on the Lightning side (planned), and the recipient paid on Lightning.

## 6. Roadmap

| Stage | Name | Status |
|---|---|---|
| 1 | Research and design: shared-hash design, invoice formats, quote maths | Done |
| 2 | Prototype: a testnet app that shows every user step | Now |
| 3 | Devnet alpha: real payments between an LND node and a Fiber node | Next |

**Stage 1 (done):** research on Fiber, Cross-Chain Hub, hold invoices and Perun; a shared-hash design based on Fiber's Cross-Chain Hub pattern for wrapped BTC; BOLT11 codec checked against the spec's test vectors and the quote maths; the product concept and the site.

**Stage 2 (now):** wallets, checkout, invoice decoding, quotes both ways and simulated settlement are done. Two items are still open: a public source repository with developer notes, and feedback from the Nervos community. This stage is done when every user step works on testnet wallets and is covered by tests.

**Stage 3 (next):** a hub service running an LND node and a Fiber node, hold-invoice payments from Lightning to CKB and back, Fiber invoices read with `parse_invoice`, and firm quotes from the hub's own liquidity. It is done when one real payment works each way between LND and a Fiber node on one hash, and a refund works when the payout fails.

## 7. What I learned

- A cross-network payment can be built from two payments linked by one hash. No single party holds the funds of both sides, and a failure on one side cancels the other.
- A hold invoice lets the hub receive a payment but not spend it until the preimage appears. This is what makes the refund safe.
- Fiber is CKB's Lightning-style L2. Paying on Fiber needs a Fiber node, so a wallet signing a message is not enough for the real payment. This is why the CKB wallet only approves the quote in the prototype.
- A wallet message should show every important field. The CKBolt quote signature commits to the amounts in base units, the invoice and the output destination, so the user knows exactly what is signed.
- A Bitcoin account holds funds on several address types, and the app has to count them all while signing with the right key.
- Quotes from reference prices are only indicative. Real quotes have to come from the hub's liquidity and be checked against on-chain DEX prices and oracle feeds.

## 8. Limitations and open issues

- Settlement is simulated and the Lightning invoice is unsigned, so no real payment is possible yet.
- Quotes use CoinGecko reference prices. The 1% spread, routing cost and slippage are assumptions until the hub has real liquidity.
- Quotes and checkouts expire fast (6 seconds for a Pay quote, 119 seconds for a checkout), so the flow has to be done in one go.
- After the CKB wallet is connected, the app shows a red warning that the Bitcoin wallet "switched account or network" and asks to connect it again. It appears in screenshots 07, 10 and 12. The Pay and Swap flows I tested use the CKB wallet and still worked, but the Bitcoin wallet session should be kept after reconnecting. This is a bug to fix.
- On-chain BTC (Layer 1) is not supported. Moving it into Lightning needs a submarine swap, planned for the testnet beta.
- The public repository and developer notes are not published yet.

## 9. Next week

Next week I will study toward **stage 3, the devnet alpha**:

- Run an LND node and a Fiber node and connect them with one hub service.
- Read Fiber invoices with `parse_invoice` instead of only decoding them in the prototype.
- Make the first real hold-invoice payment in each direction on one payment hash, and test the refund when the Fiber payout fails.

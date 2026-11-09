# CKB Weekly Report - Week 9

**Reporting period:** 9 November 2026
**Participant:** Long Tran

## 1. Week 9 Overview

This week I closed most of last week's open issues, added more tokens and reviewed the whole project:

1. **Last week's issues.**
   - A browser node can now pay another browser node's Fiber invoice, through the hub.
   - Get paid's Lightning invoice lasts 15 minutes.
   - The node accepts the hub's channel without a restart.
   - The hub's VPS changes are in its repository.
2. **More tokens, by configuration.** The hub serves CKB, RUSD and cWBTC (test wrapped BTC on CKB testnet). A new token is one configuration entry, with no code change.
3. **Several channels in one step.** The node's "Channel with the hub" card lists every token; the user ticks the ones they want and presses one button.
4. **A cWBTC faucet** at [ckbolt-faucet.texlabs.org](https://ckbolt-faucet.texlabs.org).
5. **A review.** It found five bugs in the web app (fixed) and a safety gap in BTC to token swaps (fix written, not deployed yet). The hub's unit tests run again: 3,497 tests, all passing.

After the deploy on 7 November, both swap directions completed again on [ckbolt.texlabs.org](https://ckbolt.texlabs.org) in under 3 seconds.

## 2. Environment

- CKBolt web app on [ckbolt.texlabs.org](https://ckbolt.texlabs.org) (Vercel); hub on a VPS behind Cloudflare Tunnel: LND v0.21.4 on Mutinynet, fnn v0.9.1 on CKB testnet
- Tokens on Fiber: CKB, RUSD and cWBTC (xUDT, 8 decimals, 1 unit = 1 sat)
- Fiber wallet: the browser node (fiber-js 0.9.1) in the header popup; Lightning: any Mutinynet wallet; CKB: JoyID
- Faucets: faucet.nervos.org (CKB), faucet.mutinynet.com (sats), ckbolt-faucet.texlabs.org (cWBTC)

## 3. Evidence

| ID | Step | Screenshot |
|---|---|---|
| 01 | "Channel with the hub": one row per token, what the hub funds and the CKB reserve each needs | [`01_deposit_mutiltokens_to_1_channel.png`](./01_deposit_mutiltokens_to_1_channel.png) |
| 02 | A cWBTC channel asked for from the same card | [`02_open_wBTC_channel.png`](./02_open_wBTC_channel.png) |
| 03 | The swap card's tokens: CKB, RUSD, cWBTC | [`03_support_3_tokens_swap_and_pay_on_fiber.png`](./03_support_3_tokens_swap_and_pay_on_fiber.png) |
| 04 | The CKBolt cWBTC faucet | [`04_Ckbolt_faucet_WBTC.png`](./04_Ckbolt_faucet_WBTC.png) |
| 05 | The guide's hub card: Lightning and Fiber addresses, and the channels the hub opens per token | [`05_guide_setup_multinyet_ablyhub.png`](./05_guide_setup_multinyet_ablyhub.png) |

## 4. Design

- **Tokens from configuration.** Each token is one entry in the hub's `FIBER_ASSETS`:
  - type script, cell deps and decimals;
  - price rule;
  - fee and limits;
  - the channel the hub opens;
  - display name and icon.

  fnn's token whitelist is generated from it, and the app reads the token list from the hub. On the server, `add_token.py` adds a token: it checks the entry, backs up, regenerates the whitelist and restarts only the node that changed.
- **One channel per token, opened one after another.** fnn 0.9.1 allows one asset per channel. A funding also locks its cells until it is committed: two cWBTC opens at once failed with "can not find enough UDT owner cells". The card therefore opens the ticked channels in sequence and waits for each funding.
- **Paying another browser node.** Browser nodes have only private channels to the hub, so the payer found "no path". The node now dry-runs its own route, then the hub as a trampoline (`trampoline_hops: [hub]`). Confirm shows which route it will use. The trade-off: through the hub, the hub sees the payee.
- **Get paid.** The Fiber invoice is made first. The Lightning invoice is made only when the payer opens its tab, with a 15-minute quote, and is cancelled when it is not used.
- **Wallet names.** "Own node" read like "my node" to a tester. The choices are now "CKBolt node" (in this browser) and "External node" (your own node; paste invoices by hand). Screenshot 03 predates the rename.

## 5. What I built and tried

**Channels (01-02).** The node had a CKB channel with the hub: send 10,499.78 CKB, receive 2,302.22 CKB. RUSD and cWBTC showed what the hub funds (10 RUSD, 0.1 cWBTC) and the 181 CKB reserve each needs. I ticked cWBTC and opened it; the row turned Done.

**Faucet (04).** It is a fork of the open-source cWBTC faucet:

- 0.01 cWBTC per claim instead of 100;
- 147 CKB in each cWBTC cell instead of 200; the cell occupies 146 bytes;
- JoyID addresses accepted, with a 148 CKB cell.

The first claim committed only after about 7 minutes, with about 3,900 transactions pending on testnet, so I raised the faucet's wait from 3 to 15 minutes.

**Swaps after the deploy (7 November).**

| | BTC to CKB | CKB to BTC |
|---|---|---|
| Swap id | `c9fcbe72-40bb-4818-bfb8-7da4ca86d534` | `af7d0af6-c68c-48fc-aa7a-82a4d41adbf2` |
| Amounts | 2,000 sats → 1,448.27 CKB | 1,849.49 CKB → 2,500 sats |
| Time | 2.9 s from held payment to settled | 2.5 s in total |

- BTC to CKB: payment hash `840bb4f57e46b69356b6b468c0f911d13027644c79d17efb6b8030bf18d4ac6c`, preimage `a39f6d798ccbc1c3f40f069844bf637ea6d3b24b1e3d0add668713296c062af9`.
- CKB to BTC: payment hash `e9eed6ba5ea6e33aacdf189700f2b4f9a838dbd75c65a68b91dd64e719b9ff61`, preimage `175f1ff1f4075f9cd74ad7ac486ada6bfc453f60792daa504d27a61c81e2dc17`.

For both, `sha256(preimage)` equals the payment hash. Pay between two browser profiles, each with its own node, also succeeded through the hub.

**Review and tests.** An independent review of the new web code found five bugs, all fixed with tests. The worst: in locales with a decimal comma, "1.125" was read as 1125, so a node could have put 1,000 times too many tokens into a channel.

The hub's unit tests had stopped compiling after a VPS snapshot I merged last week. They now pass: 109 suites, 3,497 tests. The web app's Playwright suite has 1,102 tests: 1,073 passed, 28 skipped, and 1 timing-sensitive test that passes on its own.

## 6. What I learned

- **One asset per channel, and a funding locks its cells** until committed: several tokens need several channels, opened one at a time.
- **fnn reads whitelist args as a regex.** Writing them as `^…$` keeps each entry to one token.
- **The opener chooses a channel's safety delay, and the other side cannot see it.** If users opened token channels to the hub with their own tokens, the hub would have to plan payments for the longest delay: up to about 10 days of lock if a swap fails. That feature is built but off.
- **The on-chain path matters too.** In fnn, a payee can claim an expired payment on chain with the preimage. The hub's timing must cover that case, not only the off-chain one.
- **Wallets show only tokens they know.** A tester's wallet did not show cWBTC that was in their address.

## 7. Limitations and open issues

- **A safety gap in BTC to token swaps** (older than this week). A payee who withholds the preimage could claim the tokens on chain after the hub has returned the BTC. The fix is written and tested: the hub closes such a channel early. It needs a review and a devnet test before I deploy it. Testnet only, and only a deliberate payee can trigger it.
- **No cWBTC swap yet.** Channels and the faucet work, but I have not run a cWBTC swap end to end.
- **External node is manual:** paste invoices and pay by hand, with no status or guidance.
- **Little liquidity to the public Fiber network:** two channels of about 900 CKB.
- **Deploys are manual,** with no monitoring yet.

## 8. Next week

- **Audit the whole project again and fix what it finds:**
  - hub, web app, faucet and deploy;
  - deploy the safety fix once it has been reviewed.
- **External node, complete and polished:** clear steps for both directions, checks on pasted invoices, swap status, a guide and end-to-end tests.
- **Polish:**
  - clearer errors;
  - a guided start for new testers (faucet, fund, channel, first swap);
  - on-chain tokens in the node;
  - a cWBTC swap end to end.

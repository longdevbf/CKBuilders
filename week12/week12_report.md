# CKB Weekly Report - Week 12

**Reporting period:** 29 November 2026
**Participant:** Long Tran

## 1. Week 12 Overview

1. **The hub watches itself** (live since 20 November). It alerts the operator when:
   - it is degraded;
   - a swap waits too long where money depends on the hub;
   - payout liquidity runs low;
   - swap processing keeps failing;
   - the payout guard closes a channel.
2. **Prices need agreement.** A quote's price is the median of the largest group of fresh sources that agree within 3 %, at most 2 minutes old, and that group needs at least two sources. One wrong feed can neither set the price nor block it.
3. **Fiber 0.10.1 is live** on the hub's nodes and in the browser node. A rehearsal on the devnet found two traps before the live upgrade did.
4. **A Fiber pull request** is open: [nervosnetwork/fiber#1765](https://github.com/nervosnetwork/fiber/pull/1765). `list_channels` shows each channel's commitment delay, including inbound requests still waiting to be accepted.
5. **Why most BTC to CKB quotes went unpaid:** the payment never reached the hub. The page now says why after 45 seconds and links to the fix.
6. **A restore runbook** for the nodes and the hub's database, and **CI** on every push for the hub and the web app.
7. **The rest of the security review is live** (21 November): bitcoind and LND on their own network, LND macaroons limited to the 13 calls the hub makes, and images pinned by digest. The hub also closes inbound channels nobody has used for a week, so old ones no longer fill its cap.

## 2. Environment

- **Web app:** [ckbolt.texlabs.org](https://ckbolt.texlabs.org), with fiber-js 0.10.1 in the browser.
- **Hub:** LND v0.21.4 on Mutinynet and fnn v0.10.1 on CKB testnet.

## 3. Evidence

| ID | Step | Screenshot |
|---|---|---|
| 01 | The monitor run for real on the devnet: the hub's Fiber node stopped, then started; the webhook got a critical alert, then a resolved one | [`01_alert_demo_devnet.png`](./01_alert_demo_devnet.png) |
| 02 | The Fiber patch and its tests passing | [`02_fiber_list_channels_pr.png`](./02_fiber_list_channels_pr.png) |
| 03 | Fiber 0.10.1 on the live hub: swaps paused, each node's store migrated, channels ready, quotes again | [`03_fiber_upgrade_live.png`](./03_fiber_upgrade_live.png) |
| 04 | A BTC to CKB swap with nothing paid after 45 s: the page says why, and links to a Lightning channel from the hub | [`04_no_payment_hint.png`](./04_no_payment_hint.png) |
| 05 | A CKB to BTC swap waiting for the visitor: step 3 says to confirm in the node, and the button opens it | [`05_confirm_in_node_button.png`](./05_confirm_in_node_button.png) |

What the monitor alerts, and its settings: `ckbolt-hub/docs/monitoring.md`. The upgrade steps: `ckbolt-hub/deploy/README.md`, "Upgrading fnn to 0.10".

## 4. Design

**Monitoring.** Every minute the hub reads its health check, its open swaps and its payout liquidity. It also hears the payout guard and the swap scheduler as they act. Each condition has a key:
- it is alerted when it starts, and again at once when it changes level (low liquidity becoming none);
- it is reminded every hour while it lasts;
- it is marked resolved when it clears.

| Alert | Level | When |
|---|---|---|
| Payout sent, incoming payment not collected | Critical | After 3 minutes. If the incoming hold expires first, the hub loses the payout |
| Hub degraded | Critical | Health check fails or reports a problem |
| No payout liquidity | Critical | Below the smallest swap |
| Swap processing failing | Critical | Three failed passes in a row |
| Payout in flight, payout not started, refund not done | Warning | Thresholds can be set |
| Payout guard closed a channel | Warning | Sent once, when it happens |

Alerts never carry secrets, preimages or whole invoices. A failed delivery is logged and never affects a swap.

**Prices.** The hub sorts the fresh samples by price and takes the largest group that agrees within `PRICE_MAX_SPREAD_BPS` (300). That group must have at least `PRICE_MIN_SOURCES` (2) samples. Two equally large groups that share no source give no price. The tests showed why: with a plain spread rule, one outlier among three sources stopped all quotes.

**Fiber 0.10.** It brings a new peer protocol (V2):
- existing V1 channels keep working, also with 0.9 peers;
- a 0.10 node and a 0.9 node cannot open a new channel;
- so the hub's nodes and the browser's fiber-js moved together, and the guide now asks testers with their own node for fnn 0.10 or later.

**The unpaid quotes.** All 14 BTC to CKB swaps that expired had no payment reach the hub, while every paid one arrived within 44 seconds. Testers tried again two to five times in a row. That points to wallets with no route to the hub, not to people giving up. After 45 seconds with nothing paid, the page now says so and links to the guide's card where the hub opens a Lightning channel to the tester's wallet.

## 5. What I built and tried

- **The monitor:** about 470 lines in the hub, off with one setting. On the devnet, the hub checked every 5 seconds and sent Discord-format alerts to a local webhook:
  - I stopped its Fiber node at 10:27:46;
  - the critical alert "Hub degraded: the hub's Fiber node does not answer" arrived at 10:27:48;
  - I started the node at 10:27:49, and the resolved alert followed at 10:27:53.
- **The Fiber patch:** 12 lines in three files, and the regenerated RPC docs. Four new tests; the 4 new and the 4 existing commitment-delay tests pass after a rebase on the latest develop. Opened as #1765.
- **The Fiber 0.10.1 rehearsal** (devnet, a copy of its 0.9.1 state):
  - **fnn asks "Continue? [y/N]" before it migrates.** In Docker nobody answers, so it exits and restarts forever. The answer has to be piped in once.
  - **CKB testnet's commitment lock changed on 21 October** (block 22,810,047, the 0.10 generation). The devnet still had the 0.9.1 lock in genesis, so V2 channels could not settle on chain there. I moved the devnet to the 0.10.1 lock.
  - 0.9.1 nodes with the new lock (the live setup until this week): end-to-end 25 of 25. A fresh 0.10.1 devnet: 25 of 25.
  - With a 0.10.1 hub and a 0.9.1 user, payments over old channels worked both ways. New channels were refused.
- **The live upgrade (20 November):**
  - swaps paused for about 10 minutes;
  - both fnn volumes backed up;
  - fnn-hub's store migrated: 29 channel records, 31 opening records and 13 watchtower records, none skipped;
  - all 12 open channels came back ready, and every asset quoted again.
  - In Chrome, a browser node made by fiber-js 0.9.1 migrated by itself on its first start under 0.10.1 and kept its node id.
- **Tests:** written by someone other than their author, as the project requires. They cover the monitor, the price rule and the new page hints.

## 6. What I learned

- **Alert on money waiting, not only on errors.** The costly case is a swap that sits in one state while a deadline runs.
- **Agreement between sources protects better than more sources,** if one outlier cannot veto the rest.
- **Restoring channel state is a trap.** For payment channels, an old backup is dangerous, not just stale.
- **A testnet can change under you.** Its scripts are referenced by type id, so an upgrade on chain changes what every node runs. Rehearse on a devnet that matches.

## 7. Limitations and open issues

- **Alerts to a chat:** the webhook needs the operator's chat URL. Until then, alerts go to the hub's log.
- **Outside uptime check:** none yet.
- **A routing gap in fnn 0.10.1.** For about five minutes after the payout guard force-closes a public channel, fnn can still route a payout through that channel. The payout then fails at once and the hub refunds; nothing is lost, but that swap fails. It reproduces on the devnet, and a report for Fiber is drafted.
- **V1 channels** must be closed and reopened before Fiber's next major release drops them.
- **Mainnet design** is written (`ckbolt-hub/docs/mainnet-design.md`), not built: a premium by lock time, closing idle channels, caps tied to cost.
- **User-opened token channels** stay off until #1765 is released and the hub reads the delay.

## 8. Next week

- The DAO proposal.

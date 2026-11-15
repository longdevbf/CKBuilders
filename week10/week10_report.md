# CKB Weekly Report - Week 10

**Reporting period:** 15 November 2026
**Participant:** Long Tran

## 1. Week 10 Overview

1. **The safety fix for BTC to token swaps is live, and corrected.** I deployed it on 10 and 12 November. A second review, against fnn's source, showed my explanation of the risk was wrong: the real gap was the Lightning margin. On 15 November I raised that margin on Mutinynet from 10 to 30 minutes.
2. **CKBolt is open source:** [github.com/Tech-Expansion/CKBolt](https://github.com/Tech-Expansion/CKBolt) (BUSL 1.1). "Report a problem" opens an issue there. I also asked for a CKBuilder review ([issue #54](https://github.com/Nervos-Community-Catalyst/CKBuilder-projects/issues/54)).
3. **External node, step by step:** every manual step shows the exact fnn call to run, and the guide can ask the hub for a Fiber channel.
4. **Withdraw tokens:** the browser node can send RUSD or cWBTC it holds on chain to the user's address.
5. **Fiber 0.10:** the hub's devnet suite passes on fnn v0.10.0-rc3 with no code change.

**Hub tests:** 3,536 unit tests pass. All 25 end-to-end tests pass on the devnet, with fnn v0.9.1 and with v0.10.0-rc3.

## 2. Environment

- **Web app:** [ckbolt.texlabs.org](https://ckbolt.texlabs.org).
- **Hub:** LND v0.21.4 on Mutinynet and fnn v0.9.1 on CKB testnet.
- **Tokens on Fiber:** CKB, RUSD and cWBTC.
- **Devnet:** Docker, with real LND and fnn nodes, plus a second devnet on fnn v0.10.0-rc3.

## 3. Evidence

| ID | Step | Screenshot |
|---|---|---|
| 01 | Fiber wallet choices: "CKBolt node" and "External node" | [`01_wallet_choices_ckbolt_node_external_node.png`](./01_wallet_choices_ckbolt_node_external_node.png) |
| 02 | External node, BTC to CKB: the `new_invoice` call to copy | [`02_external_node_new_invoice_command_ckb.png`](./02_external_node_new_invoice_command_ckb.png) |
| 03 | The same for cWBTC, with the token's type script | [`03_external_node_new_invoice_command_cwbtc.png`](./03_external_node_new_invoice_command_cwbtc.png) |
| 04 | Guide: connect to the hub, get a Fiber channel, the whitelist entry for cWBTC | [`04_guide_external_node_connect_and_get_channel.png`](./04_guide_external_node_connect_and_get_channel.png) |
| 05 | The public repository | [`05_public_repo_tech_expansion_ckbolt.png`](./05_public_repo_tech_expansion_ckbolt.png) |
| 06 | Timeline: a late on-chain claim and the 30-minute margin | [`06_payout_guard_timeline.png`](./06_payout_guard_timeline.png) |
| 07 | Payout guard unit tests and the whole hub unit suite | [`07_payout_guard_unit_tests.png`](./07_payout_guard_unit_tests.png) |
| 08 | Hub end-to-end suite on the devnet: fnn v0.9.1 and v0.10.0-rc3 | [`08_devnet_e2e_fnn_0.9.1_and_0.10.0-rc3.png`](./08_devnet_e2e_fnn_0.9.1_and_0.10.0-rc3.png) |

## 4. Design

**The risk.** In a BTC to token swap, a payee could withhold the preimage, let the Fiber payment expire, and claim it on chain after LND had given the BTC back.

**What fnn v0.9.1 allows after a force close.**
- The payee can claim with the preimage once 1/3 of the commitment delay has passed, with no expiry check.
- The hub's timeout claim opens once 2/3 of the delay has passed and the expiry is reached.

So the payee has only a few minutes after the expiry, not a whole commitment delay as I wrote last week.

**The fix (screenshot 06).** The guard force-closes a payout channel the payee has not settled, early enough that the timeout path is open at the expiry. LND now gives the BTC back 60 blocks after the expiry (about 30 minutes), instead of 20 blocks (about 10 minutes). The hub has time to see a late claim and settle the BTC, even after a short outage.

**The cost.** LDK wallets cap a hold invoice at 1,008 blocks, so payout invoices on Mutinynet must now last 160 to 173 minutes. fnn's default is 160.

**External node (02–04).** Each step shows a copyable curl call:
- `new_invoice`, with the exact amount, `sha256` and the token's type script;
- `send_payment`, for the hub's invoice;
- `connect_peer`, plus a form to get a channel from the hub.

## 5. What I built and tried

- **Three hub deploys (10, 12 and 15 November), each with a backup and a health check.** After the last one, the hub reports the 60-block margin, and a live quote worked (5,000 sats → 3,804.53 CKB).
- **The devnet test of the guard (08).** It makes the payee hold the payment, then checks the force close, the payee's on-chain claim, and the hub collecting the BTC.
  - The first run failed: an fnn 0.9.1 funding transaction and the watchtower used the same cells (fixed upstream in fiber PR #1707).
  - The test now waits for the previous channel to settle.
- **Fiber 0.10.0-rc3: 25 of 25 tests pass.** Before upgrading: 0.10 refuses 0.9.x peers, so the hub, the browser node and the public nodes must upgrade together.

## 6. What I learned

- **Check the premise against the source.** The guard was right for the wrong reason, and the real gap was elsewhere.
- **My mentor's answer matched the review.** On issue #54, jjyr noted that fnn already force-closes about 2/3 of the delay before a payment expires (PR #623), and he welcomed a PR that shows the commitment delay in `list_channels`.
- **On Mutinynet, LDK's 1,008-block cap leaves little room** for safety margins.

## 7. Limitations and open issues

- **Late claims are tested only on the devnet.** I have not seen one on testnet.
- **User-opened token channels stay off.** The hub cannot read the delay a user picks.
- **External node is still manual.**
- **Testnet only:** not audited, and no monitoring yet.

## 8. Next week

- Send the `list_channels` PR to Fiber and reply to my mentor.
- Run a cWBTC swap end to end.
- Add a guided start for new testers.
- Add monitoring for the hub.

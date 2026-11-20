# CKB Weekly Report - Week 11

**Reporting period:** 22 November 2026
**Participant:** Long Tran

## 1. Week 11 Overview

This week was a security review of the whole project, the fixes for what it found, their tests, and a deploy.

1. **Four independent reviews**, one each for the hub, the web app, the deploy kit and the cWBTC faucet, plus a read-only check of the server.
   - None of them found a way to make the hub pay out twice, settle before it knows the preimage, or refund while a payout is in flight.
   - The findings were about trusting the hub too much, free resources that could be abused, and settings that failed open.
2. **The browser no longer trusts the hub** when a swap is paid. In a CKB or token to BTC swap, the node itself:
   - reads the hub's invoice;
   - requires the hash of the visitor's own Lightning invoice, the quoted amount and token, and the hub's node as payee;
   - asks the visitor to confirm in the node before paying.
3. **The hub refuses risky inputs and settings:**
   - Fiber invoices that repeat an attribute;
   - starting open to the internet without its proxy secret;
   - a mainnet setup with a test network's timing.
4. **The faucet can no longer be drained** about 5 times faster than its limits allow.
5. **Tests by someone other than the author**, as the project requires. They found seven bugs in the fixes themselves, all fixed before the deploy.
6. **Live on 20 November:** the hub, the web app and the faucet run these fixes.
7. **Testnet so far:**
   - 37 swaps by real wallets (24 October to 9 November), 22 completed;
   - every swap that did not complete stopped before any payout (an unpaid quote that expired, or a cancel);
   - no funds lost.

## 2. Environment

- **Web app:** [ckbolt.texlabs.org](https://ckbolt.texlabs.org).
- **Hub:** LND v0.21.4 on Mutinynet and fnn v0.9.1 on CKB testnet, behind Cloudflare Tunnel.
- **Faucet:** [ckbolt-faucet.texlabs.org](https://ckbolt-faucet.texlabs.org).
- **Public repository:** [github.com/Tech-Expansion/CKBolt](https://github.com/Tech-Expansion/CKBolt).

## 3. Evidence

| ID | Step | Screenshot |
|---|---|---|
| 01 | Testnet swaps by real wallets, per week and per direction, from the hub's database | [`01_testnet_swaps.png`](./01_testnet_swaps.png) |
| 02 | What the security review changed, and what it found sound | [`02_security_review_fixes.png`](./02_security_review_fixes.png) |
| 03 | A CKB to BTC swap: the node's Confirm page shows what is paid, what arrives on Lightning, the payee and the fee cap | [`03_confirm_swap_payment.png`](./03_confirm_swap_payment.png) |
| 04 | A BTC to CKB swap: the page refuses a hold invoice that does not match what the visitor accepted, and shows nothing to pay | [`04_hold_invoice_refused.png`](./04_hold_invoice_refused.png) |
| 05 | The hub: refuses to start open without its secret, refuses an invoice that repeats an attribute, counts IPv6 clients per /64 | [`05_hub_checks.png`](./05_hub_checks.png) |
| 06 | The live web app's hub proxy: JSON only, with a sandbox policy, whatever the hub answers | [`06_proxy_headers.png`](./06_proxy_headers.png) |
| 07 | The faucet's checks on four addresses: only a standard or JoyID address gets a claim | [`07_faucet_recipients.png`](./07_faucet_recipients.png) |
| 08 | Dependency advisories in what the faucet runs: 28 before, 7 after | [`08_faucet_audit.png`](./08_faucet_audit.png) |

Screenshots 03 and 04 come from the end-to-end tests, with the hub faked. 05, 07 and 08 are the code run on its own. 06 is the live site, then the same build against a fake hub that misbehaves.

The full list of findings and their status is in `ckbolt-hub/docs/security-review-2026-11.md`.

## 4. Design

**The trust boundary.** Last week, the browser checked the hub's invoice only against what the hub itself said about the swap. A compromised hub could have used a hash only it knew, collected the payment and never paid out. Now each side checks against what the visitor accepted:

- **CKB or a token to BTC.** The node runs `parse_invoice` on the hub's Fiber invoice. It requires:
  - the payment hash of the visitor's own Lightning invoice, so the hub can collect only by paying it;
  - the quoted amount and token;
  - the hub's own node as payee.

  It then pays with a 0.5 % fee cap.
- **BTC to CKB or a token.** The page requires that the hub's Lightning invoice:
  - asks for the quoted amount;
  - belongs to the payout invoice the page sent;
  - has that invoice's hash, when the browser node made it;
  - has not expired while the quote still runs.
- **Confirm in the node.** A swap payment now waits for Confirm in the node, as Pay already did. Before this, any script on the site's origin could ask the node to pay a swap without a prompt. The swap's progress shows "Confirm it in your Fiber node", with a button that opens the node on that page.

**Hub fixes:**
- An invoice that repeats an attribute (for example two hash algorithms) is refused, so the hub cannot check one value while the paying node uses another.
- The hub refuses to start when other machines can reach it and it has no proxy secret.
- IPv6 clients count per /64, not per address, and an IPv4 address counts as itself however it is written.
- Swap ids no longer appear in invoice memos (an id lets anyone read the swap).

**Faucet fixes:**
- Only standard lock args are accepted: 20 bytes for a standard address, 22 for JoyID. A long-args address had made each claim cost about 725 CKB instead of 147.
- IPv6 is limited per /64, and each recipient counts once by its lock.
- The balance is cached for 60 seconds.
- The admin token is compared in constant time, without revealing its length.
- After a database restore, a command marks unsent claims as failed, so none is paid twice, and their users can claim again at once.
- Dependency advisories in what the faucet runs went from 28 to 7 (22 counting development tools, which its image does not ship).

## 5. What I built and tried

- **Tests.** Another author wrote the tests for every fix (the project's rule):
  - hub: 3,903 unit tests (367 new), 405 deploy-kit tests, and 25 of 25 end-to-end tests on the devnet's real nodes;
  - web app: 1,190 tests, 1,183 passed; 6 are desktop-only and skip on mobile, and 1 timed out under load and passes on its own;
  - faucet: 98 tests (12 before).
- **What the tests caught:**
  - **Web proxy:** the site-wide security policy replaced the proxy's own sandbox policy.
  - **Web page:** it accepted a hold invoice that had already expired.
  - **Hub monitor:** an alert that got worse was not sent again until its hourly reminder.
  - **Hub prices:**
    - a source named twice counted twice;
    - float rounding missed the spread limit by a fraction;
    - one outlier among three sources blocked the price. Now the largest group of sources that agree sets it.
  - **Hub and faucet:** IPv4 addresses written in IPv6 form were not recognised.
  - **UX gap:** in a CKB to BTC swap, the node's Confirm page sat behind the swap's dialog.
- **Deploy on 20 November.** Backups of the hub's and the faucet's databases were taken before each deploy. Checks on the live services after it:
  - a quote priced from all three sources;
  - the faucet refuses a long-args address with HTTP 400;
  - the proxy's answers carry the sandbox policy.
- **Testnet data,** read from the hub's database:
  - 37 live swaps and 144 quotes;
  - CKB or token to BTC: 13 of 13 completed;
  - BTC to CKB or token: 9 of 24 completed. The other 15 stopped before any payout: 14 quotes expired unpaid, 1 cancelled.
- **Server check:** only the P2P ports and the web server are public; the admin ports of the nodes are not. Secret files are owner-only.

## 6. What I learned

- **Check what the user accepted, not what the server says.** Every check that read the hub's own swap was circular. The node has to compare the hub's invoice with what the visitor saw and pasted.
- **A same-origin bridge is only as safe as the site's scripts.** Any payment a page can ask for needs the user's confirmation in the wallet.
- **Tests by another author pay for themselves.** Seven of the fixes had a bug of their own, and one header was silently replaced by the framework's config. None of these showed up in a build or a typecheck.
- **Rate limits by address are weak on IPv6**, where one user owns a whole /64.

## 7. Limitations and open issues

- **External node:** when the payout invoice comes from the visitor's own node, the browser cannot read its hash, so that one check is skipped.
- **Planned from the review:**
  - a strict content security policy for the wallet pages;
  - a Next.js patch upgrade;
  - stronger keystore passwords;
  - authenticated Fiber RPC inside the deployment.
- **Mainnet design work** remains:
  - a cost for unpaid swaps and channel requests;
  - closing idle channels;
  - pricing the free option by lock time.

## 8. Next week

- Alerts to the operator's chat, and an outside uptime check.
- Fiber 0.10: upgrade the hub, the browser node and the public guide together.
- Why most BTC to CKB quotes went unpaid: the payment never reached the hub.

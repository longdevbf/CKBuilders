Title: CKBolt: Bitcoin Lightning to CKB Fiber swaps, payments and invoices, with both legs locked to one SHA-256 hash

### Project Summary
CKBolt links Bitcoin's Lightning Network and CKB's Fiber Network, so anyone can swap, pay and get paid between BTC and assets on CKB (native CKB, RUSD and cWBTC on testnet). A CKBolt hub runs an LND node and a Fiber node (fnn), quotes a price for each route, and locks both legs of every swap to one SHA-256 payment hash with hold invoices on both sides. Either the recipient is paid and the hub settles, or the payer is refunded; the hub cannot keep a payer's money without paying out. Users do not need their own Lightning or Fiber node: the web app runs a Fiber node in the browser (fiber-js), and any Lightning wallet can pay by QR code.

Compared with Fiber's Cross-Chain Hub (CCH), which swaps one wrapped-BTC token at 1:1, CKBolt prices each route, so native CKB and CKB stablecoins work in both directions. The hub is also a public Fiber node that opens inbound channels to new users, so a browser node can receive its first payment without arranging liquidity first.

### Tools used
- fnn v0.9.1 — the hub's Fiber node over JSON-RPC (hold invoices, send_payment, channel management, UDT whitelist)
- `@nervosnetwork/fiber-js` 0.9.1 — the Fiber node that runs in the user's browser
- `@ckb-ccc/core` and `@ckb-ccc/connector-react` — funding the browser node from JoyID and other CKB wallets, and withdrawals back on chain
- LND v0.21.4 hold invoices through the `lightning` npm package, on Bitcoin Mutinynet (signet); tested with Alby Hub over NWC and with WebLN wallets
- NestJS, TypeScript, SQLite and Docker Compose for the hub; a local devnet (bitcoind regtest, two LND, a CKB dev chain, two fnn) for end-to-end tests
- Next.js, React and Playwright for the web app

### Current features
- Swap in both directions between BTC on Lightning and CKB, RUSD or cWBTC on Fiber, with firm signed quotes (median of exchange prices plus a spread, size limits, Ed25519 signature)
- Each payout is sized to finish before the incoming hold expires; a failed payout is refunded, and the hub resumes every open swap after a restart
- Pay — one field accepts a Lightning invoice, a Fiber invoice or a CKB address
- Get paid — one request carries a Fiber invoice and a Lightning invoice; when one is paid, the other is cancelled
- Browser Fiber node — key kept in the browser and encrypted with the user's password (scrypt); channels with the hub (the hub opens inbound channels, and the user can add their own CKB); history of swaps and payments; withdrawal of CKB and tokens back on chain
- External node — users who run their own fnn get ready-to-copy commands (invoice, payment, peer connection) and can request a channel from the hub
- Testnet guide from an empty wallet to a swap in both directions, and a cWBTC faucet that accepts standard and JoyID addresses
- Safety rules in code: no cancel while a payout is in flight or once a preimage is known, SHA-256 Fiber invoices only, a payout guard that force-closes a private payout channel when a payee holds the payment too long, rate limits and a CSRF guard on the web server's hub proxy
- Tests: 3,503 unit tests and 24 end-to-end tests against real nodes on the devnet for the hub (success, refund, quote expiry, restart recovery, rejections, payout guard); about 1,100 Playwright tests for the web app on desktop and mobile

### Planned features
- Upgrade to fnn and fiber-js 0.10
- Token channels opened by the user's own node (built, but disabled on the public hub until short commitment delays are covered; see Problems below)
- More public liquidity, monitoring and alerts, clearer error messages and guided onboarding
- Merchant payments, then Ethereum through Perun channels
- An external security audit before any mainnet use

### Deployed on
Testnet only — Bitcoin Mutinynet (signet) and CKB testnet. The project has not been audited and has never been used with mainnet funds.

### Link to repository
https://github.com/Tech-Expansion/CKBolt (hub in `ckbolt-hub/`, web app in `ckbolt-web/`)

### Suggested review path
1. README.md — how a swap works, where to start, known limitations
2. ckbolt-hub/docs/phase-3-plan.md, section 3 — the safety rules for settling, cancelling, refunding and resending
3. ckbolt-hub/src/application/swaps/ — the two swap flows and the processor that follows payouts
4. ckbolt-hub/src/domain/timing/ — hold expiries, payout budgets and Fiber commitment delays
5. ckbolt-hub/test/e2e/payout-guard.e2e-spec.ts — the payout guard against real nodes on the devnet
6. ckbolt-hub/docs/research/fiber-node.md and cch.md — the fnn behaviour the hub relies on

### Link to hosted version of project
https://ckbolt.texlabs.org/app (testnet guide: https://ckbolt.texlabs.org/app/guide, cWBTC faucet: https://ckbolt-faucet.texlabs.org)

### Screenshots
One request, several tokens: the node asks the hub for one channel per token

<img width="1496" height="1402" alt="image" src="https://github.com/user-attachments/assets/0cbcf95d-5c11-4e1d-b164-108c8cf65542" />

Opening a cWBTC channel with the hub

<img width="960" height="1324" alt="image" src="https://github.com/user-attachments/assets/010f1184-2d1b-47cf-a9b1-568aec4c0b40" />

Swap and Pay with three assets on Fiber (CKB, RUSD, cWBTC)

<img width="1284" height="1360" alt="image" src="https://github.com/user-attachments/assets/5260e64a-70df-4d5a-9513-f9e0013596a0" />

The cWBTC faucet

<img width="3024" height="1838" alt="image" src="https://github.com/user-attachments/assets/e7d669b1-4aa1-422b-bb61-b63ca2d58101" />

The testnet guide: Mutinynet and Alby Hub setup

<img width="3024" height="1826" alt="image" src="https://github.com/user-attachments/assets/3c9234d1-5eed-4ccd-8e1b-2eb0a23ccfb9" />

### Request for feedback

#### Problems
1. Commitment delay of inbound channels. fnn fails a held TLC at 2/3 of the inbound channel's commitment delay before its expiry, and the channel opener chooses that delay (1 to 84 epochs). Since list_channels does not report it, the hub must assume the shortest delay for channels that users open, which narrows the time available to pay out on Lightning. For this reason, user-opened token channels are disabled on the public hub.
2. On-chain claims after expiry. In Lightning to Fiber swaps, fnn allows a payee to claim the hub's TLC on chain with the preimage even after the TLC has expired, and settlement opens one commitment delay after a force close. A payee who withholds the preimage could therefore claim after the Lightning hold has been released. Our payout guard force-closes the private payout channel early, so that any claim lands while the hold is still open. Two cases are not covered yet: a public Fiber node that is itself the payee, and a channel the payee opened with a short delay.
3. Narrow timing on Mutinynet. LDK wallets such as Alby Hub refuse a Lightning payment whose CLTV exceeds 1,008 blocks, while fnn's minimum final_expiry_delta is 160 minutes. As a result, a Fiber payout invoice must expire between 160 and about 233 minutes. Mainnet, with 10-minute blocks, will have a different window.

#### Review
1. Timing model — are these fnn behaviours correct, and will they still hold in 0.10: a held TLC fails at 2/3 of the commitment delay before expiry; the minimum final expiry is 160 minutes; an invoice can still read Received after its held TLC has timed out; a payment can read Failed while one of its parts is still pending? Is there, or could there be, a way to read an inbound channel's commitment delay?
2. Payout guard — is force-closing the private payout channel the right defence against a payee who withholds the preimage, or is there a better fnn-native option (for example, rejecting preimage claims after expiry, or a hook for hold-invoice style payouts)?
3. Hold invoices on fnn — new_invoice with a payment hash, settle_invoice and cancel_invoice, as used in the Fiber to Lightning flow: is there a race condition we have missed?
4. Channels to browser nodes — is it sound for a hub to open inbound channels to short-lived browser nodes and abandon the ones that are never accepted? Would trampoline routing let browser nodes pay beyond the hub?
5. Swap safety rules (phase-3-plan.md, section 3) — is there any way for either side to take both legs, or to lock the hub's funds?

#### Guidance
1. Should CKBolt remain a separate priced hub alongside CCH, or should part of this work be contributed upstream to Fiber?
2. What should the path to mainnet look like in terms of audit scope and the Fiber 0.10 features to adopt first?
3. Liquidity is the main limit today: the hub funds every payout and every inbound channel from its own balances on both networks, and swaps in one direction slowly move its funds from one side to the other. For the future, which direction would you recommend: outside liquidity providers who supply capital to the hub for a share of the fees, partnerships with public Fiber routing nodes and Lightning service providers, several independent hubs that compete on price, or periodic rebalancing between BTC and CKB? Are there Fiber liquidity efforts, such as public routing nodes or LSP-style services, that CKBolt should build on rather than run alone?
4. Which integrations would bring the most value to the ecosystem: wallets, merchant tools, or other Fiber applications that need a Lightning on-ramp?

Not claimed: production or mainnet readiness, a completed audit, or deep liquidity. The hub is run by a single operator and handles test funds only.

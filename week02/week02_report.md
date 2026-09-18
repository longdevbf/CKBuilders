# CKBuilder Weekly Report - Week 2

**Reporting period:** 12 September - 18 September 2026
**Publication date:** 18 September 2026
**Participant:** Long Tran

## 1. Overview

Week 2 moved from the Devnet beginner exercises completed in Week 1 into application development on **CKB Testnet** using **CCC (Common Chain Connector)**.

The work is organized as five practical tracks inside `week02/`:

- **CCC fundamentals** via the CCC Playground (`1_ccc/`)
- **A mini CKB dApp** built with Next.js, React and `@ckb-ccc/connector-react` (`2_mini_dapp/first_dapp/`)
- **xUDT fungible token** minting and transfer (`3_udt/`)
- **Node.js CKB scripts** for querying balances, cells and sending CKB from the command line (`4_nodejs_be/`)
- **The full Spore Protocol lifecycle** — cluster, spore, query, transfer, melt (`5_spore/`)

All on-chain activity in this report ran against the public **CKB Testnet**, using `@ckb-ccc/shell`, `@ckb-ccc/spore` and `@ckb-ccc/connector-react` on top of TypeScript/Node.js and a Next.js frontend.

---

## 2. Week 2 Goals

- Understand the role of **CCC** as a common application interface for CKB (Client, Address, Signer, Transaction).
- Use the **CCC Playground** to build, complete and inspect transactions interactively.
- Build simple CKB application flows in TypeScript (query balance, list cells, send CKB).
- Issue and transfer a custom **xUDT** fungible token.
- Exercise the full **Spore Protocol** object lifecycle: create a cluster, create a spore inside it, query both, transfer ownership of both, and melt (destroy) the spore.
- Build a small **React + Next.js dApp** that connects to a real browser wallet, transfers CKB, and reads back on-chain cell/transaction data.

---

## 3. Development Environment

### OS / Runtime

- Windows 10 Pro, PowerShell
- Node.js v24.15.0
- TypeScript, executed with `tsx`

### CKB Environment

- CKB Testnet (all transactions in this report)
- CKB JSON-RPC via `@ckb-ccc/shell`'s `ClientPublicTestnet`
- CCC Playground: `live.ckbccc.com`

### Libraries

- `@ckb-ccc/ccc` ^1.3.3
- `@ckb-ccc/shell` ^1.3.12
- `@ckb-ccc/spore` ^1.6.12
- `@ckb-ccc/connector-react` ^2.1.4
- Next.js 16.3.5, React 19.2.8

### Wallet

- **UTXO Global Wallet** browser extension, used by the mini dApp to sign and broadcast a real transaction

---

## 4. Week 2 Work Summary

| Area | Status | Evidence |
|---|---|---|
| CCC Playground (Client, Transaction) | Completed | [`1_ccc/`](./1_ccc/) |
| CCC Signer / Client / Address | Completed | [`1_ccc/`](./1_ccc/), [`4_nodejs_be/`](./4_nodejs_be/) |
| Compose & complete a CKB transaction | Completed | [`1_ccc/`](./1_ccc/), [`4_nodejs_be/`](./4_nodejs_be/) |
| Mini dApp: wallet connect | Completed | [`2_mini_dapp/evidence/`](./2_mini_dapp/evidence/) |
| Mini dApp: transfer CKB | Completed | [`2_mini_dapp/evidence/`](./2_mini_dapp/evidence/) |
| Mini dApp: view on-chain cells / tx history | Completed | [`2_mini_dapp/evidence/`](./2_mini_dapp/evidence/) |
| xUDT mint | Completed | [`3_udt/`](./3_udt/) |
| xUDT transfer | Completed | [`3_udt/`](./3_udt/) |
| Node.js balance / cell query scripts | Completed | [`4_nodejs_be/`](./4_nodejs_be/) |
| Node.js CKB transfer script | Completed | [`4_nodejs_be/send_ckb.ts`](./4_nodejs_be/send_ckb.ts) |
| Spore: create cluster | Completed | [`5_spore/evidence/`](./5_spore/evidence/) |
| Spore: create spore in cluster | Completed | [`5_spore/evidence/`](./5_spore/evidence/) |
| Spore: query cluster / spore | Completed | [`5_spore/evidence/`](./5_spore/evidence/) |
| Spore: transfer spore | Completed | [`5_spore/evidence/`](./5_spore/evidence/) |
| Spore: transfer cluster | Completed | [`5_spore/evidence/`](./5_spore/evidence/) |
| Spore: melt spore | Completed | [`5_spore/evidence/`](./5_spore/evidence/) |
| Node.js Express backend / REST API | Not started | Deferred — see [Remaining Tasks](#15-remaining-tasks) |
| Rust / CKB Script fundamentals | Not started | Deferred to Week 3 |

---

## 5. CCC Playground (`1_ccc/`)

### Objective

Get hands-on with `@ckb-ccc/ccc` and the CCC Playground (`live.ckbccc.com`) before writing any local scripts: build a transaction, complete it, and create a Spore directly from the browser.

### Procedure

- Declared a transaction with a single 100 CKB output using `ccc.Transaction.from({ outputs: [...] })` and rendered it before completion.
- Called `tx.completeInputsByCapacity(signer)` and `tx.completeFeeBy(signer, 1000)` and re-rendered the transaction to see the inputs and change output CCC added automatically.
- Used `ccc.spore.createSpore({ signer, data: { contentType: "text/plain", content: ... } })` to create a Spore directly from the Playground, then completed and rendered it the same way.
- Used the Playground to call `client.getTip()`, `signer.getRecommendedAddress()` and `signer.getBalance()` directly.

### Result

- **Before completion:** 1 output (100 CKB), 0 inputs — the transaction is only a description at this point.
- **After completion:** 3 inputs (61 CKB each, 183 CKB total) were selected automatically, producing outputs of 100 CKB + 22 CKB change.
  Transaction hash: `0xffa0ee05abd57038751a5648ee8c2ac295408c8a9a61a617ffee62d530b0440c`
- **Spore creation:** a `text/plain` Spore containing `"Hello, Spore!"` was created and completed, producing a 173 CKB / 47-byte Spore cell plus a CKB change output.
  Example transaction hash: `0x264810027e7537f5f2f65de8a75b9c5201a265ea2aedead2b302a716dfeda839`
- **On-chain query:** `client.getTip()` returned tip block `22445665`; `signer.getBalance()` returned `11444 CKB` for the connected Testnet account.

### What I Learned

Building a transaction in CCC is a two-phase process: first *describe* the desired outputs, then *complete* it (`completeInputsByCapacity` for inputs, `completeFeeBy` for the fee/change output). The Playground made this very visible because it renders the transaction's inputs/outputs at each step, which made the abstract "inputs cover outputs + fee" rule concrete before I had to reason about it in code.

### Evidence

See the [`1_ccc/` evidence folder](./1_ccc/).

---

## 6. Mini CKB dApp (`2_mini_dapp/first_dapp/`)

### Objective

Build a small Next.js + React dApp that connects to a real browser wallet via `@ckb-ccc/connector-react`, transfers CKB, and reads back on-chain data for the connected address.

### Procedure

- Wrapped the app in `<ccc.Provider defaultClient={new ccc.ClientPublicTestnet()}>` (`app/provider.tsx`).
- Built a `ConnectButton` component using `ccc.useCcc()` / `ccc.useSigner()` to connect/disconnect a wallet and display the address and balance.
- Built a `TransferCKB` component that:
  - converts a destination address to a lock script with `ccc.Address.fromString`,
  - builds a transaction output with `ccc.CellOutput.from`, checks it against `output.occupiedSize`,
  - completes inputs/fee and sends the transaction with `signer.sendTransaction(tx)`,
  - and a "View On-chain Data" action that queries `client.getBalance`, `client.findCellsByLock` and `client.findTransactionsByLock` for the connected address.
- Ran the app locally (`npm run dev`, `http://localhost:3000`) and connected **UTXO Global Wallet**.

### Result

- Connected address: `ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqgawpxxzp3p02f52pdqstph9s9mg2chxfgy2ltk0`
- Sent **10,000 CKB** through the wallet's own "Sign transaction" popup (a real wallet signature, not a raw private-key signer).
  Transaction hash: `0x5044142ee5fbc5660bbb3be1aabad62b8f439aad7e703c57709d3d486687c680`
- "View On-chain Data" correctly listed 5 live cells (including the new 10,000 CKB output cell) and the account balance formatted as `299999.9999704 CKB`.
- "Recent Transactions" listed the account's transaction history with block numbers, confirming `findTransactionsByLock` works against Testnet.

### What I Learned

`@ckb-ccc/connector-react` makes wallet integration close to drop-in: `useSigner()` returns a working `ccc.Signer` backed by whatever wallet the user connects, so the same `completeInputsByCapacity` / `completeFeeBy` / `sendTransaction` flow used with a raw private-key signer in scripts works unchanged in the browser. I also learned to be careful with fixed-point CKB values in the UI — see [Challenges](#7-challenges) below.

### Evidence

See the [`2_mini_dapp/evidence/` folder](./2_mini_dapp/evidence/) and the [dApp source](./2_mini_dapp/first_dapp/).

---

## 7. xUDT Fungible Token (`3_udt/`)

### Objective

Issue a custom xUDT token on Testnet, mint an initial supply, and transfer part of it to a second address.

### Procedure

- Derived the issuer's lock script and used `issuerLock.hash()` as the xUDT type script args (owner-mode xUDT).
- Built the type script with `ccc.Script.fromKnownScript(client, ccc.KnownScript.XUdt, tokenArgs)` and looked up its cell dep with `client.getKnownScript` / `client.getCellDeps`.
- Wrapped the type script and its cell dep in a `ccc.udt.Udt` instance.
- `mint`: called `udt.mint(signer, [{ to: issuerLock, amount: ... }])`, then completed CKB capacity and fee, then signed and broadcast.
- `transfer`: called `udt.transfer(signer, [{ to: receiverLock, amount: ... }])`, completed the UDT inputs/change with `udt.completeBy`, then completed CKB capacity and fee.

### Result

- Issuer address: `ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq2pryvze6fhufxkgjx35psh7w70k3hz7c3mtl4d`
- Token args (unique token identifier): `0x4472b33b4e1845ebe82f2ce5f511bbe012f144c5f3d7b539909adffc83ccda61`
- Minted **1,000** tokens.
  Transaction hash: `0xc2d4b6bd198dae39c771b9d39d05b4833a72703509a89635a2dad2061cd08bd3`
- Transferred **100** tokens to a second Testnet address.
  Transaction hash: `0x89b7318fa64ffd72bf0a0e1074391e3dae1bd7ddae008f39ae775fcb5e48986f`

### What I Learned

An xUDT token's identity is entirely defined by its type script args (here, the hash of the issuer's lock script for owner-mode minting) — there is no separate "token contract" to deploy. Minting and transferring both still need ordinary CKB capacity on top of the UDT amount, which is why `completeInputsByCapacity` and `completeFeeBy` are called in both flows even though the "interesting" part of the transaction is the UDT output.

### Evidence

See the [`3_udt/` folder](./3_udt/) (includes `udt.ts` and screenshots).

---

## 8. Node.js CKB Scripts (`4_nodejs_be/`)

### Objective

Use CCC from plain Node.js/TypeScript scripts (no framework) to query an account and send CKB — the same pattern a backend service would use.

### Procedure

- `query_balance.ts`: connects a `SignerCkbPrivateKey` to Testnet and prints the recommended address and balance.
- `query_shell.ts`: iterates `signer.findCellsOnChain({}, true)` and prints every live cell's out point, capacity, lock, type script and data for the account.
- `send_ckb.ts`: builds a 1 CKB transfer to a fixed receiver address, completes inputs/fee, and broadcasts it.

### Result

- Address: `ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq23dyezsr2l7vggzx07ydsapp50rxvde3qslv5ac`
- Balance: `11375.99709841 CKB`
- `query_shell.ts` found 2 live cells for the account, including one carrying a large `outputData` payload and one plain 11,375.99709841 CKB capacity cell — consistent with the balance reported by `query_balance.ts`.

### What I Learned

`findCellsOnChain` / `findCellsByLock`-style queries are the same primitives whether they're called from a browser dApp, a Playground snippet, or a plain Node.js script — CCC's `Client`/`Signer` abstraction is genuinely reusable across environments, which is the main practical benefit of standardizing on it.

### Evidence

See the [`4_nodejs_be/` folder](./4_nodejs_be/) (includes the scripts and screenshots).

---

## 9. Spore Protocol - Full Lifecycle (`5_spore/`)

### Objective

Exercise the complete Spore Protocol object lifecycle on Testnet: create a cluster, create a spore inside it, query both, transfer ownership of both to a second account, and finally melt (destroy) the spore.

### Procedure

Seven scripts, each building on the previous one's saved state (`spore-state.json`):

1. `1_create_cluster.ts` — `createSporeCluster({ signer, data: { name, description } })`, then `completeInputsByCapacity` + `completeFeeBy` + broadcast.
2. `2_create_spore.ts` — `createSpore({ signer, data: { contentType, content, clusterId }, clusterMode: "lockProxy" })`.
3. `3_query_spore.ts` — `findSpore` by ID, then `findSporesBySigner` to list every spore owned by the account.
4. `4_query_cluster.ts` — `findCluster` by ID, then `findSporeClustersBySigner` to list every cluster owned by the account.
5. `5_transfer_spore.ts` — `transferSpore({ signer, id, to })` to a second Testnet account.
6. `6_transfer_cluster.ts` — `transferSporeCluster({ signer, id, to })` to the same second account.
7. `7_melt_spore.ts` — `meltSpore({ signer, id })`, signed by the **receiver** (since ownership had already moved), then re-queries `findSpore` to confirm destruction.

### Result

| Step | Result |
|---|---|
| Cluster created | `"Long CKB Collection"` — ID `0x02a27d666726add0afc8a7f72a373c2a1e02ba4f90a4d8e19060727549844bbc`, tx `0x7603f4a5d7c05d77afeb00fbfe27f7c8737f1c632a8a901d394c0200f78ab0f0` |
| Spore created | `"Long's First Spore"` (JSON metadata, creator `Long Tran`) — ID `0xeba21a8cec7e98c1a1500849e5bdf701c822e026dbb7c259dc7a490e5d1c2d66`, tx `0x4d09683ba0ba8b8910ec6308bd9bdf92354439f716eb9fc6aef25bc341304f53` |
| Cluster query | Confirmed name/description on-chain; `findSporeClustersBySigner` correctly listed every cluster the account had ever created |
| Spore query | Confirmed metadata on-chain; `findSporesBySigner` correctly listed every spore the account owned, grouped by cluster |
| Spore transferred | To a second Testnet account, tx `0xfe5c1bc620a00fb30bf58fd3aaa24c18950e566016943f46f1aea2b2d0befa29` |
| Cluster transferred | To the same second account, tx `0x8236c9e3ac18e29a668293f33fd468e8bc0c9277865fb6b10162663ea35f16a1` |
| Spore melted | By the new owner, tx `0x07d2e3665cc456486c64b60ce72bc089d49a76b6ca1bd880f082c20af4ae2c00` — a follow-up `findSpore` query returned nothing, confirming the spore cell was destroyed |

### What I Learned

Spore ownership and cluster ownership are transferred independently (two separate transactions), and once ownership moves, only the *new* owner's signer can melt the spore — the melt script had to be re-run with the receiver's key, not the original creator's. Running the create/query scripts repeatedly while iterating also left several earlier test clusters and spores live under the same account (visible in the `findSporesBySigner` / `findSporeClustersBySigner` output), which was a useful reminder that a "create" script is not idempotent — the `clusterId`/`sporeId` saved in `spore-state.json` is what makes later scripts target the *current* object rather than an earlier one.

I also ran into and resolved a genuine capacity bug in this flow — see [Challenges](#10-challenges).

### Evidence

See the [`5_spore/evidence/` folder](./5_spore/evidence/) and the [scripts](./5_spore/).

---

## 10. Challenges

- **`clusterMode: "lockProxy"` can silently consume an entire wallet's spendable capacity.** Running `2_create_spore.ts` failed with `Insufficient CKB, need 410 extra CKB` even though the account held over 34,000 CKB. The root cause: the wallet's entire spendable balance sat in a **single** "free" cell (no type script, no data). `createSpore()` calls `completeInputsAtLeastOne(signer)` first, which grabbed that one cell as the transaction's first input; because `clusterMode: "lockProxy"` then reuses whatever input already shares the cluster owner's lock and mirrors its **full capacity unchanged** into a new output (the lock-proxy pattern), the entire balance was walled off as an exact input→output passthrough, leaving nothing for `completeInputsByCapacity` to fund the actual ~277–410 CKB Spore cell with. The fix was to split the balance into two free cells first (a small self-transfer), so the lock-proxy step consumes one cell and `completeInputsByCapacity` can draw on the other. This was a useful lesson that "sufficient balance" and "sufficient *spendable, unencumbered* capacity in the right shape of cell" are not the same thing.

- **Inconsistent balance formatting in the mini dApp.** The `ConnectButton` header displays `Number(balance)` directly (raw shannons, e.g. `29999999999028`), while the "View On-chain Data" panel correctly uses `ccc.fixedPointToString(balance)` (e.g. `299999.9999704 CKB`). Both are visible side-by-side in the evidence screenshots — a reminder to always format fixed-point CKB values consistently rather than mixing raw and formatted values across a UI.

- **Transaction completion is a distinct step from declaring outputs.** As in Week 1, forgetting that `completeInputsByCapacity` / `completeFeeBy` must run before signing (rather than being implicit) was an early source of confusion, resolved by working through it explicitly in the CCC Playground first.

- **Re-running scripts against a persistent Testnet account is not idempotent.** Iterating on the Spore scripts left multiple test clusters and spores live under the same account; `spore-state.json` had to be trusted as the source of truth for which cluster/spore ID was "current" rather than assuming there was only one.

---

## 11. Key Learnings

1. **CCC is a genuinely common interface** — the same `Client` / `Signer` / `Transaction` pattern worked unchanged across the Playground, plain Node.js scripts, and a React dApp using a real browser wallet.
2. **Transaction construction and completion are separate phases.** Describing outputs, completing inputs/fee, signing and broadcasting are four distinct steps, and CCC's Playground makes this very visible by rendering the transaction after each step.
3. **Capacity accounting has sharp edges.** A cell's capacity can be fully committed by a mechanism like Spore's lock-proxy pattern without that being obvious from the account's total balance — worth double-checking *which* cells are actually free before assuming a transaction has "enough" CKB.
4. **xUDT and Spore are both just Cells with a type script.** Neither needs a separate ledger or contract deployment step from the application's point of view — they're both expressed entirely through the Cell Model already learned in Week 1.
5. **Wallet integration and raw-key signing share the same API surface**, so scripts written against a `SignerCkbPrivateKey` translate directly to a browser dApp using `useSigner()` from a connected wallet.
6. **Ownership transfer is per-object.** Transferring a Spore does not transfer its Cluster, and vice versa — each requires its own transaction, and subsequent operations (like melting) must be signed by whoever currently owns the object.

---

## 12. Repository Structure

```text
week02/
├── 1_ccc/                     # CCC Playground: Client, Transaction, Spore (screenshots)
├── 2_mini_dapp/
│   ├── evidence/               # dApp screenshots (connect, transfer, on-chain data, tx history)
│   └── first_dapp/             # Next.js + @ckb-ccc/connector-react source
├── 3_udt/
│   ├── udt.ts                  # mint / transfer xUDT
│   └── *.png                   # screenshots
├── 4_nodejs_be/
│   ├── query_balance.ts
│   ├── query_shell.ts
│   ├── send_ckb.ts
│   └── *.png                   # screenshots
└── 5_spore/
    ├── 1_create_cluster.ts ... 7_melt_spore.ts
    ├── spore-state.json         # persisted cluster/spore IDs and tx hashes across steps
    └── evidence/                # screenshot per lifecycle step
```

---

## 13. Evidence Index

| Area | Evidence |
|---|---|
| CCC Playground | [`1_ccc/`](./1_ccc/) |
| Mini dApp | [`2_mini_dapp/evidence/`](./2_mini_dapp/evidence/) |
| xUDT | [`3_udt/`](./3_udt/) |
| Node.js scripts | [`4_nodejs_be/`](./4_nodejs_be/) |
| Spore Protocol | [`5_spore/evidence/`](./5_spore/evidence/) |

---

## 14. Week 2 Development Log

| Date | Activity | Result |
|---|---|---|
| Sep 17, 2026 | CCC Playground: build/complete a transaction, query tip/address/balance | Completed |
| Sep 17, 2026 | CCC Playground: create a Spore | Completed |
| Sep 17, 2026 | Mini dApp: wallet connect, transfer CKB, view on-chain data | Completed |
| Sep 17, 2026 | xUDT: mint 1,000 tokens, transfer 100 tokens | Completed |
| Sep 17, 2026 | Node.js scripts: query balance, list cells | Completed |
| Sep 18, 2026 | Spore: create cluster, create spore, query both | Completed |
| Sep 18, 2026 | Spore: transfer spore, transfer cluster, melt spore | Completed |

---

## 15. Remaining Tasks

- Build a small Node.js/Express backend that exposes the `4_nodejs_be/` query scripts as REST endpoints, and connect the mini dApp to it (kept purely client-side this week).
- Fix the raw-shannon balance display in the mini dApp's `ConnectButton` header to use `ccc.fixedPointToString` consistently.
- Add a message-signing / signature-verification example with CCC (not covered this week).
- Move stored private keys out of script source files and into `.env` (the `dotenv` dependency is already present but unused for this purpose).
- Begin **Rust and CKB Script fundamentals** for Week 3, as planned at the end of the Week 1 report.

---

## 16. Week 2 Outcome

By the end of Week 2, I moved from Devnet beginner exercises into practical Testnet application development with **CCC**: building and completing transactions from the Playground and from plain TypeScript, issuing and transferring an xUDT token, running the full Spore Protocol lifecycle (create, query, transfer, melt) across two accounts, and connecting a real browser wallet to a small React/Next.js dApp.

The most valuable lesson was debugging a real capacity/insufficient-funds error in the Spore lock-proxy flow — it forced a much more concrete understanding of how CKB capacity is actually allocated across a transaction's inputs and outputs, beyond just "does the account have enough balance."

The next step is to start **Rust and CKB Script development** in Week 3, building on the CCC application-layer experience from this week.

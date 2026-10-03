# CKB Weekly Report - Week 4

**Reporting period:** 3 October 2026
**Participant:** Long Tran

## 1. Week 4 Overview

This week I built a basic DOB marketplace on CKB testnet. A user can connect a wallet, create a DOB (Spore) from an image, list it for sale at a price, and another user can buy it. The marketplace data (name, owner, price, status, image) is stored in a PostgreSQL database (Neon), and the market page reads its listings from that database.

The marketplace is at [`marketplace/`](./marketplace/). It is a Next.js app that uses `@ckb-ccc/connector-react` in the browser and `@ckb-ccc/shell` on the server.

## 2. Environment

- CKB Testnet (`ClientPublicTestnet`)
- Next.js 16.3.8, React 19.2.8, Tailwind CSS 4
- `@ckb-ccc/connector-react` 2.2.2, `@ckb-ccc/shell` 1.3.15 (includes Spore)
- PostgreSQL on Neon, accessed with `pg`
- Wallet: browser wallet connected through CCC

## 3. Evidence

| ID | Step | Screenshot |
|---|---|---|
| 01 | Run the marketplace app | [`01_run_marketplace.png`](./evidence/01_run_marketplace.png) |
| 02 | Connect wallet | [`02_connect_wallet_success.png`](./evidence/02_connect_wallet_success.png) |
| 03 | DOB created | [`03_DOB_created.png`](./evidence/03_DOB_created.png) |
| 04 | DOB listed for sale | [`04_DOB_listed.png`](./evidence/04_DOB_listed.png) |
| 05 | Buy the DOB | [`05_buy_DOB.png`](./evidence/05_buy_DOB.png) |
| 06 | DOB claimed by the buyer | [`06_DOB_claimed.png`](./evidence/06_DOB_claimed.png) |
| 07 | DOB shown in the buyer's wallet | [`07_DOB_on_wallet.png`](./evidence/07_DOB_on_wallet.png) |

## 4. How it works

**Project structure**

| Layer | Files | Role |
|---|---|---|
| Components | `connectButton`, `createDOB`, `sellDOB`, `buyDOB`, `nftList`, `marketplace` | UI and wallet signing in the browser |
| API routes | `app/api/nfts/...`, `app/api/market` | Receive the file upload, return DOB data and files, handle list / buy / cancel |
| Services | `nftService.ts`, `chainService.ts` | `nftService` talks to the database. `chainService` checks transactions on-chain and signs with the market wallet |

**Flow**

1. **Connect wallet:** the user connects through CCC and the app shows the address and balance.
2. **Create DOB:** the wallet signs a transaction that mints a Spore whose content is the uploaded image. After it is committed, the image and info are sent to `POST /api/nfts`. The server checks that the Spore exists on-chain, belongs to the owner and matches the file, then saves it to the database.
3. **Sell:** the seller transfers the DOB to the market's escrow wallet. The server verifies the transaction and saves the price and `listed` status in the database.
4. **Buy:** the buyer sends the price in CKB to the seller. The server verifies that the buyer signed the payment and that the amount is enough, then the market wallet transfers the DOB to the buyer.
5. **Cancel listing:** the market wallet returns the DOB to the seller.

The marketplace page lists the NFTs with status `listed` from the database.

## 5. What I learned

- A Spore keeps its content on-chain, and each byte costs capacity, so images have to stay small.
- With CCC, `ccc.spore.createSpore` and `ccc.spore.transferSpore` build the transactions, and the app completes fees and sends them with the connected signer.
- A buy has two steps that are not atomic: the buyer pays, then the market sends the DOB. To avoid double sales and stolen payments, the server locks the NFT status before processing and checks that the payment transaction was signed by the buyer.
- Next.js runs `.env` automatically, but a standalone script run with `tsx` does not load it. That caused the `ENOTFOUND base` error when I ran `db.ts` by hand.

## 6. Limitations

- DOBs for sale are held by an escrow wallet whose private key is kept on the server. The server has to be trusted, and leaking the key would expose every listed DOB.
- Buying is not atomic, as described above.
- Cancelling a listing has no signature check yet.

## 7. Next week

Next week I will integrate a **smart contract** (an on-chain lock script) into the marketplace. DOBs for sale will be locked by the contract instead of being held by the escrow wallet, so the contract enforces the price on-chain. A buyer will then pay the seller and take the DOB in a single atomic transaction, and the server will no longer need to hold a private key or sign transfers.

# CKB Weekly Report - Week 1

**Reporting period:** 11 September 2026
**Publication date:** 11 September 2026
**Participant:** [Your Name]

## 1. Week 1 Overview

The goal of Week 1 was to set up the local development environment for CKB, become familiar with basic CKB concepts, and complete the beginner exercises.

The completed exercises for Week 1 are:

- Exercise 00: Getting Started
- Exercise 01: Transfer CKB
- Exercise 02: Store Data on Cell
- Exercise 03: Create Fungible Token (xUDT)
- Exercise 04: Create DOB
- Exercise 05: Simple Lock

## 2. Development Environment

- OS: Windows 10 Pro
- Node.js: v24.15.0
- npm: 11.12.1
- OffCKB: 0.4.13
- CKB: 0.208.0
- Repository: `D:\CKBuilders`
- Devnet RPC: `http://127.0.0.1:8114`
- Devnet RPC Proxy: `http://127.0.0.1:28114`

## 3. Evidence

| ID | Exercise | Evidence |
|---|---|---|
| 00 | Getting Started | [`1_setup/`](./1_setup/) |
| 01 | Transfer CKB | [`2_transfer_CKB/`](./2_transfer_CKB/) |
| 02 | Store Data on Cell | [`3_store_Data_On_Cells/`](./3_store_Data_On_Cells/) |
| 03 | Create Fungible Token | [`4_create_Fungible_Token/`](./4_create_Fungible_Token/) |
| 04 | Create DOB | [`5_create_DOB/`](./5_create_DOB/) |
| 05 | Simple Lock | [`6_build_simple_Lock/`](./6_build_simple_Lock/) |

All evidence screenshots are stored in their respective exercise directories.

## 4. CKB Fundamentals

### Cell Model

The Cell Model is the fundamental state model of CKB. Blockchain state is represented by cells, which can be consumed by transactions and replaced by newly created cells.

### Capacity

Capacity represents the amount of CKBytes held by a cell. A cell must have sufficient capacity to cover the space occupied by its scripts and data. CKBytes are also the native token of the CKB network.

### Transaction

A transaction consumes existing input cells and creates new output cells, representing a state transition on the CKB blockchain.

### Input / Output

Inputs reference existing cells that are consumed by a transaction. Outputs define the new cells created by the transaction.

### Lock Script

A Lock Script defines the conditions required to unlock and consume a cell. It is commonly used to define ownership and authorization.

### Type Script

A Type Script is an optional script attached to a cell that validates transaction conditions and enforces rules related to the cell's data and state transitions.

### Data

Cell data stores application-specific information associated with a cell. It can be used to represent application state or other on-chain information, such as a stored message or a Digital Object (DOB) image.

### RPC

RPC (Remote Procedure Call) provides an interface for applications and development tools to communicate with a CKB node, including querying blockchain state and submitting transactions.

## 5. Exercise 00 - Getting Started

### Objective

Install the required tooling and start a local CKB Devnet.

### Procedure

- Installed the OffCKB CLI globally with `npm install -g @offckb/cli`.
- Started the local Devnet with `offckb node`.
- Verified the Devnet was ready and listed the pre-funded development accounts with `offckb accounts`.

### Result

- CKB Devnet became ready at `http://127.0.0.1:8114`.
- The Devnet RPC Proxy started at `http://127.0.0.1:28114`.
- 20 pre-funded development accounts (each holding 42,000,000 CKB) were listed and available for use in later exercises.

### What I Learned

I learned how to install OffCKB, launch a local CKB Devnet, and inspect the pre-funded development accounts that OffCKB provisions for local testing.

### Evidence

See the [Exercise 00 evidence folder](./1_setup/).

## 6. Exercise 01 - Transfer CKB

### Objective

The objective was to complete the beginner "Transfer CKB" exercise and learn how to transfer CKB between development accounts on a local CKB Devnet.

The transfer was performed using two approaches:

1. `offckb` CLI
2. CKB Simple Transfer dApp

### Environment

- Network: Local CKB Devnet
- Sender: Devnet Account #0
- Receiver: Devnet Account #19

### Procedure

#### 1. CLI Transfer

A 100 CKB transfer was executed from Devnet Account #0 to Devnet Account #19 using the `offckb transfer --privkey` command.

Transaction hash:

`0x14e8ac4cac3d92fde4da537e38749ff3a7c89fc5ef024df08d60f2f972b19953`

The resulting balance was then checked using `offckb balance`.

#### 2. Simple Transfer dApp

The CKB Simple Transfer example from the CKB documentation was run locally (`parcel index.html`, served at `http://localhost:1234`).

The dApp was configured to use the local Devnet and was used to perform a 62 CKB transfer from Account #0 to another Devnet address.

Transaction hash:

`0x0df2d80c26a232a73c39c0399358026285388483d9dc835d0876474be8f7817f`

### Result

Both CKB transfers were successfully submitted to the local CKB Devnet and confirmed.

### Balance Verification

- Balance after the CLI transfer (Account #0): `41,997,367.99996462 CKB`
- The dApp reported a total capacity of `1,185 CKB` on the account used before submitting its own 62 CKB transfer.

### What I Learned

I learned how to interact with a local CKB Devnet through both the `offckb` CLI and a frontend dApp.

I gained hands-on experience submitting CKB transactions, checking account balances, and observing how transaction fees affect the sender's balance.

I also gained a basic understanding of the CKB Cell Model and how transactions consume existing cells and create new cells.

### Evidence

See the [Exercise 01 evidence folder](./2_transfer_CKB/).

## 7. Exercise 02 - Store Data on Cell

### Objective

To learn how application data can be written to and read back from a CKB cell using a custom lock script setup.

### Procedure

- Ran the "Store Data on Cell" dApp locally (`npm install; npm start`, served at `http://localhost:1234`, connected to `devnet · http://127.0.0.1:28114`).
- Wrote the message `hello common knowledge base!` into a cell using Devnet Account #0.
- Read the message back from the same cell to confirm it was stored correctly.

### Result

- Write transaction hash: `0x1e8911304cb33674c27d0c41a53f883a019151b49e61fc3875f0bc9fbcb24cbb`
- The "Read" action successfully returned: `Message: hello common knowledge base!`

### What I Learned

I learned how a CKB cell's `data` field can be used to persist arbitrary application data on-chain, and how a dApp can write to and subsequently read from that cell using the same lock script/account.

### Evidence

See the [Exercise 02 evidence folder](./3_store_Data_On_Cells/).

## 8. Exercise 03 - Create Fungible Token (xUDT)

### Objective

To issue a custom fungible token (xUDT) on the local Devnet, query it, and transfer a portion of it to another address.

### Procedure

- Ran the xUDT Scripts dApp example locally, served at `http://localhost:1234`.
- Issued a custom token with an amount of `50` using Devnet Account #0.
- Queried the issued token by its xUDT args to confirm the token cell and balance.
- Transferred `1` unit of the custom token to another Devnet address.

### Result

- Issue transaction hash: `0x912810663392cd51359aee9abcd0b6da6affeabc961ab3a895c829fc45387833`
- Token xUDT args (unique token identifier): `0x7de82d61a7eb2ec82b0dc653e558ba120efcbfbb44dac87c12972d05bf25065300000000`
- Querying the token showed Cell #0 holding a token amount of `50`, owned by Account #0's lock script.
- The transfer of `1` token unit to another address was submitted successfully.

### What I Learned

I learned how the xUDT standard represents fungible tokens as CKB cells, how the type script args act as a unique token identifier (similar to a contract address in the account model), and how token ownership and balances map to specific cells.

### Evidence

See the [Exercise 03 evidence folder](./4_create_Fungible_Token/).

## 9. Exercise 04 - Create DOB

### Objective

To create an on-chain Digital Object (DOB/Spore) by embedding image data directly into a CKB cell, then verify the stored content.

### Procedure

- Ran the Create DOB dApp locally (`npm install; npm start`, served at `http://localhost:1234`), configured to use the local Devnet.
- Uploaded a JPEG image (`download.jfif`, 3,893 bytes) using a funded Devnet account.
- Created the Spore/DOB cell and checked its content via the "Check Spore Content" action.

### Result

- Create DOB transaction hash: `0xf1996ce075f0a745c9025bc6f5294ed14592722ccb86875890c78e3d1f964b59`
- "Check Spore Content" confirmed `contentType: image/jpeg` and correctly rendered the uploaded image from on-chain cell data.

### What I Learned

I learned that a Digital Object's content is stored directly as CKB cell data, that cell capacity requirements scale with the size of the stored content, and that the correct network configuration (Devnet vs. Testnet) must match the account being used, otherwise the account has insufficient capacity to cover the data storage cost.

### Evidence

See the [Exercise 04 evidence folder](./5_create_DOB/).

## 10. Exercise 05 - Simple Lock

### Objective

To build and deploy a custom hash-lock contract to the CKB Devnet, run its frontend, and successfully execute a transfer by providing the correct preimage.

### Procedure

- Built the JavaScript hash-lock contract with `pnpm run deploy -- --network devnet` (build + deploy pipeline).
- Deployed `hash-lock.bc` successfully to the local CKB Devnet.
- Ran the Next.js frontend locally at `http://localhost:3000`.
- Generated a hash-lock address from the preimage `Hello World`.
- Deposited 123 CKB to the generated hash-lock address.
- Revealed the preimage `Hello World` and transferred 99 CKB out of the hash-lock cell.

### Result

- The deployment transaction for `hash-lock.bc` was committed, and the frontend's "Deployment health" indicator showed `DEVNET · READY`.
- The deposit of 123 CKB to the hash-lock address was confirmed (Total live capacity: `123 CKB`).
- The reveal-and-transfer transaction status was `committed`.
- Transfer transaction hash: `0x5f1a9ab191d7ea68b8a5f4968b6edf3b6d5772e7663e5c5d04b94471f9d03ec6`

### What I Learned

I gained practical experience compiling and deploying a custom script to the Devnet, interacting with it via a local Next.js frontend, and unlocking a cell by revealing its correct preimage ("Hello World"). I also learned that this example returns change to the same hash-lock address for educational purposes only, and that production transactions should send change to a signature-protected address instead.

### Evidence

See the [Exercise 05 evidence folder](./6_build_simple_Lock/).

## 11. Week 1 Development Log

| Date | Activity | Result | Evidence |
|---|---|---|---|
| Sep 11, 2026 | OffCKB installation and Devnet startup | Completed | [Exercise 00 evidence](./1_setup/) |
| Sep 11, 2026 | CLI CKB transfer | Completed | [Exercise 01 evidence](./2_transfer_CKB/) |
| Sep 11, 2026 | Simple Transfer dApp setup and execution | Completed | [Exercise 01 evidence](./2_transfer_CKB/) |
| Sep 11, 2026 | Store Data on Cell: write and read | Completed | [Exercise 02 evidence](./3_store_Data_On_Cells/) |
| Sep 11, 2026 | Issue, view, and transfer a custom xUDT token | Completed | [Exercise 03 evidence](./4_create_Fungible_Token/) |
| Sep 11, 2026 | Create DOB and verify Spore content | Completed | [Exercise 04 evidence](./5_create_DOB/) |
| Sep 11, 2026 | Simple Lock contract build, deploy, deposit, and unlock | Completed | [Exercise 05 evidence](./6_build_simple_Lock/) |

## 12. Challenges

The main challenges during Week 1 were:

- **Windows-only build scripts:** The Simple Lock example's build script invoked `esbuild` using a Unix-style relative path (`./node_modules/.bin/esbuild`), which `cmd.exe` cannot parse. The fix was to build the executable path with Node's `path.join`, which resolves correctly on both Windows and POSIX shells.

- **ESM entry-point check on Windows:** The Simple Lock deploy script's `if (import.meta.url === \`file://${process.argv[1]}\`)` guard never matched on Windows because `process.argv[1]` uses backslashes while `import.meta.url` uses a `file:///`-style URL with forward slashes. This silently skipped the actual deployment step. The fix was to use Node's `url.pathToFileURL()` to build a directly comparable URL.

- **pnpm supply-chain build approval:** Newer versions of pnpm block native postinstall scripts (`esbuild`, `secp256k1`, `sharp`, `unrs-resolver`) until explicitly approved via `pnpm approve-builds`, which also caused `pnpm install` itself to exit with a non-zero code and made a script's automatic dependency check fail.

- **Devnet vs. Testnet network mismatch:** The Create DOB dApp defaulted to the public CKB Testnet when the `NETWORK` environment variable was not set, while the private key used was only funded on the local Devnet. This produced a misleading "Not enough capacity in from infos!" error that was actually caused by querying the wrong network rather than an actual lack of funds.

- **CKB Cell Model:** Understanding the difference between the traditional account/balance model and CKB's Cell Model required some adjustment. The Transfer CKB exercise helped connect the concept with actual transactions.

All challenges were resolved, and the Week 1 exercises were completed successfully.

## 13. Final Reflection

Week 1 gave me a practical introduction to developing on Nervos CKB.

I set up a local CKB development environment, started a Devnet, worked with development accounts, and completed CKB transfers through both the command line and a frontend dApp.

By progressing through the six beginner exercises, the practical work helped me connect basic CKB concepts with actual transaction workflows, understand the relationships between cells, tokens, digital objects, and transaction fees, and successfully build, deploy, and interact with a custom hash-lock smart contract.

I am now prepared to dive deeper into CKB application and script development.

## 14. Week 2 Goals - Building Applications on CKB

The main goal for Week 2 is to move from basic CKB usage to hands-on application development.

I will focus on understanding how JavaScript / TypeScript applications interact with CKB through **CCC (Common Chain Connector)**, while also beginning to explore CKB Script development with Rust.

### 14.1 Application Development with CCC

I will use CCC as the main entry point for learning how to build CKB applications.

My planned activities are:

- Explore the CCC App and understand its main features.
- Experiment with CKB transactions using the CCC Playground.
- Read and run relevant CCC examples.
- Learn the basic CCC API and its core concepts.
- Build simple CKB application flows using JavaScript / TypeScript.
- Understand how a frontend application connects to CKB and interacts with cells and transactions.

### 14.2 Introduction to Rust and CKB Scripts

After gaining more experience with application-level development, I will start learning how CKB Scripts are developed and executed.

The initial focus will be:

- Set up the Rust development environment for CKB.
- Explore the CKB Rust SDK and related examples.
- Learn the basic structure of a CKB Script.
- Understand Script arguments and execution.
- Build and test a simple Script.
- Explore the use of CKB-CLI and CKB Debugger during development and testing.

### 14.3 Supporting Tools

I will also become familiar with developer tools that are useful when working with CKB:

- CKB Testnet Faucet.
- CKB Debugger.
- CKB-CLI.
- CKB Tools.

These tools will be explored alongside the main development activities when they are needed.

### 14.4 Expected Outcome

By the end of Week 2, I aim to:

1. Understand the basic workflow of building a CKB application with JavaScript / TypeScript.
2. Be comfortable with the core concepts and APIs provided by CCC.
3. Build and test simple CKB application flows.
4. Understand the basic architecture and execution model of CKB Scripts.
5. Have a working Rust environment for further CKB Script development.
6. Be ready to move from beginner exercises toward building a small CKB-based project.

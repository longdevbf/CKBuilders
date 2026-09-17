import { ccc } from "@ckb-ccc/shell";

// ======================================================
// CONFIG
// ======================================================

// Private key Testnet
// 64 ký tự hex, KHÔNG có "0x"
const PRIVATE_KEY =
  "0xace08599f3174f4376ae51fdc30950d4f2d731440382bb0aa1b6b0bd3a9728cd";

// Ví nhận token
const RECEIVER_ADDRESS =
  "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvm52pxjfczywarv63fmjtyqxgs2syfffq2348ad";

// Số token mint
const MINT_AMOUNT = "1000";

// Số token transfer
const TRANSFER_AMOUNT = "100";


// ======================================================
// MAIN
// ======================================================

async function main() {
  // CKB Testnet
  const client = new ccc.ClientPublicTestnet();

  // Signer thật - có khả năng ký transaction
  const signer = new ccc.SignerCkbPrivateKey(
    client,
    PRIVATE_KEY
  );

  await signer.connect();

  const address =
    await signer.getRecommendedAddress();

  console.log("====================================");
  console.log("CKB xUDT Demo");
  console.log("====================================");

  console.log("\nAddress:");
  console.log(address);

  const balance =
    await signer.getBalance();

  console.log(
    "\nCKB Balance:",
    ccc.fixedPointToString(balance),
    "CKB"
  );

  // ======================================================
  // 1. LẤY LOCK SCRIPT CỦA ISSUER
  // ======================================================

  const addressObj =
    await signer.getRecommendedAddressObj();

  const issuerLock =
    addressObj.script;

  console.log("\nIssuer Lock:");
  console.log(issuerLock);

  // ======================================================
  // 2. TẠO TOKEN ARGS
  //
  // owner-mode xUDT:
  // args = hash(lock script của issuer)
  // ======================================================

  const tokenArgs =
    issuerLock.hash();

  console.log("\nToken Args:");
  console.log(tokenArgs);

  // ======================================================
  // 3. TẠO xUDT TYPE SCRIPT
  // ======================================================

  const type =
    await ccc.Script.fromKnownScript(
      signer.client,
      ccc.KnownScript.XUdt,
      tokenArgs
    );

  console.log("\nxUDT Type Script:");
  console.log(type);

  // ======================================================
  // 4. LẤY CODE CELL CỦA xUDT
  // ======================================================

  const knownScript =
    await signer.client.getKnownScript(
      ccc.KnownScript.XUdt
    );

  const deps =
    await signer.client.getCellDeps(
      knownScript.cellDeps
    );

  if (!deps[0]) {
    throw new Error(
      "Cannot find xUDT cell dep"
    );
  }

  const code =
    deps[0].outPoint;

  console.log("\nxUDT Code OutPoint:");
  console.log(code);

  // ======================================================
  // 5. TẠO UDT OBJECT
  // ======================================================

  const udt =
    new ccc.udt.Udt(
      code,
      type
    );

  // ======================================================
  // COMMAND
  //
  // npx ts-node udt.ts mint
  // npx ts-node udt.ts transfer
  // ======================================================

  const command =
    process.argv[2];

  if (command === "mint") {
    await mintUdt(
      signer,
      udt,
      issuerLock
    );

    return;
  }

  if (command === "transfer") {
    await transferUdt(
      signer,
      udt
    );

    return;
  }

  console.log("\nCommands:");

  console.log(
    "npx ts-node udt.ts mint"
  );

  console.log(
    "npx ts-node udt.ts transfer"
  );
}


// ======================================================
// MINT xUDT
// ======================================================

async function mintUdt(
  signer: ccc.Signer,
  udt: ccc.udt.Udt,
  issuerLock: ccc.Script
) {
  console.log("\n====================================");
  console.log("MINT xUDT");
  console.log("====================================");

  console.log(
    "Amount:",
    MINT_AMOUNT
  );

  // Tạo output chứa UDT
  let { res: tx } =
    await udt.mint(
      signer,
      [
        {
          to: issuerLock,

          amount:
            ccc.fixedPointFrom(
              MINT_AMOUNT
            ),
        },
      ]
    );

  console.log(
    "\nUDT mint output created"
  );

  // Cell chứa UDT vẫn cần CKB capacity
  await tx.completeInputsByCapacity(
    signer
  );

  console.log(
    "CKB capacity completed"
  );

  // Phí mạng
  await tx.completeFeeBy(
    signer
  );

  console.log(
    "Fee completed"
  );

  console.log(
    "\nSigning & broadcasting..."
  );

  const txHash =
    await signer.sendTransaction(
      tx
    );

  console.log(
    "\n✅ MINT SUCCESS"
  );

  console.log("\nTX Hash:");

  console.log(
    txHash
  );

  console.log(
    "\nExplorer:"
  );

  console.log(
    `https://testnet.explorer.nervos.org/transaction/${txHash}`
  );
}


// ======================================================
// TRANSFER xUDT
// ======================================================

async function transferUdt(
  signer: ccc.Signer,
  udt: ccc.udt.Udt
) {
  console.log("\n====================================");
  console.log("TRANSFER xUDT");
  console.log("====================================");

  if (
    !RECEIVER_ADDRESS ||
    !RECEIVER_ADDRESS.startsWith("ckt")
  ) {
    throw new Error(
      "RECEIVER_ADDRESS chưa hợp lệ"
    );
  }

  console.log(
    "\nReceiver:"
  );

  console.log(
    RECEIVER_ADDRESS
  );

  // Address -> lock script
  const {
    script: receiverLock
  } =
    await ccc.Address.fromString(
      RECEIVER_ADDRESS,
      signer.client
    );

  console.log(
    "\nTransfer amount:",
    TRANSFER_AMOUNT
  );

  // ======================================================
  // TẠO UDT OUTPUT
  // ======================================================

  let { res: tx } =
    await udt.transfer(
      signer,
      [
        {
          to: receiverLock,

          amount:
            ccc.fixedPointFrom(
              TRANSFER_AMOUNT
            ),
        },
      ]
    );

  console.log(
    "\nUDT output created"
  );

  // ======================================================
  // TÌM UDT INPUT CELLS
  //
  // Ví dụ đang có:
  //
  // 1000 token
  //
  // Send 100
  //
  // output:
  // 100 -> receiver
  // 900 -> change về sender
  // ======================================================

  tx =
    await udt.completeBy(
      tx,
      signer
    );

  console.log(
    "UDT inputs + change completed"
  );

  // Thêm CKB input để đủ capacity
  await tx.completeInputsByCapacity(
    signer
  );

  console.log(
    "CKB capacity completed"
  );

  // Phí
  await tx.completeFeeBy(
    signer
  );

  console.log(
    "Fee completed"
  );

  console.log(
    "\nSigning & broadcasting..."
  );

  const txHash =
    await signer.sendTransaction(
      tx
    );

  console.log(
    "\n✅ TRANSFER SUCCESS"
  );

  console.log(
    "\nTX Hash:"
  );

  console.log(
    txHash
  );

  console.log(
    "\nExplorer:"
  );

  console.log(
    `https://testnet.explorer.nervos.org/transaction/${txHash}`
  );
}


// ======================================================
// RUN
// ======================================================

main().catch(
  (error) => {
    console.error(
      "\n❌ ERROR"
    );

    console.error(
      error instanceof Error
        ? error.message
        : error
    );

    process.exit(1);
  }
);
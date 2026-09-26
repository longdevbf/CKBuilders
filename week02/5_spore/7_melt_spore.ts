import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import { ccc } from "@ckb-ccc/shell";
import {
  findSpore,
  meltSpore,
} from "@ckb-ccc/spore";

async function main() {
  const receiverPrivateKey =
    "0x1ef1c9cbf031d7bc181c039cebb4f2914dbad689ab268e192fe22ea314d9b4a4";

  if (!receiverPrivateKey) {
    throw new Error(
      "Thiếu RECEIVER_PRIVATE_KEY",
    );
  }

  const state = JSON.parse(
    await readFile("./spore-state.json", "utf8"),
  );

  if (!state.sporeId) {
    throw new Error("Không tìm thấy sporeId");
  }

  const clientOwner = ccc.ClientPublicTestnet.open();
  const client = clientOwner.value;

  try {
    const signer =
      new ccc.SignerCkbPrivateKey(
        client,
        receiverPrivateKey,
      );

    await signer.connect();

    const address =
      await signer.getRecommendedAddress();

    console.log("Receiver:", address);

    const before = await findSpore(
      client,
      state.sporeId,
    );

    if (!before) {
      console.log(
        "Spore đã không còn tồn tại.",
      );

      return;
    }

    console.log(
      "Spore exists before melt:",
      state.sporeId,
    );

    const { tx } = await meltSpore({
      signer,
      id: state.sporeId,
    });

    await tx.completeFeeBy(signer);

    const txHash =
      await signer.sendTransaction(tx);

    console.log("Melt TX:", txHash);

    await client.waitTransaction(txHash, 1);

    console.log("Melt committed!");

    const after = await findSpore(
      client,
      state.sporeId,
    );

    console.log(
      "Spore after melt:",
      after
        ? "STILL EXISTS"
        : "DESTROYED",
    );

    state.meltSporeTx = txHash;
    state.melted = true;

    await writeFile(
      "./spore-state.json",
      JSON.stringify(state, null, 2),
    );
  } finally {
    await clientOwner.dispose();
  }
}

main().catch(console.error);
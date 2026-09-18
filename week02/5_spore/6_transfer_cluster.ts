import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import { ccc } from "@ckb-ccc/shell";
import { transferSporeCluster } from "@ckb-ccc/spore";

async function main() {
  const ownerPrivateKey =
    "0x76f51bf03e38b7f4a3c2cd8b088103e746f0e425fb0c5e0f8b22061f41c790cc";

  const receiverPrivateKey =
    "0x1ef1c9cbf031d7bc181c039cebb4f2914dbad689ab268e192fe22ea314d9b4a4";

  if (!ownerPrivateKey) {
    throw new Error("Thiếu OWNER_PRIVATE_KEY");
  }

  if (!receiverPrivateKey) {
    throw new Error("Thiếu RECEIVER_PRIVATE_KEY");
  }

  const state = JSON.parse(
    await readFile("./spore-state.json", "utf8"),
  );

  if (!state.clusterId) {
    throw new Error("Không tìm thấy clusterId");
  }

  const clientOwner = ccc.ClientPublicTestnet.open();
  const client = clientOwner.value;

  try {
    const ownerSigner =
      new ccc.SignerCkbPrivateKey(
        client,
        ownerPrivateKey,
      );

    const receiverSigner =
      new ccc.SignerCkbPrivateKey(
        client,
        receiverPrivateKey,
      );

    await ownerSigner.connect();
    await receiverSigner.connect();

    const receiverAddress =
      await receiverSigner.getRecommendedAddress();

    console.log(
      "Transfer Cluster to:",
      receiverAddress,
    );

    const { script: receiverLock } =
      await ccc.Address.fromString(
        receiverAddress,
        client,
      );

    const { tx } =
      await transferSporeCluster({
        signer: ownerSigner,
        id: state.clusterId,
        to: receiverLock,
      });

    await tx.completeInputsByCapacity(
      ownerSigner,
    );

    await tx.completeFeeBy(ownerSigner);

    const txHash =
      await ownerSigner.sendTransaction(tx);

    console.log("Transaction:", txHash);

    await client.waitTransaction(txHash, 1);

    console.log("Cluster transferred!");

    state.transferClusterTx = txHash;

    await writeFile(
      "./spore-state.json",
      JSON.stringify(state, null, 2),
    );
  } finally {
    await clientOwner.dispose();
  }
}

main().catch(console.error);
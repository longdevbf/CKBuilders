
import { writeFile } from "node:fs/promises";
import { ccc } from "@ckb-ccc/shell";
import { createSporeCluster } from "@ckb-ccc/spore";

async function main() {
  const privateKey = "0x76f51bf03e38b7f4a3c2cd8b088103e746f0e425fb0c5e0f8b22061f41c790cc"

  if (!privateKey) {
    throw new Error("OWNER_PRIVATE_KEY chưa được khai báo trong .env");
  }

  const clientOwner = ccc.ClientPublicTestnet.open();
  const client = clientOwner.value;

  try {
    const signer = new ccc.SignerCkbPrivateKey(client, privateKey);
    await signer.connect();

    const address = await signer.getRecommendedAddress();

    console.log("Owner address:", address);

    const balance = await signer.getBalance();

    console.log(
      "Balance:",
      ccc.fixedPointToString(balance),
      "CKB",
    );

    const { tx, id: clusterId } = await createSporeCluster({
      signer,
      data: {
        name: "Long CKB Collection",
        description: "My first Spore collection on CKB Testnet",
      },
    });

    await tx.completeInputsByCapacity(signer);
    await tx.completeFeeBy(signer);

    const txHash = await signer.sendTransaction(tx);

    console.log("Transaction sent:", txHash);

    await client.waitTransaction(txHash, 1);

    console.log("Transaction committed!");
    console.log("Cluster ID:", clusterId);

    await writeFile(
      "./spore-state.json",
      JSON.stringify(
        {
          clusterId,
          createClusterTx: txHash,
        },
        null,
        2,
      ),
    );

    console.log("Saved to spore-state.json");
  } finally {
    await clientOwner.dispose();
  }
}

main().catch(console.error);
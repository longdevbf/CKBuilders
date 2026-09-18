import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import { ccc } from "@ckb-ccc/shell";
import { createSpore } from "@ckb-ccc/spore";

async function main() {
  const privateKey = "0x76f51bf03e38b7f4a3c2cd8b088103e746f0e425fb0c5e0f8b22061f41c790cc";

  if (!privateKey) {
    throw new Error("OWNER_PRIVATE_KEY chưa được khai báo");
  }

  const state = JSON.parse(
    await readFile("./spore-state.json", "utf8"),
  );

  if (!state.clusterId) {
    throw new Error(
      "Không tìm thấy clusterId. Hãy chạy file 01 trước.",
    );
  }

  const clientOwner = ccc.ClientPublicTestnet.open();
  const client = clientOwner.value;

  try {
    const signer = new ccc.SignerCkbPrivateKey(client, privateKey);
    await signer.connect();

    const metadata = {
      name: "Long's First Spore",
      description: "My first Digital Object on Nervos CKB",
      creator: "Long Tran",
      type: "Demo",
      level: 1,
      skills: [
        "CKB",
        "CCC",
        "Spore Protocol",
      ],
      createdAt: new Date().toISOString(),
    };

    console.log("Metadata:");
    console.log(metadata);

    const { tx, id: sporeId } = await createSpore({
      signer,

      data: {
        contentType: "application/json",

        content: new TextEncoder().encode(
          JSON.stringify(metadata),
        ),

        clusterId: state.clusterId,
      },

      clusterMode: "lockProxy",
    });

    await tx.completeInputsByCapacity(signer);
    await tx.completeFeeBy(signer);

    const txHash = await signer.sendTransaction(tx);

    console.log("Transaction sent:", txHash);

    await client.waitTransaction(txHash, 1);

    console.log("Transaction committed!");
    console.log("Spore ID:", sporeId);

    state.sporeId = sporeId;
    state.createSporeTx = txHash;

    await writeFile(
      "./spore-state.json",
      JSON.stringify(state, null, 2),
    );
  } finally {
    await clientOwner.dispose();
  }
}

main().catch(console.error);
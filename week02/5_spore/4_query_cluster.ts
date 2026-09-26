import "dotenv/config";
import { readFile } from "node:fs/promises";
import { ccc } from "@ckb-ccc/shell";
import {
  findCluster,
  findSporeClustersBySigner,
} from "@ckb-ccc/spore";

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
      "Không có clusterId. Hãy chạy file 01 trước.",
    );
  }

  const clientOwner = ccc.ClientPublicTestnet.open();
  const client = clientOwner.value;

  try {
    const signer = new ccc.SignerCkbPrivateKey(client, privateKey);
    await signer.connect();

    console.log("=== FIND CLUSTER BY ID ===");

    const result = await findCluster(
      client,
      state.clusterId,
    );

    if (!result) {
      console.log("Cluster không tồn tại.");
      return;
    }

    console.log(
      "Cluster ID:",
      state.clusterId,
    );

    console.log(
      "Name:",
      result.clusterData.name,
    );

    console.log(
      "Description:",
      result.clusterData.description,
    );

    console.log("\n=== ALL OWNER CLUSTERS ===");

    for await (const {
      cluster,
      clusterData,
    } of findSporeClustersBySigner({
      signer,
      order: "desc",
    })) {
      console.log("--------------------");

      console.log(
        "ID:",
        cluster.cellOutput.type?.args,
      );

      console.log(
        "Name:",
        clusterData.name,
      );

      console.log(
        "Description:",
        clusterData.description,
      );
    }
  } finally {
    await clientOwner.dispose();
  }
}

main().catch(console.error);
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { bytesTo, ccc } from "@ckb-ccc/shell";
import {
  findSpore,
  findSporesBySigner,
} from "@ckb-ccc/spore";

async function main() {
  const privateKey = "0x76f51bf03e38b7f4a3c2cd8b088103e746f0e425fb0c5e0f8b22061f41c790cc";

  if (!privateKey) {
    throw new Error("OWNER_PRIVATE_KEY chưa được khai báo");
  }

  const state = JSON.parse(
    await readFile("./spore-state.json", "utf8"),
  );

  if (!state.sporeId) {
    throw new Error(
      "Không có sporeId. Hãy chạy file 02 trước.",
    );
  }

  const clientOwner = ccc.ClientPublicTestnet.open();
  const client = clientOwner.value;

  try {
    const signer = new ccc.SignerCkbPrivateKey(client, privateKey);
    await signer.connect();

    console.log("=== FIND SPORE BY ID ===");

    const result = await findSpore(
      client,
      state.sporeId,
    );

    if (!result) {
      console.log("Spore không tồn tại.");
      return;
    }

    console.log("Spore ID:", state.sporeId);

    console.log(
      "Content Type:",
      result.sporeData.contentType,
    );

    console.log(
      "Cluster ID:",
      result.sporeData.clusterId,
    );

    const content = bytesTo(
      result.sporeData.content, "utf8"
    );

    console.log("Raw content:");
    console.log(content);

    try {
      console.log("Parsed JSON:");
      console.log(JSON.parse(content));
    } catch {
      // không phải JSON
    }

    console.log("\n=== ALL SPORES OF OWNER ===");

    for await (const {
      spore,
      sporeData,
    } of findSporesBySigner({
      signer,
      order: "desc",
    })) {
      console.log("------------------------");

      console.log(
        "ID:",
        spore.cellOutput.type?.args,
      );

      console.log(
        "Content type:",
        sporeData.contentType,
      );

      console.log(
        "Cluster:",
        sporeData.clusterId,
      );
    }
  } finally {
    await clientOwner.dispose();
  }
}

main().catch(console.error);
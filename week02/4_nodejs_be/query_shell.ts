import { ccc } from "@ckb-ccc/shell";
async function main(){
const client = new ccc.ClientPublicTestnet();

const privateKey = "0x0a0ecce6f15c444e6d0013d6eb79c87babff2c76447f3a2f6b28023490170c1f";

if (!privateKey) {
  throw new Error("CKB_PRIVATE_KEY is not set");
}

const signer = new ccc.SignerCkbPrivateKey(client, privateKey);

await signer.connect();

const address = await signer.getRecommendedAddress();

console.log("CKB Testnet Address:");
console.log(address);

console.log("\nCells:");

let count = 0;

for await (const cell of signer.findCellsOnChain({}, true)) {
  count++;

  console.log(`\nCell #${count}`);
  console.log("OutPoint:");
  console.log(cell.outPoint);

  console.log("Capacity:");
  console.log(ccc.fixedPointToString(cell.cellOutput.capacity), "CKB");

  console.log("Lock:");
  console.log(cell.cellOutput.lock);

  if (cell.cellOutput.type) {
    console.log("Type:");
    console.log(cell.cellOutput.type);
  }

  console.log("Data:");
  console.log(cell.outputData);
}

console.log(`\nTotal Cells: ${count}`);
}
main();
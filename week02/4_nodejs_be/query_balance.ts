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
const balance = await signer.getBalance();

console.log("CKB Testnet Address:");
console.log(address);

console.log("Balance:");
console.log(ccc.fixedPointToString(balance), "CKB");
}

main();
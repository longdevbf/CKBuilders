import { ccc } from "@ckb-ccc/shell";

const client = new ccc.ClientPublicTestnet();

const privateKey = "0x0a0ecce6f15c444e6d0013d6eb79c87babff2c76447f3a2f6b28023490170c1f";

if (!privateKey) {
  throw new Error("CKB_PRIVATE_KEY is not set");
}

const signer = new ccc.SignerCkbPrivateKey(client, privateKey);

await signer.connect();

const senderAddress = await signer.getRecommendedAddress();

const receiverAddress =
  "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvwg2cen8extgq8s5puft8vf40px3f599cytcyd8";

const { script: receiverLock } = await ccc.Address.fromString(
  receiverAddress,
  signer.client,
);

const tx = ccc.Transaction.from({
  outputs: [
    {
      capacity: ccc.fixedPointFrom("1"),
      lock: receiverLock,
    },
  ],
});

await tx.completeInputsByCapacity(signer);
await tx.completeFeeBy(signer);

console.log("Sender Address:");
console.log(senderAddress);

console.log("Receiver Address:");
console.log(receiverAddress);

console.log("Sending:");
console.log("1 CKB");

const txHash = await signer.sendTransaction(tx);

console.log("Transaction sent successfully!");
console.log("Transaction Hash:");
console.log(txHash);
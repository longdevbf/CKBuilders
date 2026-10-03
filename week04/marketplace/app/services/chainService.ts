import { ccc } from "@ckb-ccc/shell";

// Server-side: verifies on-chain transactions and signs with the market's escrow wallet.

const globalForCkb = globalThis as unknown as { ckbClient?: ccc.Client };

export function getClient(): ccc.Client {
  globalForCkb.ckbClient ??= new ccc.ClientPublicTestnet();
  return globalForCkb.ckbClient;
}

export function getMarketSigner() {
  const key = process.env.MARKET_PRIVATE_KEY?.trim();
  if (!key) throw new Error("Missing MARKET_PRIVATE_KEY in .env");
  return new ccc.SignerCkbPrivateKey(
    getClient(),
    key.startsWith("0x") ? key : `0x${key}`
  );
}

export async function getMarketAddress() {
  return getMarketSigner().getRecommendedAddress();
}

export async function lockOf(address: string) {
  return (await ccc.Address.fromString(address, getClient())).script;
}

// Whether the tx is committed
export async function getCommittedTx(txHash: string) {
  const res = await getClient().getTransaction(txHash);
  if (!res || res.status !== "committed") return null;
  return res.transaction;
}

// Whether any input of the tx belongs to this address (proves that person signed the tx)
export async function txSpentBy(tx: ccc.Transaction, address: string) {
  const lock = await lockOf(address);
  for (const input of tx.inputs) {
    const cell = await getClient().getCell(input.previousOutput);
    if (cell && cell.cellOutput.lock.eq(lock)) return true;
  }
  return false;
}

// Total capacity (shannons) the tx sends to the address
export async function amountPaidTo(tx: ccc.Transaction, address: string) {
  const lock = await lockOf(address);
  return tx.outputs
    .filter((o) => o.lock.eq(lock))
    .reduce((sum, o) => sum + o.capacity, BigInt(0));
}

// Which lock the spore currently sits under
export async function sporeLock(sporeId: string) {
  const found = await ccc.spore.findSpore(getClient(), sporeId);
  return found ? found.cell.cellOutput.lock : null;
}

// The market transfers the spore from the escrow wallet to `toAddress`
export async function transferFromMarket(sporeId: string, toAddress: string) {
  const signer = getMarketSigner();
  const { tx } = await ccc.spore.transferSpore({
    signer,
    id: sporeId,
    to: await lockOf(toAddress),
  });
  await tx.completeFeeBy(signer);
  const hash = await signer.sendTransaction(tx);
  await getClient().waitTransaction(hash);
  return hash;
}

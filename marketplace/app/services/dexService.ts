import { ccc } from "@ckb-ccc/shell";
import {
  buildCancelTx,
  buildMakerTx,
  buildTakerTx,
  calculateNFTMakerListPackage,
  CKBAsset,
  Collector,
  getDexCellDep,
} from "@nervina-labs/ckb-dex";
import { getClient } from "./chainService";

// Server-side: builds the UNSIGNED transactions for the DEX contract
// (list / buy / cancel) with ckb-dex-sdk. The browser signs and sends them
// with the connected wallet, so the server never holds a private key.

const RPC_URL = process.env.CKB_RPC_URL ?? "https://testnet.ckb.dev/rpc";
const INDEXER_URL = process.env.CKB_INDEXER_URL ?? "https://testnet.ckb.dev/indexer";

// The SDK pre-computes the fee from this witness size. The wallet adds a
// signature and cell deps afterwards, so leave some room to stay above the min fee rate.
const WITNESS_SIZE = 400;

const globalForDex = globalThis as unknown as { dexCollector?: Collector };

function getCollector() {
  globalForDex.dexCollector ??= new Collector({
    ckbNodeUrl: RPC_URL,
    ckbIndexerUrl: INDEXER_URL,
  });
  return globalForDex.dexCollector;
}

// The DEX lock is a Type ID script (hash_type "type"), so its code can be upgraded in place.
// ckb-dex-sdk 0.7.0 hard-codes an old deployment cell that is no longer live on testnet
// ("Resolve failed Unknown(OutPoint...)"), so we look up the current one by its Type ID.
const DEX_TYPE_ID: ccc.ScriptLike = {
  codeHash: "0x00000000000000000000000000000000000000000000000000545950455f4944",
  hashType: "type",
  args: "0xa0bd91e56267557b0abe7ab743ce6a0327b4a8048cf29eb45df7660b62ccc902",
};
const sdkDexDep = getDexCellDep(false).outPoint!;

async function liveDexCellDep(): Promise<CKBComponents.CellDep> {
  const cell = await getClient().findSingletonCellByType(DEX_TYPE_ID, false);
  if (!cell) throw new Error("DEX contract is not deployed on this network");
  return {
    outPoint: {
      txHash: cell.outPoint.txHash,
      index: ccc.numToHex(cell.outPoint.index),
    },
    depType: "code",
  };
}

// What the browser needs to sign: a plain JSON raw transaction
export type UnsignedTx = {
  rawTx: unknown;
  txFee: string; // shannons
};

// Swap the SDK's stale DEX cell dep for the live one (buy / cancel spend the DEX cell)
async function withLiveDexDep<T extends { rawTx: CKBComponents.RawTransaction }>(
  built: T
): Promise<T> {
  const live = await liveDexCellDep();
  built.rawTx.cellDeps = built.rawTx.cellDeps.map((dep) =>
    dep.outPoint?.txHash === sdkDexDep.txHash && dep.outPoint?.index === sdkDexDep.index
      ? live
      : dep
  );
  return built;
}

const hexOfScript = (script: ccc.ScriptLike) =>
  ccc.hexFrom(ccc.Script.from(script).toBytes());

const hexOfOutPoint = (o: { txHash: string; index: number }) =>
  ccc.hexFrom(ccc.OutPoint.from({ txHash: o.txHash, index: o.index }).toBytes());

// Seller puts the Spore into a DEX order cell. `price` is in shannons.
//
// The order cell is bigger than a plain Spore cell (the DEX lock args hold the seller's lock
// and the price), so the seller fronts `listPackage` extra CKB. At buy time that extra goes to
// the buyer as change. To make `price` the net amount both sides really pay / receive, the
// on-chain order value is `price + listPackage`; chainService subtracts it again when reading.
export async function buildListTx(params: {
  seller: string;
  sporeType: ccc.ScriptLike;
  price: bigint;
}): Promise<UnsignedTx & { listPackage: string }> {
  const { rawTx, txFee, listPackage } = await buildMakerTx({
    collector: getCollector(),
    seller: params.seller,
    totalValue: params.price + calculateNFTMakerListPackage(params.seller),
    assetType: hexOfScript(params.sporeType),
    ckbAsset: CKBAsset.SPORE,
    estimateWitnessSize: WITNESS_SIZE,
  });
  return { rawTx, txFee: txFee.toString(), listPackage: listPackage.toString() };
}

// Buyer pays the seller and takes the Spore in one atomic transaction
export async function buildBuyTx(params: {
  buyer: string;
  orderOutPoint: { txHash: string; index: number };
}): Promise<UnsignedTx> {
  const { rawTx, txFee } = await withLiveDexDep(
    await buildTakerTx({
      collector: getCollector(),
      buyer: params.buyer,
      orderOutPoints: [hexOfOutPoint(params.orderOutPoint)],
      ckbAsset: CKBAsset.SPORE,
      estimateWitnessSize: WITNESS_SIZE,
    })
  );
  return { rawTx, txFee: txFee.toString() };
}

// Seller takes the Spore back from the DEX order cell
export async function buildDelistTx(params: {
  seller: string;
  orderOutPoint: { txHash: string; index: number };
}): Promise<UnsignedTx> {
  const { rawTx, txFee } = await withLiveDexDep(
    await buildCancelTx({
      collector: getCollector(),
      seller: params.seller,
      orderOutPoints: [hexOfOutPoint(params.orderOutPoint)],
      ckbAsset: CKBAsset.SPORE,
      estimateWitnessSize: WITNESS_SIZE,
    })
  );
  return { rawTx, txFee: txFee.toString() };
}

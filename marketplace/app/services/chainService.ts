import { ccc } from "@ckb-ccc/shell";
import {
  calculateNFTMakerListPackage,
  getDexLockScript,
  OrderArgs,
} from "@nervina-labs/ckb-dex";

// Server-side, read-only: reads the on-chain state of a Spore.
// The market holds no private key; DOBs for sale are locked by the DEX contract.

const globalForCkb = globalThis as unknown as { ckbClient?: ccc.Client };

export function getClient(): ccc.Client {
  globalForCkb.ckbClient ??= new ccc.ClientPublicTestnet();
  return globalForCkb.ckbClient;
}

export async function lockOf(address: string) {
  return (await ccc.Address.fromString(address, getClient())).script;
}

export function addressOf(script: ccc.ScriptLike) {
  return ccc.Address.fromScript(script, getClient()).toString();
}

// This marketplace only runs on testnet
const DEX_LOCK = getDexLockScript(false);

export type SporeState =
  | { kind: "owned"; owner: string }
  | {
      kind: "listed";
      owner: string; // the seller
      price: bigint; // shannons: what the buyer pays and the seller nets (list package removed)
      orderOutPoint: { txHash: string; index: number };
    };

// Where the Spore is right now:
// - locked by the DEX contract -> listed (owner and price are in the lock args)
// - locked by any other lock   -> owned by that lock
export async function readSporeState(
  sporeId: string
): Promise<{ state: SporeState; cell: ccc.Cell } | null> {
  const found = await ccc.spore.findSpore(getClient(), sporeId);
  if (!found) return null;

  const lock = found.cell.cellOutput.lock;
  const { outPoint } = found.cell;

  if (lock.codeHash === DEX_LOCK.codeHash && lock.hashType === DEX_LOCK.hashType) {
    const order = OrderArgs.fromHex(lock.args);
    return {
      cell: found.cell,
      state: {
        kind: "listed",
        owner: addressOf(order.ownerLock),
        price: order.totalValue - calculateNFTMakerListPackage(order.ownerLock),
        orderOutPoint: { txHash: outPoint.txHash, index: Number(outPoint.index) },
      },
    };
  }
  return { cell: found.cell, state: { kind: "owned", owner: addressOf(lock) } };
}

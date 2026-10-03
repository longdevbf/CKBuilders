import { ccc } from "@ckb-ccc/shell";
import {
  claimStatus,
  getNft,
  markListed,
  markOwned,
} from "@/app/services/nftService";
import {
  getCommittedTx,
  getMarketAddress,
  lockOf,
  sporeLock,
  txSpentBy,
} from "@/app/services/chainService";

// Below this the buyer cannot send CKB to the seller (min capacity of a cell)
const MIN_PRICE = ccc.fixedPointFrom("61");

// POST { price: "100", txHash }
// txHash = tx where the seller moves the DOB into the market's escrow wallet
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const nftId = Number(id);
  const { price, txHash } = await req.json();

  if (!/^\d+(\.\d{1,8})?$/.test(String(price))) {
    return Response.json({ error: "Invalid price" }, { status: 400 });
  }
  const shannons = ccc.fixedPointFrom(String(price));
  if (shannons < MIN_PRICE) {
    return Response.json({ error: "Minimum price is 61 CKB" }, { status: 400 });
  }

  const nft = await getNft(nftId);
  if (!nft) return Response.json({ error: "Not found" }, { status: 404 });
  if (!(await claimStatus(nftId, "owned", "selling"))) {
    return Response.json(
      { error: "NFT cannot be listed in its current state" },
      { status: 409 }
    );
  }

  try {
    const tx = await getCommittedTx(String(txHash));
    if (!tx) throw new Error("Tx is not confirmed yet");
    if (!(await txSpentBy(tx, nft.owner))) {
      throw new Error("Tx was not signed by the NFT owner");
    }
    const lock = await sporeLock(nft.sporeId);
    const escrow = await lockOf(await getMarketAddress());
    if (!lock || !lock.eq(escrow)) {
      throw new Error("DOB is not in the escrow wallet yet");
    }

    await markListed(nftId, shannons);
    return Response.json({ ok: true });
  } catch (e) {
    await markOwned(nftId, nft.owner, null); // restore the previous status
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 400 }
    );
  }
}

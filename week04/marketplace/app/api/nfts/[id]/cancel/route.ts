import {
  claimStatus,
  getNft,
  markListed,
  markOwned,
} from "@/app/services/nftService";
import { transferFromMarket } from "@/app/services/chainService";

// POST { owner }  cancel listing: the market returns the DOB to the seller's wallet
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const nftId = Number(id);
  const { owner } = await req.json();

  const nft = await getNft(nftId);
  if (!nft || nft.owner !== owner) {
    return Response.json({ error: "This NFT is not yours" }, { status: 403 });
  }
  if (!(await claimStatus(nftId, "listed", "selling"))) {
    return Response.json({ error: "NFT is not listed for sale" }, { status: 409 });
  }

  try {
    await transferFromMarket(nft.sporeId, nft.owner);
    await markOwned(nftId, nft.owner, null);
    return Response.json({ ok: true });
  } catch (e) {
    await markListed(nftId, BigInt(nft.price ?? 0));
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 400 }
    );
  }
}

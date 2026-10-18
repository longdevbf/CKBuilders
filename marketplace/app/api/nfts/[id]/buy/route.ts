import { fail } from "@/app/lib/http";
import { getNft } from "@/app/services/nftService";
import { addressOf, lockOf, readSporeState } from "@/app/services/chainService";
import { buildBuyTx } from "@/app/services/dexService";

// POST { buyer }
// Returns the UNSIGNED tx where the buyer pays the seller and takes the DOB
// in one atomic transaction (enforced by the DEX contract).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { buyer } = await req.json();

    const nft = await getNft(Number(id));
    if (!nft) return fail("Not found", 404);

    // Always read the order from the chain, never trust the DB for a payment
    const onchain = await readSporeState(nft.sporeId);
    if (!onchain || onchain.state.kind !== "listed") {
      return fail("NFT is not for sale", 409);
    }
    if (onchain.state.owner === addressOf(await lockOf(buyer))) {
      return fail("You cannot buy your own NFT");
    }

    const tx = await buildBuyTx({
      buyer,
      orderOutPoint: onchain.state.orderOutPoint,
    });
    return Response.json(tx);
  } catch (e) {
    return fail(e);
  }
}

import { fail } from "@/app/lib/http";
import { getNft } from "@/app/services/nftService";
import { addressOf, lockOf, readSporeState } from "@/app/services/chainService";
import { buildDelistTx } from "@/app/services/dexService";

// POST { seller }
// Returns the UNSIGNED tx that takes the DOB back from the DEX order cell.
// The DEX contract only accepts it if the seller's own lock signs the tx.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { seller } = await req.json();

    const nft = await getNft(Number(id));
    if (!nft) return fail("Not found", 404);

    const onchain = await readSporeState(nft.sporeId);
    if (!onchain || onchain.state.kind !== "listed") {
      return fail("NFT is not listed for sale", 409);
    }
    if (onchain.state.owner !== addressOf(await lockOf(seller))) {
      return fail("This NFT is not yours", 403);
    }

    const tx = await buildDelistTx({
      seller,
      orderOutPoint: onchain.state.orderOutPoint,
    });
    return Response.json(tx);
  } catch (e) {
    return fail(e);
  }
}

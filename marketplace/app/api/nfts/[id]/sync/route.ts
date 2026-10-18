import { fail } from "@/app/lib/http";
import { getNft, saveChainState } from "@/app/services/nftService";
import { readSporeState } from "@/app/services/chainService";

// POST (no body)
// Copies the on-chain state (owner, listed price) into the DB. Safe to call by anyone,
// any number of times: the result only depends on what is on the chain.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const nft = await getNft(Number(id));
    if (!nft) return fail("Not found", 404);

    const onchain = await readSporeState(nft.sporeId);
    if (!onchain) return fail("Spore not found on-chain", 404);

    const { state } = onchain;
    const saved = await saveChainState(nft.id, {
      status: state.kind,
      owner: state.owner,
      price: state.kind === "listed" ? state.price : null,
    });
    return Response.json(saved);
  } catch (e) {
    return fail(e);
  }
}

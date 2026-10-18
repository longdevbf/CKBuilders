import { ccc } from "@ckb-ccc/shell";
import { fail } from "@/app/lib/http";
import { getNft } from "@/app/services/nftService";
import { lockOf, readSporeState } from "@/app/services/chainService";
import { buildListTx } from "@/app/services/dexService";

// POST { seller, price: "100" }
// Returns the UNSIGNED tx that moves the DOB into a DEX order cell.
// The seller signs it with their wallet, then calls /sync.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { seller, price } = await req.json();

    if (!/^\d+(\.\d{1,8})?$/.test(String(price))) {
      return fail("Invalid price");
    }

    const nft = await getNft(Number(id));
    if (!nft) return fail("Not found", 404);

    const onchain = await readSporeState(nft.sporeId);
    if (!onchain) return fail("Spore not found on-chain", 404);
    if (onchain.state.kind !== "owned") return fail("NFT is already listed", 409);

    const sellerLock = await lockOf(seller);
    if (!onchain.cell.cellOutput.lock.eq(sellerLock)) {
      return fail("This NFT is not yours", 403);
    }

    // The seller receives `price` in a normal cell, so it must cover that cell's min capacity
    const minPrice = ccc.fixedPointFrom(
      ccc.CellOutput.from({ capacity: 0, lock: sellerLock }).occupiedSize
    );
    const shannons = ccc.fixedPointFrom(String(price));
    if (shannons < minPrice) {
      return fail(`Minimum price is ${ccc.fixedPointToString(minPrice)} CKB`);
    }

    const tx = await buildListTx({
      seller,
      sporeType: onchain.cell.cellOutput.type!,
      price: shannons,
    });
    return Response.json(tx);
  } catch (e) {
    return fail(e);
  }
}

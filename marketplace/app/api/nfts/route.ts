import { ccc } from "@ckb-ccc/shell";
import { createNft, listNfts, NftStatus } from "@/app/services/nftService";
import { getClient, lockOf } from "@/app/services/chainService";

const MAX_SIZE = 1024 * 1024; // stored on-chain: 1 byte = 1 CKB, so keep files small

// GET /api/nfts?status=listed   -> marketplace
// GET /api/nfts?owner=<address> -> NFTs of a wallet
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const nfts = await listNfts({
    status: (sp.get("status") as NftStatus | null) ?? undefined,
    owner: sp.get("owner") ?? undefined,
  });
  return Response.json(nfts);
}

// POST multipart: file, name, owner, sporeId, mintTx
// The client already minted the spore on-chain; here we receive the file, verify, then save to the DB.
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const name = String(form.get("name") ?? "").trim();
    const owner = String(form.get("owner") ?? "");
    const sporeId = String(form.get("sporeId") ?? "");
    const mintTx = String(form.get("mintTx") ?? "");

    if (!(file instanceof File) || !name || !owner || !sporeId || !mintTx) {
      return Response.json({ error: "Missing data" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return Response.json({ error: "File must be at most 1000KB" }, { status: 413 });
    }
    const content = Buffer.from(await file.arrayBuffer());

    // The spore must exist on-chain, belong to the owner and match the file content
    const found = await ccc.spore.findSpore(getClient(), sporeId);
    if (!found) {
      return Response.json(
        { error: "Spore not found on-chain yet, wait for the tx to confirm" },
        { status: 400 }
      );
    }
    if (!found.cell.cellOutput.lock.eq(await lockOf(owner))) {
      return Response.json({ error: "Spore does not belong to this wallet" }, { status: 403 });
    }
    if (!Buffer.from(ccc.bytesFrom(found.sporeData.content)).equals(content)) {
      return Response.json(
        { error: "File does not match the on-chain content" },
        { status: 400 }
      );
    }

    const nft = await createNft({
      sporeId,
      name,
      contentType: file.type || "application/octet-stream",
      content,
      owner,
      mintTx,
    });
    return Response.json(nft);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

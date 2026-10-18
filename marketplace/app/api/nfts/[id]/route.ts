import { getNft } from "@/app/services/nftService";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const nft = await getNft(Number(id));
  if (!nft) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(nft);
}

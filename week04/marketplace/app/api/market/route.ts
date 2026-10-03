import { getMarketAddress } from "@/app/services/chainService";

// Escrow wallet address: the seller moves the DOB here when listing
export async function GET() {
  try {
    return Response.json({ address: await getMarketAddress() });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

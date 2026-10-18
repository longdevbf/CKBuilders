import { ccc } from "@ckb-ccc/connector-react";
import type { Nft, NftStatus } from "@/app/services/nftService";

async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

// Ask the server (ckb-dex-sdk) to build an unsigned list / buy / cancel transaction
export function requestTx(
  nftId: number,
  action: "list" | "buy" | "cancel",
  body: Record<string, string>
) {
  return post<{ rawTx: unknown }>(`/api/nfts/${nftId}/${action}`, body);
}

// Sign with the connected wallet, send, and wait until the tx is committed
export async function signAndSend(signer: ccc.Signer, rawTx: unknown) {
  const tx = ccc.Transaction.from(rawTx as ccc.TransactionLike);
  const txHash = await signer.sendTransaction(tx);
  await signer.client.waitTransaction(txHash);
  return txHash;
}

// Copy the on-chain state into the DB. The indexer can lag a few seconds behind
// the committed tx, so retry until the NFT reaches the expected status.
export async function syncUntil(nftId: number, expected: NftStatus) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const nft = await post<Nft>(`/api/nfts/${nftId}/sync`);
    if (nft.status === expected) return nft;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(
    "Transaction confirmed, but the marketplace has not caught up yet. Refresh in a moment."
  );
}

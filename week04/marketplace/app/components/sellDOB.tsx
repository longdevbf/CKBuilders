"use client";
import { ccc } from "@ckb-ccc/connector-react";
import { useState } from "react";
import type { Nft } from "@/app/services/nftService";

// Button to sell / cancel the sale of a DOB
export function SellDOB({ nft, onDone }: { nft: Nft; onDone: () => void }) {
  const signer = ccc.useSigner();
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      setStatus("");
      onDone();
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const sell = () =>
    run(async () => {
      if (!signer) throw new Error("Wallet not connected");
      // 1. Get the market's escrow address
      setStatus("Getting market address...");
      const market = await (await fetch("/api/market")).json();
      if (!market.address) throw new Error(market.error ?? "Could not get the market address");

      // 2. Move the DOB into the escrow wallet (signed by the seller)
      setStatus("Moving DOB to the market...");
      const { script: to } = await ccc.Address.fromString(market.address, signer.client);
      const { tx } = await ccc.spore.transferSpore({ signer, id: nft.sporeId, to });
      await tx.completeFeeBy(signer);
      const txHash = await signer.sendTransaction(tx);
      setStatus("Waiting for transaction to confirm...");
      await signer.client.waitTransaction(txHash);

      // 3. The server verifies, then saves the price to the DB
      setStatus("Listing for sale...");
      const res = await fetch(`/api/nfts/${nft.id}/list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price, txHash }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Listing failed");
    });

  const cancel = () =>
    run(async () => {
      setStatus("Cancelling listing...");
      const res = await fetch(`/api/nfts/${nft.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: nft.owner }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Cancel failed");
    });

  if (nft.status === "listed") {
    return (
      <div className="flex flex-col gap-1">
        <button
          onClick={cancel}
          disabled={busy}
          className="rounded border px-3 py-1 text-sm disabled:opacity-50"
        >
          {busy ? "Processing..." : "Cancel listing"}
        </button>
        {status && <p className="text-xs">{status}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <input
          className="w-24 rounded border px-2 py-1 text-sm"
          placeholder="Price (CKB)"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(",", "."))}
        />
        <button
          onClick={sell}
          disabled={busy || !price}
          className="rounded bg-black px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          {busy ? "Processing..." : "Sell"}
        </button>
      </div>
      {status && <p className="text-xs">{status}</p>}
    </div>
  );
}

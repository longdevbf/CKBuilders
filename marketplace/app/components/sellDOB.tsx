"use client";
import { ccc } from "@ckb-ccc/connector-react";
import { useState } from "react";
import type { Nft } from "@/app/services/nftService";
import { requestTx, signAndSend, syncUntil } from "@/app/lib/dexClient";
import { useAddress } from "./useAddress";

// Button to sell / cancel the sale of a DOB.
// Selling locks the DOB with the DEX contract; cancelling takes it back.
export function SellDOB({ nft, onDone }: { nft: Nft; onDone: () => void }) {
  const signer = ccc.useSigner();
  const address = useAddress();
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (fn: (signer: ccc.Signer) => Promise<void>) => {
    if (!signer || !address) {
      setStatus("Error: Wallet not connected");
      return;
    }
    setBusy(true);
    try {
      await fn(signer);
      setStatus("");
      onDone();
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const sell = () =>
    run(async (signer) => {
      // 1. The server builds the DEX order transaction with ckb-dex-sdk
      setStatus("Building order...");
      const { rawTx } = await requestTx(nft.id, "list", { seller: address, price });

      // 2. The seller signs: the DOB moves into the DEX contract
      setStatus("Waiting for wallet signature...");
      await signAndSend(signer, rawTx);

      // 3. Copy the on-chain order (price, status) into the DB
      setStatus("Listing for sale...");
      await syncUntil(nft.id, "listed");
    });

  const cancel = () =>
    run(async (signer) => {
      setStatus("Building cancel transaction...");
      const { rawTx } = await requestTx(nft.id, "cancel", { seller: address });

      setStatus("Waiting for wallet signature...");
      await signAndSend(signer, rawTx);

      setStatus("Cancelling listing...");
      await syncUntil(nft.id, "owned");
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

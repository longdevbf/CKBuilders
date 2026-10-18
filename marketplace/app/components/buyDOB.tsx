"use client";
import { ccc } from "@ckb-ccc/connector-react";
import { useState } from "react";
import type { Nft } from "@/app/services/nftService";
import { requestTx, signAndSend, syncUntil } from "@/app/lib/dexClient";
import { useAddress } from "./useAddress";

// Button to buy a DOB that is for sale
export function BuyDOB({ nft, onDone }: { nft: Nft; onDone: () => void }) {
  const signer = ccc.useSigner();
  const address = useAddress();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  if (!signer) return <p className="text-xs text-gray-500">Connect a wallet to buy</p>;
  if (address === nft.owner) return <p className="text-xs text-gray-500">Your DOB</p>;

  const buy = async () => {
    setBusy(true);
    try {
      // 1. The server builds the buy transaction with ckb-dex-sdk
      setStatus("Building transaction...");
      const { rawTx } = await requestTx(nft.id, "buy", { buyer: address });

      // 2. One atomic tx: pay the seller and receive the DOB.
      //    The DEX contract rejects it unless the seller gets the full price.
      setStatus("Waiting for wallet signature...");
      await signAndSend(signer, rawTx);

      // 3. Copy the new owner into the DB
      setStatus("Updating marketplace...");
      await syncUntil(nft.id, "owned");

      setStatus("");
      onDone();
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={buy}
        disabled={busy || !address}
        className="rounded bg-black px-3 py-1 text-sm text-white disabled:opacity-50"
      >
        {busy ? "Processing..." : `Buy ${ccc.fixedPointToString(BigInt(nft.price ?? 0))} CKB`}
      </button>
      {status && <p className="text-xs">{status}</p>}
    </div>
  );
}

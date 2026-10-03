"use client";
import { ccc } from "@ckb-ccc/connector-react";
import { useState } from "react";
import type { Nft } from "@/app/services/nftService";
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
    if (!nft.price) return;
    setBusy(true);
    try {
      // 1. Pay CKB to the seller
      setStatus("Paying...");
      const { script: seller } = await ccc.Address.fromString(nft.owner, signer.client);
      const tx = ccc.Transaction.from({
        outputs: [{ capacity: BigInt(nft.price), lock: seller }],
      });
      await tx.completeInputsByCapacity(signer);
      await tx.completeFeeBy(signer);
      const txHash = await signer.sendTransaction(tx);
      setStatus("Waiting for transaction to confirm...");
      await signer.client.waitTransaction(txHash);

      // 2. The server checks the payment, then transfers the DOB to the buyer
      setStatus("Receiving DOB...");
      const res = await fetch(`/api/nfts/${nft.id}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyer: address, txHash }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Purchase failed");

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
        disabled={busy}
        className="rounded bg-black px-3 py-1 text-sm text-white disabled:opacity-50"
      >
        {busy ? "Processing..." : `Buy ${ccc.fixedPointToString(BigInt(nft.price ?? 0))} CKB`}
      </button>
      {status && <p className="text-xs">{status}</p>}
    </div>
  );
}

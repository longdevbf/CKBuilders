"use client";
import { ccc } from "@ckb-ccc/connector-react";
import { useState } from "react";
import { useAddress } from "./useAddress";

const MAX_SIZE = 1024 * 1024; // 1 byte on-chain = 1 CKB

export function CreateDOB({ onCreated }: { onCreated?: () => void }) {
  const signer = ccc.useSigner();
  const address = useAddress();
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  if (!signer) return <p className="text-sm text-gray-500">Connect a wallet to create a DOB</p>;

  const create = async () => {
    if (!file || !name.trim() || !address) return;
    if (file.size > MAX_SIZE) {
      setStatus("File must be at most 30KB");
      return;
    }
    setBusy(true);
    try {
      // 1. Mint spore on-chain, content = file bytes
      setStatus("Creating transaction...");
      const content = new Uint8Array(await file.arrayBuffer());
      const { tx, id } = await ccc.spore.createSpore({
        signer,
        data: { contentType: file.type || "application/octet-stream", content },
      });
      await tx.completeFeeBy(signer);
      const txHash = await signer.sendTransaction(tx);

      setStatus("Waiting for transaction to confirm...");
      await signer.client.waitTransaction(txHash);

      // 2. Send the file + info to the API to save in the DB
      setStatus("Saving to DB...");
      const body = new FormData();
      body.append("file", file);
      body.append("name", name.trim());
      body.append("owner", address);
      body.append("sporeId", id);
      body.append("mintTx", txHash);
      const res = await fetch("/api/nfts", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save to DB");

      setStatus("DOB created successfully");
      setName("");
      setFile(null);
      onCreated?.();
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex max-w-md flex-col gap-2">
      <input
        className="rounded border px-3 py-2"
        placeholder="DOB name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <button
        onClick={create}
        disabled={busy || !file || !name.trim()}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {busy ? "Processing..." : "Create DOB"}
      </button>
      {status && <p className="text-sm">{status}</p>}
    </div>
  );
}

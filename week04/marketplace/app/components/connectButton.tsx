"use client";
import { ccc } from "@ckb-ccc/connector-react";
import { useEffect, useState } from "react";

export function ConnectButton() {
  const { open, disconnect, wallet, signerInfo } = ccc.useCcc();
  const signer = ccc.useSigner();
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("0");

  useEffect(() => {
    if (!signer) return;
    let cancelled = false;
    (async () => {
      const [addr, bal] = await Promise.all([
        signer.getRecommendedAddress(),
        signer.getBalance(),
      ]);
      if (cancelled) return;
      setAddress(addr);
      setBalance(ccc.fixedPointToString(bal));
    })();
    return () => {
      cancelled = true;
    };
  }, [signer]);

  return signerInfo ? (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span className="max-w-xs truncate font-mono" title={address}>
        {address}
      </span>
      <span className="font-semibold">{balance} CKB</span>
      <button
        onClick={disconnect}
        className="rounded border px-3 py-1 hover:bg-gray-100"
      >
        Disconnect {wallet?.name}
      </button>
    </div>
  ) : (
    <button
      onClick={open}
      className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
    >
      Connect Wallet
    </button>
  );
}

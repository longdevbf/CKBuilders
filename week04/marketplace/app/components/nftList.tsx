"use client";
import { ccc } from "@ckb-ccc/connector-react";
import { useEffect, useState } from "react";
import type { Nft } from "@/app/services/nftService";
import { BuyDOB } from "./buyDOB";
import { SellDOB } from "./sellDOB";
import { useAddress } from "./useAddress";

// mode "market": DOBs for sale (from the DB) + Buy button
// mode "mine":   DOBs of the connected wallet + Sell / Cancel listing button
export function NftList({
  mode,
  refreshKey,
  onChanged,
}: {
  mode: "market" | "mine";
  refreshKey: number;
  onChanged: () => void;
}) {
  const address = useAddress();
  const query =
    mode === "market" ? "status=listed" : `owner=${encodeURIComponent(address)}`;
  const requestKey = `${query}#${refreshKey}`;
  const [result, setResult] = useState<{ key: string; nfts: Nft[] }>({
    key: "",
    nfts: [],
  });

  useEffect(() => {
    if (mode === "mine" && !address) return;
    let cancelled = false;
    fetch(`/api/nfts?${query}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setResult({ key: requestKey, nfts: Array.isArray(data) ? data : [] });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mode, address, query, requestKey]);

  const nfts = result.nfts;

  if (mode === "mine" && !address) {
    return <p className="text-sm text-gray-500">Connect a wallet to see your DOBs</p>;
  }
  if (result.key !== requestKey && nfts.length === 0) {
    return <p className="text-sm text-gray-500">Loading...</p>;
  }
  if (nfts.length === 0) return <p className="text-sm text-gray-500">No DOBs yet</p>;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {nfts.map((nft) => (
        <div key={nft.id} className="flex flex-col gap-2 rounded border p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/nfts/${nft.id}/file`}
            alt={nft.name}
            className="h-40 w-full rounded bg-gray-100 object-contain"
          />
          <p className="font-semibold">{nft.name}</p>
          {nft.price && (
            <p className="text-sm">
              Price: {ccc.fixedPointToString(BigInt(nft.price))} CKB
            </p>
          )}
          <p className="truncate font-mono text-xs text-gray-500" title={nft.owner}>
            Owner: {nft.owner}
          </p>
          {mode === "market" ? (
            <BuyDOB nft={nft} onDone={onChanged} />
          ) : (
            <SellDOB nft={nft} onDone={onChanged} />
          )}
        </div>
      ))}
    </div>
  );
}

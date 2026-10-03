"use client";
import { useState } from "react";
import { ConnectButton } from "./connectButton";
import { CreateDOB } from "./createDOB";
import { NftList } from "./nftList";

export function Marketplace() {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">DOB Marketplace</h1>
        <ConnectButton />
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Create DOB</h2>
        <CreateDOB onCreated={refresh} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">My DOBs</h2>
        <NftList mode="mine" refreshKey={refreshKey} onChanged={refresh} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Marketplace</h2>
        <NftList mode="market" refreshKey={refreshKey} onChanged={refresh} />
      </section>
    </main>
  );
}

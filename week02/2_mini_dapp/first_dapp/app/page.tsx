"use client"
import Image from "next/image";
import { ConnectButton } from "./components/connectButton";
import { ccc } from "@ckb-ccc/connector-react";
import { useEffect, useState } from "react";
import { TransferCKB } from "./components/transferCKB";
export default async function Home() {
  
  return (
    <>
      <ConnectButton/>
      <TransferCKB/>
    </>
  );
}

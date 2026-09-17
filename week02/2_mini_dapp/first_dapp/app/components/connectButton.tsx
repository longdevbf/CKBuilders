

import { ccc } from "@ckb-ccc/connector-react";
import { useEffect, useState } from "react";

export function ConnectButton() {
  const { open, disconnect, wallet, signerInfo } = ccc.useCcc();
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState(0);
  const signer = ccc.useSigner();
  useEffect(()=> {
  
    const loadWalletInfo = async () => {
      const signerAddress = await signer?.getRecommendedAddress();
      const signerBalance = await signer?.getBalance();
      setAddress(String(signerAddress));
      setBalance(Number(signerBalance));
      }
    loadWalletInfo();
  })
  return signerInfo ? (
    <div>
  
      <p>Address: {address}</p>
      <p>Balance: {balance}</p>
    <button onClick={disconnect}>Disconnect {wallet?.name}</button>
    </div>

  ) : (
    <button onClick={open}>Connect Wallet</button>
  );
}
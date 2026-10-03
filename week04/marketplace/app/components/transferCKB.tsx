
import { ccc } from "@ckb-ccc/connector-react";
import { useState } from "react";
type CellInfo = {
  txHash: string;
  index: string;
  capacity: string;
  hasTypeScript: boolean;
  data: string;
  dataLength: number;
};

type TxInfo = {
  txHash: string;
  blockNumber: string;
};



export function TransferCKB() {
  const signer = ccc.useSigner();
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingOnchain, setIsLoadingOnchain] = useState(false);
  
const [onchainData, setOnchainData] = useState<{
  address: string;
  balance: string;
  totalCells: number;
  cells: CellInfo[];
  transactions: TxInfo[];
} | null>(null);
  if (!signer) {
    return <p>Connect a wallet to transfer CKB</p>;
  }

  const explorer =
    signer.client.addressPrefix === "ckb"
      ? "https://explorer.nervos.org"
      : "https://testnet.explorer.nervos.org";

  const transfer = async () => {
    setTxHash("");

    const value = amount.trim().replace(",", ".");
    if (!/^\d+(\.\d{1,8})?$/.test(value)) {
      setStatus("Invalid Number");
      return;
    }

    setIsSending(true);
    setStatus("Creating Tx");
    try {
      const { script: lock } = await ccc.Address.fromString(
        toAddress.trim(),
        signer.client,
      );

      const output = ccc.CellOutput.from({
        capacity: ccc.fixedPointFrom(value),
        lock,
      });

      const minCapacity = ccc.fixedPointFrom(output.occupiedSize);
      if (output.capacity < minCapacity) {
        throw new Error(
          `Minxium${ccc.fixedPointToString(minCapacity)} CKB`,
        );
      }
      const tx = ccc.Transaction.from({ outputs: [output] });

      await tx.completeInputsByCapacity(signer);

      await tx.completeFeeBy(signer, 1000);

      setStatus("Confirming ...");
      const hash = await signer.sendTransaction(tx);

      setTxHash(hash);
      setStatus(`Sent ${value} CKB, Tx: ${hash}`);
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsSending(false);
    }
  };
  const viewOnchainData = async () => {
  if (!signer) return;

  try {
    setIsLoadingOnchain(true);
    setStatus("Loading on-chain data...");

    // 1. Get the address of the connected wallet
    const address = await signer.getRecommendedAddress();

    // 2. Convert address -> lock script
    const { script: lock } = await ccc.Address.fromString(
      address,
      signer.client
    );

    // 3. Get balance
    const balanceValue = await signer.client.getBalance([lock]);

    const balance = ccc.fixedPointToString(balanceValue);

    // 4. Get cells
    const cells: CellInfo[] = [];
    let totalCells = 0;

    for await (const cell of signer.client.findCellsByLock(lock)) {
      totalCells++;

      // only show the first 10 cells
      if (cells.length < 10) {
        const rawData = cell.outputData ?? "0x";

        const byteLength = Math.max(
          0,
          Math.floor((rawData.length - 2) / 2)
        );

        cells.push({
          txHash: cell.outPoint.txHash,
          index: cell.outPoint.index.toString(),
          capacity: ccc.fixedPointToString(
            cell.cellOutput.capacity
          ),
          hasTypeScript: Boolean(cell.cellOutput.type),
          data: rawData,
          dataLength: byteLength,
        });
      }
    }

    // 5. Get transaction history
    const transactions: TxInfo[] = [];

    for await (const tx of signer.client.findTransactionsByLock(
      lock,
      null,
      true
    )) {
      if (transactions.length >= 10) break;

      transactions.push({
        txHash: tx.txHash,
        blockNumber: tx.blockNumber.toString(),
      });
    }

    // 6. Save data
    setOnchainData({
      address,
      balance,
      totalCells,
      cells,
      transactions,
    });

    setStatus("Loaded on-chain data successfully.");
  } catch (error) {
    console.error(error);

    setStatus(
      `Error loading on-chain data: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`
    );
  } finally {
    setIsLoadingOnchain(false);
  }
};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 480 }}>
      <input
        placeholder="Address"
        value={toAddress}
        onChange={(e) => setToAddress(e.target.value)}
      />
      <input
        placeholder="CKB number"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button
        onClick={transfer}
        disabled={isSending || !toAddress.trim() || !amount.trim()}
      >
        {isSending ? "Sending..." : "Send CKB"}
      </button>
      <button
        onClick={viewOnchainData}
        disabled={isLoadingOnchain}
      >
        {isLoadingOnchain
        ? "Loading On-chain Data..."
        : "View On-chain Data"}
      </button>

      {status && <p>{status}</p>}
      {txHash && (
        <a
          href={`${explorer}/transaction/${txHash}`}
          target="_blank"
          rel="noreferrer"
        >
          View tx on Explorer
        </a>
      )}
      {onchainData && (
  <div
    style={{
      marginTop: 20,
      border: "1px solid #ccc",
      padding: 16,
    }}
  >
    <h2>On-chain Data</h2>

    <p>
      <strong>Address:</strong>
      <br />
      <code>{onchainData.address}</code>
    </p>

    <p>
      <strong>Balance:</strong>{" "}
      {onchainData.balance} CKB
    </p>

    <p>
      <strong>Total Cells:</strong>{" "}
      {onchainData.totalCells}
    </p>

    <h3>Cells</h3>

    {onchainData.cells.map((cell, index) => (
      <div
        key={`${cell.txHash}-${cell.index}`}
        style={{
          border: "1px solid #ddd",
          padding: 10,
          marginBottom: 10,
        }}
      >
        <p>
          <strong>Cell #{index + 1}</strong>
        </p>

        <p>
          <strong>Tx Hash:</strong>
          <br />
          <code>{cell.txHash}</code>
        </p>

        <p>
          <strong>Index:</strong> {cell.index}
        </p>

        <p>
          <strong>Capacity:</strong>{" "}
          {cell.capacity} CKB
        </p>

        <p>
          <strong>Type Script:</strong>{" "}
          {cell.hasTypeScript ? "Yes" : "No"}
        </p>

        <p>
          <strong>Data Length:</strong>{" "}
          {cell.dataLength} bytes
        </p>

        <p>
          <strong>Data:</strong>
          <br />
          <code
            style={{
              wordBreak: "break-all",
            }}
          >
            {cell.data}
          </code>
        </p>
      </div>
    ))}

    <h3>Recent Transactions</h3>

    {onchainData.transactions.map(
      (tx, index) => (
        <div
          key={tx.txHash}
          style={{ marginBottom: 10 }}
        >
          <strong>TX #{index + 1}</strong>

          <br />

          <code>{tx.txHash}</code>

          <br />

          Block: {tx.blockNumber}
        </div>
      )
    )}
  </div>
)}
    </div>
  );
}
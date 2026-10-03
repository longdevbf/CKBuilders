import { pool } from "@/app/lib/pool";

export type NftStatus = "owned" | "listed" | "selling";

// NFT info returned to the client (without the file bytes)
export type Nft = {
  id: number;
  sporeId: string;
  name: string;
  contentType: string;
  owner: string;
  price: string | null; // shannons, as a string because it is a bigint
  status: NftStatus;
  mintTx: string;
  saleTx: string | null;
};

type Row = {
  id: number;
  spore_id: string;
  name: string;
  content_type: string;
  owner: string;
  price: string | null;
  status: NftStatus;
  mint_tx: string;
  sale_tx: string | null;
};

const COLUMNS =
  "id, spore_id, name, content_type, owner, price, status, mint_tx, sale_tx";

const toNft = (r: Row): Nft => ({
  id: r.id,
  sporeId: r.spore_id,
  name: r.name,
  contentType: r.content_type,
  owner: r.owner,
  price: r.price,
  status: r.status,
  mintTx: r.mint_tx,
  saleTx: r.sale_tx,
});

let schemaReady: Promise<unknown> | null = null;
function ensureSchema() {
  schemaReady ??= pool.query(`
    CREATE TABLE IF NOT EXISTS nfts (
      id           SERIAL PRIMARY KEY,
      spore_id     TEXT UNIQUE NOT NULL,
      name         TEXT NOT NULL,
      content_type TEXT NOT NULL,
      content      BYTEA NOT NULL,
      owner        TEXT NOT NULL,
      price        BIGINT,
      status       TEXT NOT NULL DEFAULT 'owned',
      mint_tx      TEXT NOT NULL,
      sale_tx      TEXT UNIQUE,
      created_at   TIMESTAMPTZ DEFAULT now()
    )
  `);
  return schemaReady;
}

export async function createNft(input: {
  sporeId: string;
  name: string;
  contentType: string;
  content: Buffer;
  owner: string;
  mintTx: string;
}): Promise<Nft> {
  await ensureSchema();
  const { rows } = await pool.query<Row>(
    `INSERT INTO nfts (spore_id, name, content_type, content, owner, mint_tx)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${COLUMNS}`,
    [
      input.sporeId,
      input.name,
      input.contentType,
      input.content,
      input.owner,
      input.mintTx,
    ]
  );
  return toNft(rows[0]);
}

export async function getNft(id: number): Promise<Nft | null> {
  await ensureSchema();
  const { rows } = await pool.query<Row>(
    `SELECT ${COLUMNS} FROM nfts WHERE id = $1`,
    [id]
  );
  return rows[0] ? toNft(rows[0]) : null;
}

export async function getNftFile(
  id: number
): Promise<{ contentType: string; content: Buffer } | null> {
  await ensureSchema();
  const { rows } = await pool.query(
    "SELECT content_type, content FROM nfts WHERE id = $1",
    [id]
  );
  return rows[0]
    ? { contentType: rows[0].content_type, content: rows[0].content }
    : null;
}

// status = "listed" -> marketplace; owner -> NFTs of that wallet
export async function listNfts(filter: {
  status?: NftStatus;
  owner?: string;
}): Promise<Nft[]> {
  await ensureSchema();
  const where: string[] = [];
  const params: string[] = [];
  if (filter.status) {
    params.push(filter.status);
    where.push(`status = $${params.length}`);
  }
  if (filter.owner) {
    params.push(filter.owner);
    where.push(`owner = $${params.length}`);
  }
  const { rows } = await pool.query<Row>(
    `SELECT ${COLUMNS} FROM nfts
     ${where.length ? "WHERE " + where.join(" AND ") : ""}
     ORDER BY id DESC`,
    params
  );
  return rows.map(toNft);
}

// Conditional (atomic) status change to prevent two buyers at the same time.
// Returns the NFT if the change succeeded, null if the current status does not match.
export async function claimStatus(
  id: number,
  from: NftStatus,
  to: NftStatus
): Promise<Nft | null> {
  await ensureSchema();
  const { rows } = await pool.query<Row>(
    `UPDATE nfts SET status = $3 WHERE id = $1 AND status = $2
     RETURNING ${COLUMNS}`,
    [id, from, to]
  );
  return rows[0] ? toNft(rows[0]) : null;
}

export async function markListed(id: number, priceShannons: bigint) {
  await ensureSchema();
  await pool.query(
    "UPDATE nfts SET status = 'listed', price = $2 WHERE id = $1",
    [id, priceShannons.toString()]
  );
}

export async function markOwned(
  id: number,
  owner: string,
  saleTx: string | null
) {
  await ensureSchema();
  await pool.query(
    `UPDATE nfts SET status = 'owned', price = NULL, owner = $2, sale_tx = $3
     WHERE id = $1`,
    [id, owner, saleTx]
  );
}

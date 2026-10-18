import pg from "pg";


export async function connectDb() {
    const {Pool} = pg;
    const pool = new Pool({
        connectionString: process.env.DB_URL,
    });
    return pool.connect();
}

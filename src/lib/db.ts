import "server-only";
import mysql, {
  type Pool,
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";
import { connection } from "next/server";
import { dbConfig, isProduction } from "@/lib/env";

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { mysqlPool?: Pool };

const pool =
  globalForDb.mysqlPool ??
  mysql.createPool({
    ...dbConfig,
    connectionLimit: 5,
    dateStrings: true, // DATE columns come back as 'YYYY-MM-DD'
    decimalNumbers: true, // DECIMAL columns come back as numbers
  });

if (!isProduction) globalForDb.mysqlPool = pool;

type Param = string | number | null;

/** Runs a SELECT with ? placeholders and returns the rows. Always reads fresh data. */
export async function query<T>(sql: string, params: Param[] = []): Promise<T[]> {
  await connection();
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as T[];
}

/** Runs a read-only report query as plain text (used by the Documentation page). */
export async function runReport(sql: string): Promise<Record<string, unknown>[]> {
  await connection();
  const [rows] = await pool.query<RowDataPacket[]>(sql);
  return rows as Record<string, unknown>[];
}

export type Tx = {
  execute(sql: string, params?: Param[]): Promise<ResultSetHeader>;
  select<T>(sql: string, params?: Param[]): Promise<T[]>;
};

/**
 * Runs writes in one transaction on one connection.
 * @app_user is set first so the audit triggers can record who made the change.
 */
export async function transaction<T>(actor: string, work: (tx: Tx) => Promise<T>): Promise<T> {
  const conn: PoolConnection = await pool.getConnection();
  const tx: Tx = {
    async execute(sql, params = []) {
      const [result] = await conn.execute<ResultSetHeader>(sql, params);
      return result;
    },
    async select<R>(sql: string, params: Param[] = []) {
      const [rows] = await conn.execute<RowDataPacket[]>(sql, params);
      return rows as R[];
    },
  };
  try {
    await conn.query("SET @app_user = ?", [actor]);
    await conn.beginTransaction();
    const result = await work(tx);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    // Pooled connections keep session variables, so clear it before reuse.
    await conn.query("SET @app_user = NULL").catch(() => {});
    conn.release();
  }
}

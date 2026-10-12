import mysql from "mysql2/promise";
import type { PoolConnection } from "mysql2/promise";

// DB接続設定を環境変数から取得
const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

// DB接続プールを作成
const pool = mysql.createPool(dbConfig);

// 注文・明細・在庫の更新を同じ接続でまとめて確定する。
export const executeTransaction = async <T>(
  operation: (connection: PoolConnection) => Promise<T>,
): Promise<T> => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await operation(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// SQL文を実行
export const executeQuery = async <T = unknown>(
  sql: string,
  params: (string | number | null)[] = [],
): Promise<T[]> => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows as T[];
  } catch (err) {
    console.error("SQL実行エラー：", err);
    throw err;
  }
};

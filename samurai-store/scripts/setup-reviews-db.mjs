import fs from "node:fs/promises";
import nextEnv from "@next/env";
import mysql from "mysql2/promise";

nextEnv.loadEnvConfig(process.cwd(), true);

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

try {
  const sql = await fs.readFile(
    new URL("./sql/004-create-reviews-table.sql", import.meta.url),
    "utf8",
  );
  for (const statement of sql.split(";").filter((part) => part.trim())) {
    await connection.query(statement);
  }

  const [tables] = await connection.query(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reviews'",
  );
  console.log("[setup-reviews-db] レビューテーブル作成・確認:", tables.length);
} finally {
  await connection.end();
}

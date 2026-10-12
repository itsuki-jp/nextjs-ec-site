import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import nextEnv from "@next/env";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import Stripe from "stripe";

nextEnv.loadEnvConfig(process.cwd(), true);
const file = ".runtime/checkout-browser-fixture.json";
const connection = await mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
  user: process.env.DB_USER, password: process.env.DB_PASS, database: process.env.DB_NAME,
});
try {
  if (process.argv[2] === "prepare") {
    try { await fs.access(file); throw new Error("既存のfixtureをcleanupしてから実行してください。"); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
    const marker = randomUUID();
    const email = `checkout-ui-${marker}@example.com`;
    const password = randomUUID();
    const [user] = await connection.execute("INSERT INTO users (name, email, password, enabled) VALUES (?, ?, ?, 1)", ["決済ブラウザ検証", email, await bcrypt.hash(password, 10)]);
    const [product] = await connection.execute("INSERT INTO products (name, description, price, stock, image_url) VALUES (?, ?, 1200, 5, 'product01.jpg')", [`Stripe動作確認用商品 ${marker}`, "一時的なテスト決済の検証用商品です。"]);
    await fs.mkdir(".runtime", { recursive: true });
    await fs.writeFile(file, JSON.stringify({ userId: user.insertId, productId: product.insertId, email, password, marker }, null, 2));
    console.log("ブラウザ用テストfixture作成。認証情報はGit対象外の.runtime内のみ保存。");
  } else if (process.argv[2] === "cleanup") {
    const fixture = JSON.parse(await fs.readFile(file, "utf8"));
    const [users] = await connection.execute("SELECT email FROM users WHERE id = ?", [fixture.userId]);
    if (users[0]?.email !== fixture.email || !fixture.email.includes(fixture.marker)) throw new Error("fixture識別情報が一致しません。");
    const [orders] = await connection.execute("SELECT id, total_price, status, payment_status, stripe_session_id FROM orders WHERE user_id = ?", [fixture.userId]);
    const [products] = await connection.execute("SELECT stock, sales_count FROM products WHERE id = ?", [fixture.productId]);
    console.log(JSON.stringify({ orders: orders.map(({ stripe_session_id, ...order }) => ({ ...order, hasStripeSession: !!stripe_session_id })), product: products[0] }));
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    for (const order of orders) {
      if (order.stripe_session_id && order.payment_status !== "決済成功") await stripe.checkout.sessions.expire(order.stripe_session_id).catch(() => undefined);
    }
    await connection.beginTransaction();
    await connection.execute("DELETE oi FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.user_id = ?", [fixture.userId]);
    await connection.execute("DELETE FROM orders WHERE user_id = ?", [fixture.userId]);
    await connection.execute("DELETE FROM products WHERE id = ? AND name = ?", [fixture.productId, `Stripe動作確認用商品 ${fixture.marker}`]);
    await connection.execute("DELETE FROM users WHERE id = ? AND email = ?", [fixture.userId, fixture.email]);
    await connection.commit();
    const [remaining] = await connection.execute("SELECT (SELECT COUNT(*) FROM users WHERE id = ?) + (SELECT COUNT(*) FROM products WHERE id = ?) + (SELECT COUNT(*) FROM orders WHERE user_id = ?) AS count", [fixture.userId, fixture.productId, fixture.userId]);
    if (remaining[0].count !== 0) throw new Error("fixtureが残っています。");
    await fs.unlink(file);
    console.log("ブラウザ用fixture削除・残件0を確認。");
  } else throw new Error("Usage: node scripts/checkout-browser-fixture.mjs prepare|cleanup");
} finally { await connection.end(); }

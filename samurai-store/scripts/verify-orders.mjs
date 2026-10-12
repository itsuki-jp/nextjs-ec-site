import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import nextEnv from "@next/env";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import Stripe from "stripe";
import { SignJWT } from "jose";

nextEnv.loadEnvConfig(process.cwd(), true);
const baseUrl = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
const connection = await mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
  user: process.env.DB_USER, password: process.env.DB_PASS, database: process.env.DB_NAME,
});
assert.match(process.env.STRIPE_SECRET_KEY ?? "", /^(sk|rk)_test_/);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const marker = randomUUID();
const password = randomUUID();
const email = `checkout-${marker}@example.com`;
let userId;
let productId;
let sessionId;
let checks = 0;
const check = (description) => { checks++; console.log(`PASS ${description}`); };
const tokenFor = (id, isAdmin = false) => new SignJWT({ userId: id, name: "決済検証", email, isAdmin })
  .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("1h")
  .sign(new TextEncoder().encode(process.env.JWT_SECRET));

try {
  const [user] = await connection.execute("INSERT INTO users (name, email, password, enabled) VALUES (?, ?, ?, 1)", ["決済API検証", email, await bcrypt.hash(password, 10)]);
  userId = user.insertId;
  const [product] = await connection.execute("INSERT INTO products (name, price, stock, image_url) VALUES (?, 1200, 5, 'product01.jpg')", [`決済API検証 ${marker}`]);
  productId = product.insertId;
  const login = await fetch(`${baseUrl}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  assert.equal(login.status, 200);
  assert.match(login.headers.get("set-cookie"), /SameSite=lax/i);
  const cookie = login.headers.get("set-cookie").split(";")[0];
  check("通常ログインで認証Cookieを取得");
  const post = (body, authenticated = true) => fetch(`${baseUrl}/api/orders/checkout`, {
    method: "POST", headers: { "Content-Type": "application/json", ...(authenticated ? { Cookie: cookie } : {}) }, body: JSON.stringify(body),
  });
  const valid = { items: [{ id: String(productId), quantity: 2, title: "改ざんした商品名", price: 1 }], address: "テスト県テスト市1-2-3（API検証）", agreed: true };
  assert.equal((await post(valid, false)).status, 401); check("未認証Checkoutは401");
  for (const quantity of [0, -1, 1.5, "2"]) {
    assert.equal((await post({ ...valid, items: [{ id: String(productId), quantity }] })).status, 400);
  }
  check("ゼロ・負数・小数・文字列数量は400");
  for (const change of [{ items: [] }, { address: " " }, { agreed: false }, { items: [{ id: "invalid", quantity: 1 }] }]) {
    assert.equal((await post({ ...valid, ...change })).status, 400);
  }
  check("空カート・空住所・未同意・不正IDは400");
  assert.equal((await post({ ...valid, items: [{ id: "2147483647", quantity: 1 }] })).status, 404); check("存在しない商品は404");
  assert.equal((await post({ ...valid, items: [{ id: String(productId), quantity: 3 }, { id: String(productId), quantity: 3 }] })).status, 409); check("重複IDも数量合算して在庫不足409");
  const malformed = await fetch(`${baseUrl}/api/orders/checkout`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie }, body: "{" });
  assert.equal(malformed.status, 400); check("不正JSONは400");
  const checkout = await post(valid);
  assert.equal(checkout.status, 200);
  const checkoutData = await checkout.json();
  assert.match(checkoutData.url, /^https:\/\/checkout.stripe.com\//);
  const [orders] = await connection.execute("SELECT * FROM orders WHERE user_id = ?", [userId]);
  assert.equal(orders.length, 1);
  const order = orders[0]; sessionId = order.stripe_session_id;
  assert.equal(order.total_price, 2900);
  const [items] = await connection.execute("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
  assert.equal(items[0].unit_price, 1200); assert.notEqual(items[0].product_name, "改ざんした商品名");
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["line_items"] });
  assert.equal(session.livemode, false); assert.equal(session.amount_total, 2900);
  assert.equal(session.line_items.data.length, 2);
  check("実Stripe SandboxでCheckout作成・DB価格と商品名・送料500円を確認");
  const adminToken = await tokenFor(userId, true);
  const deletion = await fetch(`${baseUrl}/api/products/${productId}`, { method: "DELETE", headers: { Cookie: `authToken=${adminToken}` } });
  assert.equal(deletion.status, 409);
  assert.equal((await deletion.json()).message, "注文履歴に含まれる商品は削除できません。");
  check("注文明細がある商品を削除すると理由付き409");
  assert.equal((await fetch(`${baseUrl}/api/orders/checkout?session_id=${sessionId}`)).status, 401); check("未認証決済照会は401");
  const otherToken = await tokenFor(userId + 1000000);
  assert.equal((await fetch(`${baseUrl}/api/orders/checkout?session_id=${sessionId}`, { headers: { Cookie: `authToken=${otherToken}` } })).status, 404); check("他ユーザーの注文は404");
  assert.equal((await fetch(`${baseUrl}/api/orders/checkout?session_id=cs_test_unknown`, { headers: { Cookie: cookie } })).status, 404); check("任意session_idは404");
  const statusUrl = `${baseUrl}/api/orders/checkout?session_id=${sessionId}`;
  assert.equal((await (await fetch(statusUrl, { headers: { Cookie: cookie } })).json()).paid, false);
  check("Webhook前はpaid=false");
  const sendEvent = (changes = {}, signed = true, eventChanges = {}) => {
    const payload = JSON.stringify({ id: `evt_local_${marker}`, object: "event", type: "checkout.session.completed", livemode: false, ...eventChanges,
      data: { object: { id: sessionId, object: "checkout.session", payment_status: "paid", amount_total: 2900, currency: "jpy", metadata: { orderId: String(order.id), userId: String(userId) }, ...changes } } });
    const signature = signed ? Stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET }) : "invalid";
    return fetch(`${baseUrl}/api/orders/webhook`, { method: "POST", headers: { "Content-Type": "application/json", "stripe-signature": signature }, body: payload });
  };
  assert.equal((await sendEvent({}, false)).status, 400); check("署名不正は400");
  assert.equal((await sendEvent({}, true, { livemode: true })).status, 400); check("liveイベントは400");
  assert.equal((await sendEvent({ payment_status: "unpaid" })).status, 200);
  assert.equal((await (await fetch(statusUrl, { headers: { Cookie: cookie } })).json()).paid, false); check("未払い通知で注文確定しない");
  assert.equal((await sendEvent({ amount_total: 1 })).status, 500); check("金額不一致は更新せず500");
  assert.equal((await sendEvent({ id: "cs_test_other" })).status, 500); check("Checkoutセッション不一致は更新せず500");
  assert.equal((await sendEvent({ metadata: {} })).status, 400); check("注文metadataなしは400");
  const [unchanged] = await connection.execute("SELECT stock, sales_count FROM products WHERE id = ?", [productId]);
  assert.equal(unchanged[0].stock, 5); assert.equal(unchanged[0].sales_count, 0);
  const responses = await Promise.all([sendEvent(), sendEvent(), sendEvent()]);
  responses.forEach((response) => assert.equal(response.status, 200));
  const [updated] = await connection.execute("SELECT stock, sales_count FROM products WHERE id = ?", [productId]);
  assert.equal(updated[0].stock, 3); assert.equal(updated[0].sales_count, 2);
  const [confirmed] = await connection.execute("SELECT status, payment_status FROM orders WHERE id = ?", [order.id]);
  assert.equal(confirmed[0].status, "処理中"); assert.equal(confirmed[0].payment_status, "決済成功");
  assert.equal((await (await fetch(statusUrl, { headers: { Cookie: cookie } })).json()).paid, true);
  check("ローカル署名付き通知3件同時送信でも在庫・販売数は1回分だけ更新");
  const redirect = await fetch(`${baseUrl}/account?session_id=cs_test_example`, { redirect: "manual" });
  assert.equal(redirect.status, 307);
  assert.equal(new URL(redirect.headers.get("location"), baseUrl).searchParams.get("redirect"), "/account?session_id=cs_test_example");
  check("ログイン誘導でsession_idを保持");
} finally {
  if (sessionId) await stripe.checkout.sessions.expire(sessionId).catch(() => undefined);
  if (userId) {
    await connection.execute("DELETE oi FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.user_id = ?", [userId]);
    await connection.execute("DELETE FROM orders WHERE user_id = ?", [userId]);
    await connection.execute("DELETE FROM users WHERE id = ? AND email = ?", [userId, email]);
  }
  if (productId) await connection.execute("DELETE FROM products WHERE id = ? AND name = ?", [productId, `決済API検証 ${marker}`]);
  const [remaining] = await connection.execute("SELECT COUNT(*) AS count FROM users WHERE email = ?", [email]);
  assert.equal(remaining[0].count, 0);
  await connection.end();
  console.log(`CLEANUP 完了 / ${checks} checks`);
}

import { type NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { SHIPPING_COST, type OrderItem } from "@/lib/order";
import { checkStock, createOrder, updateOrder } from "@/app/api/orders/orderService";

export const runtime = "nodejs";

export const POST = async (request: NextRequest) => {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ message: "ログインが必要です。" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ message: "注文情報が不正です。" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ message: "注文情報が不正です。" }, { status: 400 });
  }
  const { items, address, agreed } = body as Record<string, unknown>;
  if (!Array.isArray(items) || !items.length || items.length > 99 ||
      typeof address !== "string" || !address.trim() || address.length > 2000 || agreed !== true) {
    return NextResponse.json({ message: "カート・お届け先・同意内容を確認してください。" }, { status: 400 });
  }
  const quantities = new Map<number, number>();
  for (const item of items) {
    if (typeof item !== "object" || item === null) {
      return NextResponse.json({ message: "商品情報が不正です。" }, { status: 400 });
    }
    const id = typeof item.id === "string" && /^\d+$/.test(item.id) ? Number(item.id) : item.id;
    if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(item.quantity) || item.quantity <= 0 || item.quantity > 999) {
      return NextResponse.json({ message: "商品IDまたは数量が不正です。" }, { status: 400 });
    }
    const quantity = (quantities.get(id) ?? 0) + item.quantity;
    if (quantity > 999) return NextResponse.json({ message: "数量が多すぎます。" }, { status: 400 });
    quantities.set(id, quantity);
  }

  let orderId: number | undefined;
  let createdSessionId: string | undefined;
  try {
    const stripe = getStripe();
    const ids = [...quantities.keys()];
    const products = await executeQuery<{ id: number; name: string; price: number }>(
      `SELECT id, name, price FROM products WHERE id IN (${ids.map(() => "?").join(",")})`, ids,
    );
    if (products.length !== ids.length) {
      return NextResponse.json({ message: "商品が見つかりませんでした。" }, { status: 404 });
    }
    // ブラウザから受け取った価格・商品名は使わず、DBの値で確定する。
    const orderItems: OrderItem[] = products.map((product) => ({
      id: product.id, title: product.name, price: product.price, quantity: quantities.get(product.id)!,
    }));
    const shortages = await checkStock(orderItems);
    if (shortages.length) {
      return NextResponse.json({ message: `在庫が不足しています：${shortages.join("、")}` }, { status: 409 });
    }
    const totalPrice = orderItems.reduce((total, item) => total + item.price * item.quantity, SHIPPING_COST);
    if (!Number.isSafeInteger(totalPrice) || totalPrice <= 0 || totalPrice > 99_999_999) {
      return NextResponse.json({ message: "合計金額が不正です。" }, { status: 400 });
    }
    orderId = await createOrder(user.userId, orderItems, address, totalPrice);
    const session = await stripe.checkout.sessions.create({
      locale: "ja",
      payment_method_types: ["card"],
      line_items: [...orderItems.map((item) => ({
        price_data: { currency: "jpy", product_data: { name: item.title }, unit_amount: item.price },
        quantity: item.quantity,
      })), {
        price_data: { currency: "jpy", product_data: { name: "送料" }, unit_amount: SHIPPING_COST }, quantity: 1,
      }],
      mode: "payment",
      customer_email: user.email || undefined,
      success_url: `${request.nextUrl.origin}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/order-confirm`,
      metadata: { orderId: String(orderId), userId: String(user.userId) },
    }, { idempotencyKey: `samurai-store-order-${orderId}` });
    createdSessionId = session.id;
    if (!session.url) throw new Error("決済ページのURLがありません。");
    await executeQuery("UPDATE orders SET stripe_session_id = ?, payment_status = '決済処理中' WHERE id = ?", [session.id, orderId]);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (createdSessionId) await getStripe().checkout.sessions.expire(createdSessionId).catch(() => undefined);
    if (orderId) await updateOrder(user.userId, orderId, "キャンセル", "決済失敗").catch(() => undefined);
    console.error("Checkout作成エラー:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ message: "決済ページの生成に失敗しました。" }, { status: 500 });
  }
};

// URLのsession_idだけで決済成功と判断せず、本人の注文のWebhook処理結果を確認する。
export const GET = async (request: NextRequest) => {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ message: "ログインが必要です。" }, { status: 401 });
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId || !/^cs_test_[A-Za-z0-9_]+$/.test(sessionId) || sessionId.length > 255) {
    return NextResponse.json({ message: "セッションIDが不正です。" }, { status: 400 });
  }
  const [order] = await executeQuery<{ payment_status: string }>(
    "SELECT payment_status FROM orders WHERE user_id = ? AND stripe_session_id = ? LIMIT 1", [user.userId, sessionId],
  );
  if (!order) return NextResponse.json({ message: "注文が見つかりませんでした。" }, { status: 404 });
  return NextResponse.json({ paid: order.payment_status === "決済成功" });
};

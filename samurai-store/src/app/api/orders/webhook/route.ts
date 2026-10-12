import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { updateOrder } from "@/app/api/orders/orderService";

export const runtime = "nodejs";

export const POST = async (request: NextRequest) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ message: "Webhookが設定されていません。" }, { status: 503 });
  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(await request.text(), request.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return NextResponse.json({ message: "Webhook署名検証に失敗しました。" }, { status: 400 });
  }
  if (event.livemode) return NextResponse.json({ message: "テスト決済のみ受け付けます。" }, { status: 400 });
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== "paid") return NextResponse.json({ received: true });
    const orderId = Number(session.metadata?.orderId);
    const userId = Number(session.metadata?.userId);
    if (!Number.isSafeInteger(orderId) || orderId <= 0 || !Number.isSafeInteger(userId) || userId <= 0) {
      return NextResponse.json({ message: "注文情報が不正です。" }, { status: 400 });
    }
    try {
      await updateOrder(userId, orderId, "処理中", "決済成功", {
        sessionId: session.id, totalPrice: session.amount_total ?? -1, currency: session.currency ?? "",
      });
    } catch (error) {
      console.error("注文確定エラー:", error instanceof Error ? error.message : "unknown");
      return NextResponse.json({ message: "注文ステータス更新に失敗しました。" }, { status: 500 });
    }
  }
  return NextResponse.json({ received: true });
};

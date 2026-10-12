import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { executeQuery } from "@/lib/db";

export type OrderStatus =
  | "未処理"
  | "処理中"
  | "出荷済み"
  | "完了"
  | "キャンセル"
  | "返金済み";

export type PaymentStatus =
  | "未決済"
  | "決済処理中"
  | "決済成功"
  | "決済失敗"
  | "返金処理中"
  | "返金済み";

type OrderItem = {
  productName: string;
  quantity: number;
  unitPrice: number;
};

export type OrderData = {
  id: number;
  totalPrice: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  items: OrderItem[];
};

type OrderJoinRecord = {
  id: number;
  totalPrice: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  productName: string;
  quantity: number;
  unitPrice: number;
};

export const GET = async () => {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { message: "ログインしてください。" },
        { status: 401 },
      );
    }

    const orderRows = await executeQuery<OrderJoinRecord>(`
      SELECT
        o.id AS id,
        o.total_price AS totalPrice,
        o.status AS status,
        o.payment_status AS paymentStatus,
        o.created_at AS createdAt,
        oi.product_name AS productName,
        oi.quantity AS quantity,
        oi.unit_price AS unitPrice
      FROM orders AS o
      JOIN order_items AS oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC, oi.id ASC;`,
      [user.userId],
    );

    const ordersMap = new Map<number, OrderData>();
    orderRows.forEach((row) => {
      let order = ordersMap.get(row.id);
      if (!order) {
        order = {
          id: row.id,
          totalPrice: row.totalPrice,
          status: row.status,
          paymentStatus: row.paymentStatus,
          createdAt: row.createdAt,
          items: [],
        };
        ordersMap.set(row.id, order);
      }

      order.items.push({
        productName: row.productName,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
      });
    });

    return NextResponse.json({ orders: Array.from(ordersMap.values()) });
  } catch (error) {
    console.error("注文取得エラー：", error);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました。" },
      { status: 500 },
    );
  }
};

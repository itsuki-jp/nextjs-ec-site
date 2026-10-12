import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { executeQuery, executeTransaction } from "@/lib/db";
import type { OrderItem, OrderStatus, PaymentStatus } from "@/lib/order";

export const checkStock = async (items: OrderItem[]): Promise<string[]> => {
  const shortages: string[] = [];
  for (const item of items) {
    const [product] = await executeQuery<{ name: string; stock: number }>(
      "SELECT name, stock FROM products WHERE id = ? LIMIT 1",
      [item.id],
    );
    if (!product || product.stock < item.quantity) {
      shortages.push(product?.name ?? `ID:${item.id}`);
    }
  }
  return shortages;
};

export const createOrder = async (
  userId: number,
  items: OrderItem[],
  address: string,
  totalPrice: number,
): Promise<number> => {
  if (!items.length || !address.trim() || !Number.isSafeInteger(totalPrice) || totalPrice <= 0) {
    throw new Error("注文情報が不正です。");
  }
  return executeTransaction(async (connection) => {
    const [result] = await connection.execute<ResultSetHeader>(
      "INSERT INTO orders (user_id, total_price, shipping_address) VALUES (?, ?, ?)",
      [userId, totalPrice, address.trim()],
    );
    for (const item of items) {
      await connection.execute(
        "INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)",
        [result.insertId, item.id, item.title, item.quantity, item.price],
      );
    }
    return result.insertId;
  });
};

export const updateOrder = async (
  userId: number,
  orderId: number,
  status?: OrderStatus,
  paymentStatus?: PaymentStatus,
  payment?: { sessionId: string; totalPrice: number; currency: string },
) => {
  if (!Number.isSafeInteger(userId) || userId <= 0 || !Number.isSafeInteger(orderId) || orderId <= 0) {
    throw new Error("注文情報が不正です。");
  }
  return executeTransaction(async (connection) => {
    const [orders] = await connection.execute<RowDataPacket[]>(
      "SELECT total_price, stripe_session_id, payment_status FROM orders WHERE id = ? AND user_id = ? FOR UPDATE",
      [orderId, userId],
    );
    const order = orders[0];
    if (!order) throw new Error("注文が見つかりません。");
    if (paymentStatus === "決済成功" && (
      !payment || payment.currency !== "jpy" ||
      payment.totalPrice !== order.total_price || payment.sessionId !== order.stripe_session_id
    )) {
      throw new Error("Stripeの決済情報と注文情報が一致しません。");
    }
    // 同じ通知の再送・同時到着でも在庫を二重に減らさない。
    if (order.payment_status === "決済成功") return;
    if (paymentStatus === "決済成功") {
      const [items] = await connection.execute<RowDataPacket[]>(
        "SELECT product_id, quantity FROM order_items WHERE order_id = ? ORDER BY product_id",
        [orderId],
      );
      for (const item of items) {
        const [updated] = await connection.execute<ResultSetHeader>(
          "UPDATE products SET stock = stock - ?, sales_count = sales_count + ?, updated_at = NOW() WHERE id = ? AND stock >= ?",
          [item.quantity, item.quantity, item.product_id, item.quantity],
        );
        if (updated.affectedRows !== 1) throw new Error("決済確定時に在庫が不足しました。");
      }
    }
    const fields: string[] = [];
    const values: (string | number)[] = [];
    if (status) { fields.push("status = ?"); values.push(status); }
    if (paymentStatus) { fields.push("payment_status = ?"); values.push(paymentStatus); }
    if (fields.length) {
      await connection.execute(
        `UPDATE orders SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`,
        [...values, orderId, userId],
      );
    }
  });
};

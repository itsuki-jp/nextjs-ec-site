"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { OrderData } from "@/app/api/orders/route";

const getStatusStyle = (status: OrderData["status"] | OrderData["paymentStatus"]) => {
  switch (status) {
    case "完了":
    case "出荷済み":
    case "決済成功":
      return "text-green-600";
    case "処理中":
    case "決済処理中":
      return "text-blue-600";
    case "キャンセル":
    case "返金済み":
    case "決済失敗":
    case "返金処理中":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
};

const OrdersPage = () => {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getOrders = async () => {
      try {
        const response = await fetch("/api/orders");
        const data = (await response.json()) as {
          orders?: OrderData[];
          message?: string;
        };

        if (!response.ok) {
          throw new Error(data.message ?? "注文履歴の取得に失敗しました。");
        }
        if (!Array.isArray(data.orders)) {
          throw new Error("注文履歴の取得に失敗しました。");
        }

        setOrders(data.orders);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "通信エラーが発生しました。",
        );
      } finally {
        setLoading(false);
      }
    };

    void getOrders();
  }, []);

  const tableStyle = "border-b px-3 py-2";

  if (loading) {
    return (
      <div className="py-12 text-center text-lg text-gray-600">
        注文履歴データを読み込み中です...
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="my-4">
        <Link href="/account" className="text-indigo-600 hover:underline">
          ← マイページに戻る
        </Link>
      </div>
      <h1 className="mb-8 text-center">注文履歴一覧</h1>

      {errorMessage && (
        <p role="alert" className="text-center text-red-600">
          {errorMessage}
        </p>
      )}

      {!errorMessage && orders.length === 0 && (
        <p className="text-center text-gray-600">注文履歴はありません。</p>
      )}

      <div className="space-y-6">
        {orders.map((order) => (
          <section key={order.id} className="rounded-lg border p-4 shadow-sm">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row">
              <div>
                <p className="text-lg font-semibold">注文ID：{order.id}</p>
                <p>
                  注文日：
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString("ja-JP")
                    : "-"}
                </p>
              </div>
              <div className="font-semibold sm:text-right">
                <p className="text-xl text-blue-600">
                  合計金額：¥{order.totalPrice.toLocaleString()}（送料込み）
                </p>
                <p className={getStatusStyle(order.status)}>
                  注文状況：{order.status}
                </p>
                <p className={getStatusStyle(order.paymentStatus)}>
                  決済状況：{order.paymentStatus}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border-t border-gray-200 shadow-lg">
              <table className="w-full min-w-[32rem] text-left">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className={tableStyle}>商品名</th>
                    <th className={tableStyle}>数量</th>
                    <th className={tableStyle}>単価（税込）</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={`${order.id}-${index}`} className="hover:bg-gray-50">
                      <td className={tableStyle}>{item.productName}</td>
                      <td className={tableStyle}>{item.quantity}</td>
                      <td className={tableStyle}>
                        ¥{item.unitPrice.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
};

export default OrdersPage;

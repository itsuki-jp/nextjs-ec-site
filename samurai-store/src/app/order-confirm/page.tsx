"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import CartItemCard from "@/components/CartItemCard";
import { SHIPPING_COST } from "@/lib/order";

const OrderConfirmPage = () => {
  const router = useRouter();
  const { cartItems, totalPrice } = useCart();
  const [address, setAddress] = useState("");
  const [isAgreed, setIsAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleConfirmPayment = async () => {
    if (isSubmitting) return;
    if (!address.trim() || !isAgreed) {
      setErrorMessage("お届け先住所と利用規約への同意を確認してください。");
      return;
    }
    setErrorMessage("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cartItems, address, agreed: isAgreed }),
      });
      const data = await response.json() as { url?: string; message?: string };
      if (!response.ok || !data.url) throw new Error(data.message ?? "決済ページの生成に失敗しました。");
      window.location.assign(data.url);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "通信エラーが発生しました。");
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("入力内容が破棄されます。よろしいですか？")) router.push("/cart");
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-center">ご注文内容の確認</h1>
      {errorMessage && <p role="alert" className="mb-4 text-center text-red-600">{errorMessage}</p>}
      {cartItems.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-gray-600">カートに商品がありません。</p>
          <Link href="/products" className="text-indigo-600 hover:underline">← 商品一覧に戻る</Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col space-y-6">
            {cartItems.map((item) => <CartItemCard key={item.id} item={item} />)}
          </div>
          <div className="mt-8 border-t border-gray-300 pt-6">
            <label className="mb-1 block font-bold" htmlFor="address">
              お届け先住所<span className="ml-2 rounded-md bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">必須</span>
            </label>
            <textarea id="address" value={address} maxLength={2000} required disabled={isSubmitting}
              placeholder="お届け先住所を入力してください"
              className="w-full rounded-sm border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500"
              onChange={(event) => setAddress(event.target.value)} />
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between pb-2 font-semibold"><span>商品合計：</span><span>¥{totalPrice.toLocaleString()}</span></div>
            <div className="flex items-center justify-between border-b border-gray-300 py-4 font-semibold"><span>送料：</span><span>¥{SHIPPING_COST.toLocaleString()}</span></div>
            <div className="flex items-center justify-between pt-4 text-2xl font-bold text-green-600"><span>支払い合計：</span><span>¥{(totalPrice + SHIPPING_COST).toLocaleString()}</span></div>
            <p className="mt-2 text-right text-sm text-gray-500">※価格はすべて税込表記です。お支払いはStripeによるクレジットカード決済となります。</p>
          </div>
          <div className="mt-8">
            <p className="text-sm">
              ご注文の確定前に、必ず<Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-bold text-indigo-600 underline">利用規約</Link>および
              <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="font-bold text-indigo-600 underline">プライバシーポリシー</Link>をお読みください。
              <br />同意のチェックをもって、上記規約に同意したものとみなされます。
            </p>
            <div className="mt-6 flex items-center">
              <input type="checkbox" id="agreement-checkbox" checked={isAgreed} disabled={isSubmitting}
                onChange={(event) => setIsAgreed(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <label htmlFor="agreement-checkbox" className="ml-2 text-base leading-snug font-semibold text-gray-800">利用規約およびプライバシーポリシーに同意する</label>
            </div>
          </div>
          <div className="mt-8 flex items-center justify-between gap-4">
            <button type="button" onClick={handleConfirmPayment} disabled={isSubmitting || !isAgreed || !address.trim()}
              className="rounded-sm bg-indigo-500 px-6 py-2 text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-gray-400">
              {isSubmitting ? "決済ページを準備中…" : "決済する"}
            </button>
            <button type="button" onClick={handleCancel} disabled={isSubmitting}
              className="rounded-sm bg-gray-200 px-6 py-2 text-gray-700 hover:bg-gray-300 disabled:opacity-50">キャンセル</button>
          </div>
        </>
      )}
    </main>
  );
};

export default OrderConfirmPage;

'use client';

import Link from "next/link";
import CartItemCard from "@/components/CartItemCard";
import { useCart } from "@/hooks/useCart";

const CartPage = () => {
  const { cartItems, removeItem, updateQuantity, totalPrice } = useCart();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-center">ショッピングカート</h1>
      {cartItems.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-gray-600">カートに商品がありません。</p>
          <Link href="/products" className="text-indigo-600 hover:underline">
            ← 商品一覧に戻る
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col space-y-6">
            {cartItems.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                isEditable
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>
          <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-gray-300 pt-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-2xl font-bold">
                合計金額：¥{totalPrice.toLocaleString()}
              </p>
              <p className="text-gray-500">※価格はすべて税込表記です。</p>
            </div>
            <Link
              href="/order-confirm"
              className="rounded bg-indigo-500 px-6 py-2 text-white hover:bg-indigo-600"
            >
              購入手続きへ
            </Link>
          </div>
        </>
      )}
    </main>
  );
};

export default CartPage;

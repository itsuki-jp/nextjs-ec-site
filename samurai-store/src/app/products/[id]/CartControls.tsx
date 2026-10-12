'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart, type CartItem } from "@/hooks/useCart";

type CartControlsProps = {
  cartItem: Omit<CartItem, "quantity">;
  stock: number;
  loggedIn: boolean;
};

const CartControls = ({ cartItem, stock, loggedIn }: CartControlsProps) => {
  const router = useRouter();
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(cartItem.id);
  const [quantity, setQuantity] = useState(1);
  const quantityOptions = Array.from(
    { length: Math.min(stock, 10) },
    (_, index) => index + 1,
  );

  const handleCart = () => addItem(cartItem, quantity);
  const handleOrder = () => {
    if (!inCart) addItem(cartItem, quantity);
    router.push("/order-confirm");
  };

  return (
    <div className="mt-8 space-y-6">
      {stock > 0 && (
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col">
            <label htmlFor="quantity" className="text-sm text-gray-700">
              数量
            </label>
            <select
              id="quantity"
              name="quantity"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className="w-24 rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              {quantityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleCart}
            disabled={inCart}
            className={`min-w-[130px] rounded-sm px-4 py-2 text-white disabled:cursor-not-allowed ${
              inCart
                ? "bg-gray-400"
                : "bg-indigo-500 hover:bg-indigo-600"
            }`}
          >
            {inCart ? "追加済み" : "カートに追加"}
          </button>
          {loggedIn && (
            <button
              type="button"
              onClick={handleOrder}
              className="rounded-sm border border-indigo-500 px-4 py-2 text-indigo-500 hover:bg-indigo-50"
            >
              購入手続きへ
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CartControls;

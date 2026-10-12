'use client';

import Image from "next/image";
import type { CartItem } from "@/hooks/useCart";

type CartItemCardProps = {
  item: CartItem;
  isEditable?: boolean;
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onRemove?: (id: string) => void;
};

const CartItemCard = ({
  item,
  isEditable = false,
  onUpdateQuantity,
  onRemove,
}: CartItemCardProps) => {
  const quantityOptions = Array.from(
    { length: Math.max(10, item.quantity) },
    (_, index) => index + 1,
  );

  return (
    <article className="flex flex-col gap-4 rounded border border-gray-200 p-4 sm:flex-row sm:items-center sm:gap-8 sm:p-6">
      <Image
        src={item.imageUrl ? `/uploads/${item.imageUrl}` : "/images/no-image.jpg"}
        alt={item.title}
        width={120}
        height={120}
        className="h-[120px] w-[120px] object-contain"
      />
      <div className="min-w-0 flex-grow">
        <h2 className="text-xl">{item.title}</h2>
        <p className="text-xl font-bold text-indigo-600">
          ¥{item.price.toLocaleString()}
          <span className="text-base font-normal text-gray-500">（税込）</span>
        </p>
        {isEditable ? (
          <div className="mt-2 flex items-center gap-4">
            <label htmlFor={`quantity-${item.id}`} className="text-sm text-gray-700">
              数量
            </label>
            <select
              id={`quantity-${item.id}`}
              value={item.quantity}
              onChange={(event) =>
                onUpdateQuantity?.(item.id, Number(event.target.value))
              }
              className="rounded-md border border-gray-300 px-3 py-1 focus:ring-2 focus:ring-indigo-500"
            >
              {quantityOptions.map((quantity) => (
                <option key={quantity} value={quantity}>
                  {quantity}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onRemove?.(item.id)}
              className="cursor-pointer text-red-600 hover:underline"
            >
              削除
            </button>
          </div>
        ) : (
          <p className="text-lg font-semibold">数量：{item.quantity}</p>
        )}
      </div>
      <p className="w-32 text-left text-lg font-semibold sm:text-right">
        小計：¥{(item.price * item.quantity).toLocaleString()}
      </p>
    </article>
  );
};

export default CartItemCard;

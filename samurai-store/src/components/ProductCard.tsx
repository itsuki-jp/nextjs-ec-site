'use client';

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";

// 商品カードコンポーネントに渡すデータ（props）の型定義
export interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  imageSize?: 300 | 400;
  rating?: number;
  reviewCount?: number;
  showCartButton?: boolean;
  className?: string;
}

// 商品カードの共通コンポーネント
export const ProductCard = ({
  id,
  title,
  price,
  imageUrl,
  imageSize = 300,
  rating,
  reviewCount,
  showCartButton = false,
  className = "",
}: ProductCardProps) => {
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(id);
  const finalImageUrl = imageUrl
    ? `/uploads/${imageUrl}`
    : "/images/no-image.jpg";
  const handleCart = () => addItem({ id, title, price, imageUrl });
  const displayStars = (average: number) => {
    const filledStars = Math.max(0, Math.min(5, Math.round(average)));
    return `${"★".repeat(filledStars)}${"☆".repeat(5 - filledStars)}`;
  };

  return (
    <div className={`flex w-full max-w-sm flex-col bg-white p-2 ${className}`}>
      <Link href={`/products/${id}`}>
        <Image
          src={finalImageUrl}
          alt={title || "商品画像"}
          width={imageSize}
          height={imageSize}
          className="aspect-square w-full object-contain"
        />
      </Link>
      <div className="flex flex-col">
        <h3 className="mb-1 text-sm font-semibold leading-tight">{title}</h3>
        {rating !== undefined && reviewCount !== undefined && (
          reviewCount > 0 ? (
            <p className="mb-1 flex items-center text-sm" aria-label={`評価 ${rating.toFixed(1)}点、レビュー${reviewCount}件`}>
              <span className="mr-1 text-yellow-500">{displayStars(rating)}</span>
              <span className="text-gray-600">（{reviewCount}件）</span>
            </p>
          ) : (
            <p className="mt-1 text-xs text-gray-400">まだレビューがありません</p>
          )
        )}
        <div className="mt-2 flex w-full items-center justify-between">
          <p className="text-lg font-bold">¥{price.toLocaleString()}</p>
          {showCartButton && (
            <button
              type="button"
              onClick={handleCart}
              disabled={inCart}
              className={`rounded-sm border px-4 py-2 disabled:cursor-not-allowed ${
                inCart
                  ? "border-indigo-500 bg-indigo-500 text-white"
                  : "border-indigo-500 text-indigo-500 hover:bg-indigo-400 hover:text-white"
              }`}
            >
              {inCart ? "追加済み" : "カートへ"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

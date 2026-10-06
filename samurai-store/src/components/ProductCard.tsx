'use client';

import Image from "next/image";
import Link from "next/link";

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
  const finalImageUrl = imageUrl
    ? `/uploads/${imageUrl}`
    : "/images/no-image.jpg";

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
        {rating !== undefined && reviewCount !== undefined && <p>☆☆☆☆☆（-件）</p>}
        <div className="mt-2 flex w-full items-center justify-between">
          <p className="text-lg font-bold">¥{price.toLocaleString()}</p>
          {showCartButton && (
            <button
              type="button"
              className="rounded-sm border border-indigo-500 px-4 py-2 text-indigo-500 hover:bg-indigo-400 hover:text-white"
            >
              カートへ
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

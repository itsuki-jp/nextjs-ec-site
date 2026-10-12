"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { type FavoriteProduct } from "@/types/favorite";

type FavoriteProductActionsProps = {
  product: FavoriteProduct;
};

const FavoriteProductActions = ({ product }: FavoriteProductActionsProps) => {
  const router = useRouter();
  const { addItem, isInCart, isLoaded } = useCart();
  const [isRemoving, setIsRemoving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const inCart = isLoaded && isInCart(String(product.product_id));

  const handleAddToCart = () => {
    addItem(
      {
        id: String(product.product_id),
        title: product.name,
        price: product.price,
        imageUrl: product.image_url ?? undefined,
      },
      1,
    );
  };

  const handleRemoveFavorite = async () => {
    if (!window.confirm("本当にお気に入りから削除しますか？")) return;

    setIsRemoving(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/favorites/${product.product_id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = (await response.json()) as { message?: string };
        setErrorMessage(result.message ?? "お気に入りを解除できませんでした。");
        return;
      }

      router.refresh();
    } catch {
      setErrorMessage("通信エラーが発生しました。");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!isLoaded || inCart || product.stock < 1}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {product.stock < 1 ? "売り切れ" : inCart ? "追加済み" : "カートに追加"}
      </button>
      <button
        type="button"
        onClick={handleRemoveFavorite}
        disabled={isRemoving}
        className="rounded-md border border-red-600 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isRemoving ? "解除中..." : "お気に入り解除"}
      </button>
      {errorMessage && <p role="alert" className="w-full text-sm text-red-600">{errorMessage}</p>}
    </div>
  );
};

export default FavoriteProductActions;

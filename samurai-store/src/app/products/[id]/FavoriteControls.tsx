"use client";

import { useState } from "react";

type FavoriteControlsProps = {
  productId: number;
  initialIsFavorite: boolean;
};

const FavoriteControls = ({ productId, initialIsFavorite }: FavoriteControlsProps) => {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleToggleFavorite = async () => {
    setIsPending(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        isFavorite ? `/api/favorites/${productId}` : "/api/favorites",
        {
          method: isFavorite ? "DELETE" : "POST",
          ...(isFavorite
            ? {}
            : {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId }),
              }),
        },
      );

      if (!response.ok) {
        const result = (await response.json()) as { message?: string };
        setErrorMessage(result.message ?? "お気に入りを更新できませんでした。");
        return;
      }

      setIsFavorite((previousValue) => !previousValue);
    } catch {
      setErrorMessage("通信エラーが発生しました。");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleToggleFavorite}
        disabled={isPending}
        aria-pressed={isFavorite}
        style={{ fontFamily: "sans-serif" }}
        className="text-teal-800 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isFavorite ? "♥ お気に入り解除" : "♡ お気に入り追加"}
      </button>
      {errorMessage && <p role="alert" className="mt-2 text-sm text-red-600">{errorMessage}</p>}
    </div>
  );
};

export default FavoriteControls;

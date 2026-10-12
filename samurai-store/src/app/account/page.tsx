"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/hooks/useCart";

const AccountContent = () => {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clearCart, isLoaded } = useCart();
  const [paidSessionId, setPaidSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!sessionId || !isLoaded) return;

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let attempts = 0;

    const checkPayment = async () => {
      try {
        const response = await fetch(
          `/api/orders/checkout?session_id=${encodeURIComponent(sessionId)}`,
          { signal: controller.signal },
        );
        const data = (await response.json()) as { paid?: boolean; message?: string };

        if (controller.signal.aborted) return;
        if (!response.ok) {
          throw new Error(data.message ?? "決済結果を確認できませんでした。");
        }

        if (data.paid) {
          const storageKey = `checkout-completed:${sessionId}`;
          if (!window.localStorage.getItem(storageKey)) {
            clearCart();
            window.localStorage.setItem(storageKey, "1");
          }
          setPaidSessionId(sessionId);
          setErrorMessage("");
        } else if (++attempts < 15) {
          timer = setTimeout(checkPayment, 1000);
        } else {
          setErrorMessage(
            "決済結果の反映を待っています。しばらくしてからページを再表示してください。",
          );
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "決済結果を確認できませんでした。",
          );
        }
      }
    };

    void checkPayment();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [sessionId, clearCart, isLoaded]);

  const menuItemStyle =
    "flex w-full items-center rounded border border-gray-300 px-4 py-4 text-left shadow-lg hover:bg-gray-100 hover:shadow-xl hover:ring-2 hover:ring-indigo-200";

  const message = searchParams.get("edited")
    ? "会員情報を編集しました。"
    : searchParams.get("password-changed")
      ? "パスワードを変更しました。"
      : null;

  return (
    <>
      {sessionId && paidSessionId === sessionId && (
        <div
          role="status"
          className="mb-6 flex w-full flex-col items-center justify-center rounded-md bg-green-100 p-3 text-center text-green-800 shadow-md"
        >
          <p className="mt-4 text-xl font-bold">ご注文ありがとうございます！</p>
          <p>商品が到着するまでしばらくお待ちください。</p>
        </div>
      )}
      {message && (
        <div className="flex w-full items-center justify-center bg-green-100 p-3 text-center text-green-800 shadow-md">
          {message}
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-center">マイページ</h1>
        {errorMessage && (
          <p role="alert" className="mb-6 text-center text-red-600">
            {errorMessage}
          </p>
        )}
        {sessionId && paidSessionId !== sessionId && !errorMessage && (
          <p role="status" className="mb-6 text-center">
            決済結果を確認中です…
          </p>
        )}

        <div className="mx-auto grid max-w-2xl gap-8 md:grid-cols-2">
          <Link href="/account/edit" className={menuItemStyle}>
            <span>
              <span className="block font-medium">会員情報の編集</span>
              <span className="text-gray-600">氏名やメールアドレスを編集できます</span>
            </span>
          </Link>
          <Link href="/account/password" className={menuItemStyle}>
            <span>
              <span className="block font-medium">パスワード変更</span>
              <span className="text-gray-600">パスワードを変更できます</span>
            </span>
          </Link>
          <Link href="/account/orders" className={menuItemStyle}>
            <span>
              <span className="block font-medium">注文履歴</span>
              <span className="text-gray-600">注文履歴を確認できます</span>
            </span>
          </Link>
          <Link href="/account/favorites" className={menuItemStyle}>
            <span>
              <span className="block font-medium">お気に入り商品の確認</span>
              <span className="text-gray-600">お気に入りの商品を確認できます</span>
            </span>
          </Link>
          <form method="POST" action="/api/auth/logout">
            <button type="submit" className={menuItemStyle}>
              <span>
                <span className="block font-medium">ログアウト</span>
                <span className="text-gray-600">ログアウトします</span>
              </span>
            </button>
          </form>
        </div>
      </main>
    </>
  );
};

const AccountPage = () => (
  <Suspense fallback={<p className="p-8 text-center">読み込み中…</p>}>
    <AccountContent />
  </Suspense>
);

export default AccountPage;

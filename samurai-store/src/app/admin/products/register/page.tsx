"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import ProductForm from "@/components/ProductForm";

type RegisterResponse = {
  message?: string;
};

// 商品登録ページ
const ProductRegisterPage = () => {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");

  // フォーム送信時のイベントハンドラ
  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault(); // デフォルトの送信動作をキャンセル
    setErrorMessage(""); // 送信前にエラーをクリア

    // フォームデータを生成
    const formData = new FormData(event.currentTarget);

    // 各入力データを取得
    const name = formData.get("name") as string;
    const imageFile = formData.get("imageFile") as File;
    const price = Number(formData.get("price") as string);
    const stock = Number(formData.get("stock") as string);

    // 入力データのバリデーション
    if (!name.trim() || !imageFile) {
      setErrorMessage("すべての必須項目を入力してください。");
      return;
    }
    if (price < 0 || stock < 0) {
      setErrorMessage("価格と在庫数は0以上の数値を入力してください。");
      return;
    }

    try {
      // 商品登録APIにPOSTリクエストを送信
      const response = await fetch("/api/products", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        // 登録成功時は管理者向け商品一覧ページへ遷移
        router.push("/admin/products?registered=1");
        return;
      }

      // 登録失敗時はエラー情報を表示
      const data = (await response.json()) as RegisterResponse;
      setErrorMessage(data.message || "登録に失敗しました。");
    } catch {
      setErrorMessage("通信エラーが発生しました。");
    }
  };

  return (
    <main className="max-w-xl mx-auto py-10">
      <h1 className="mb-6 text-center">商品登録</h1>
      {errorMessage && (
        <p className="mb-4 text-center text-red-600">{errorMessage}</p>
      )}
      <ProductForm onSubmit={handleSubmit} submitLabel="登録" />
    </main>
  );
};

export default ProductRegisterPage;

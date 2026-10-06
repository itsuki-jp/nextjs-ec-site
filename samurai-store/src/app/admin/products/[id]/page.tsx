"use client";

import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import ProductForm from "@/components/ProductForm";
import type { ProductData } from "@/types/product";

type Product = ProductData;
type ApiResponse = Product & { message?: string };

const ProductEditPage = () => {
  const router = useRouter();
  const { id: productId } = useParams<{ id: string }>();
  const [productData, setProductData] = useState<Product | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const getProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`);
      const data = (await response.json()) as ApiResponse;
      if (!response.ok) {
        setErrorMessage(data.message || "商品情報の取得に失敗しました。");
        return;
      }
      setProductData(data);
    } catch {
      setErrorMessage("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ID変更を契機に非同期で商品データを取得する
    if (productId) void getProduct(productId);
  }, [productId]);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock"));
    if (!name || !Number.isFinite(price) || price < 0 || !Number.isInteger(price) ||
        !Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
      setErrorMessage("商品名、価格、在庫数を正しく入力してください。");
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, { method: "PUT", body: formData });
      const data = (await response.json()) as ApiResponse;
      if (!response.ok) {
        setErrorMessage(data.message || "更新に失敗しました。");
        return;
      }
      router.push("/admin/products?edited=1");
    } catch {
      setErrorMessage("通信エラーが発生しました。");
    }
  };

  if (loading) return <div className="py-12 text-center text-lg text-gray-600">商品データを読み込み中です...</div>;

  return (
    <main className="mx-auto max-w-xl py-10">
      <h1 className="mb-6 text-center">商品編集</h1>
      {errorMessage && <p className="mb-4 text-center text-red-600">{errorMessage}</p>}
      {productData && <ProductForm onSubmit={handleSubmit} initialValues={productData} submitLabel="更新" />}
    </main>
  );
};

export default ProductEditPage;

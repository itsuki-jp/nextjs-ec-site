import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { type ProductData } from "@/types/product";
import { isLoggedIn } from "@/lib/auth";

type Product = ProductData;

interface ProductDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

const getProduct = async (id: string): Promise<Product | null> => {
  try {
    const res = await fetch(`${process.env.BASE_URL}/api/products/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    return (await res.json()) as Product;
  } catch (err) {
    console.error("商品取得エラー：", err);
    return null;
  }
};

export const generateMetadata = async ({
  params,
}: ProductDetailPageProps): Promise<Metadata> => {
  const { id } = await params;
  const product = await getProduct(id);

  return {
    title: product?.name ?? "404：ページが見つかりません",
  };
};

const ProductDetailPage = async ({
  params,
}: ProductDetailPageProps) => {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const stock = product.stock ?? 0;

  let stockText = "売り切れ";
  let stockStyle = "text-red-600";
  if (stock > 10) {
    stockText = "在庫あり";
    stockStyle = "text-green-600";
  } else if (stock > 0) {
    stockText = "在庫わずか";
    stockStyle = "text-orange-500";
  }

  const quantityOptions = Array.from(
    { length: Math.min(stock, 10) },
    (_, index) => index + 1,
  ).map((quantity) => (
    <option key={quantity} value={quantity}>
      {quantity}
    </option>
  ));

  const finalImageUrl = product.image_url
    ? `/uploads/${product.image_url}`
    : "/images/no-image.jpg";

  const loggedIn = await isLoggedIn();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8 md:flex-row">
        <Image
          src={finalImageUrl}
          alt={product.name || "商品画像"}
          width={800}
          height={800}
          className="max-h-[600px] w-full object-contain md:w-1/2"
        />
        <div className="w-full space-y-6 pt-4 md:w-1/2">
          <h1>{product.name}</h1>
          <p className="whitespace-pre-line text-gray-700">
            {product.description}
          </p>
          <p className="text-3xl font-bold text-indigo-600">
            ¥{product.price.toLocaleString()}
            <span className="text-base font-normal text-gray-500">
              （税込）
            </span>
          </p>
          <p className={`text-base font-medium ${stockStyle}`}>
            在庫状況：{stockText}
          </p>

          <div className="mt-8 space-y-6">
            {stock > 0 && (
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex flex-col">
                  <label
                    htmlFor="quantity"
                    className="block text-sm text-gray-700"
                  >
                    数量
                  </label>
                  <select
                    id="quantity"
                    name="quantity"
                    defaultValue={1}
                    className="w-24 rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                  >
                    {quantityOptions}
                  </select>
                </div>
                <button
                  type="button"
                  className="rounded-sm bg-indigo-500 px-4 py-2 text-white hover:bg-indigo-600"
                >
                  カートに追加
                </button>
                {loggedIn && (
                  <button
                    type="button"
                    className="rounded-sm border border-indigo-500 px-4 py-2 text-indigo-500 hover:bg-indigo-50"
                  >
                    購入手続きへ
                  </button>
                )}
              </div>
            )}
            {loggedIn && (
              <button
                type="button"
                className="text-teal-800 hover:underline"
              >
                &#9825; お気に入り追加
              </button>
            )}
          </div>

          <div className="mt-8 border-t border-gray-200 pt-4">
            <Link href="/products" className="text-indigo-600 hover:underline">
              ← 商品一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductDetailPage;

'use client';

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { type ProductData } from "@/types/product";

type Product = Pick<
  ProductData,
  "id" | "name" | "price" | "image_url" | "review_avg" | "review_count"
>;

type ProductsResponse = {
  pickUp: Product[];
  newArrival: Product[];
  hotItems: Product[];
};

const HomeContent = () => {
  const searchParams = useSearchParams();
  const message = searchParams.get("registered")
    ? "会員登録が完了しました。"
    : searchParams.get("logged-in")
      ? "ログインしました。"
      : searchParams.get("logged-out")
        ? "ログアウトしました。"
        : searchParams.get("submitted")
          ? "お問い合わせを送信しました。ご返信までしばらくお待ちください。"
          : null;
  const [pickUp, setPickUp] = useState<Product[]>([]);
  const [newArrival, setNewArrival] = useState<Product[]>([]);
  const [hotItems, setHotItems] = useState<Product[]>([]);

  useEffect(() => {
    void fetch("/api/products/home")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`商品データの取得に失敗しました。(${res.status})`);
        }

        return (await res.json()) as ProductsResponse;
      })
      .then((data) => {
        setPickUp(data.pickUp);
        setNewArrival(data.newArrival);
        setHotItems(data.hotItems);
      })
      .catch((err) => console.error("商品データの取得に失敗しました。", err));
  }, []);

  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)]">
      {message && (
        <div role="status" className="bg-green-100 p-3 text-center text-green-800 shadow-md">
          {message}
        </div>
      )}
      <section className="relative h-[60vh] w-full overflow-hidden sm:h-[70vh]">
        <Image
          src="/images/main-visual.jpg"
          alt="最新コレクションを発見"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white">
          <h1 className="mb-4 text-3xl font-bold drop-shadow-md sm:text-4xl md:text-5xl">
            最新コレクションを発見
          </h1>
          <p className="mb-8 text-base drop-shadow-md sm:text-lg md:text-xl">
            あなたのスタイルをアップグレードするアイテムを見つけよう
          </p>
          <Link
            href="/products"
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-blue-800 shadow-md transition-colors hover:bg-gray-200 sm:text-base"
          >
            今すぐ見る
          </Link>
        </div>
      </section>

      <main className="container mx-auto flex max-w-screen-xl flex-col gap-4 px-8 pb-12 pt-8">
        <section>
          <h2>
            <span>Pick Up</span>
            <span className="mx-2 font-light text-gray-400">|</span>
            <span className="text-base">おすすめ商品</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {pickUp.map((item) => (
              <ProductCard
                key={`pickup-${item.id}`}
                id={item.id.toString()}
                title={item.name}
                price={item.price}
                imageUrl={item.image_url ?? undefined}
                imageSize={400}
              />
            ))}
          </div>
        </section>

        <section>
          <h2>
            <span>New Arrival</span>
            <span className="mx-2 font-light text-gray-400">|</span>
            <span className="text-base">新着商品</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
            {newArrival.map((item) => (
              <ProductCard
                key={`new-${item.id}`}
                id={item.id.toString()}
                title={item.name}
                price={item.price}
                imageUrl={item.image_url ?? undefined}
                showCartButton
              />
            ))}
          </div>
        </section>

        <section>
          <h2>
            <span>Hot Items</span>
            <span className="mx-2 font-light text-gray-400">|</span>
            <span className="text-base">注目商品</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
            {hotItems.map((item) => (
              <ProductCard
                key={`featured-${item.id}`}
                id={item.id.toString()}
                title={item.name}
                price={item.price}
                imageUrl={item.image_url ?? undefined}
                showCartButton
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export const Home = () => (
  <Suspense fallback={null}>
    <HomeContent />
  </Suspense>
);

export default Home;

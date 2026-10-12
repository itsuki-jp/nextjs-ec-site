import React from "react";
import ProductList from "@/components/ProductList";
import { type ProductCardProps } from "@/components/ProductCard";
import { type ProductData } from "@/types/product";
import Pagination from "@/components/Pagination";
import Sort from "@/app/products/Sort";

type Product = Pick<
  ProductData,
  "id" | "name" | "price" | "image_url" | "review_avg" | "review_count"
>;

interface ProductsPageData {
  products: Product[];
  pagination: {
    currentPage: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
  };
}

const ProductsPage = async ({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const sp = await searchParams;
  const page = Number(sp?.page ?? "1");
  const perPage = Number(sp?.perPage ?? "16");
  const sortParam = typeof sp?.sort === "string" ? sp.sort : "new";
  const sort = sortParam === "priceAsc" ? "priceAsc" : "new";
  const keyword = typeof sp?.keyword === "string" ? sp.keyword : "";

  const query = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
    sort,
    keyword,
  });

  const res = await fetch(
    `${process.env.BASE_URL}/api/products?${query.toString()}`,
    {
      cache: "no-store",
    },
  );

  const productsPageData: ProductsPageData = await res.json();
  if (!Array.isArray(productsPageData.products)) {
    console.error("商品データの取得に失敗しました。");
    return (
      <p className="text-center text-gray-500 text-lg py-10">
        商品データの取得に失敗しました。
      </p>
    );
  }

  const products: ProductCardProps[] = productsPageData.products.map(
    (row: Product) => ({
      id: String(row.id),
      title: row.name,
      price: row.price,
      imageUrl: row.image_url ?? undefined,
      rating: Number(row.review_avg ?? 0),
      reviewCount: Number(row.review_count ?? 0),
    }),
  );

  return (
    <main className="p-8">
      <h1>商品一覧</h1>
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <p className="text-lg mt-4">
          {keyword && (
            <>
              「<span className="text-blue-600 font-semibold">{keyword}</span>
              」の検索結果：
            </>
          )}
          {productsPageData.pagination.totalItems}件の商品が見つかりました（
          &nbsp;{productsPageData.pagination.totalPages}&nbsp;ページ中&nbsp;
          {productsPageData.pagination.currentPage}&nbsp;ページ目を表示）
        </p>
        <Sort sort={sort} perPage={perPage} keyword={keyword} />
      </section>

      <section className="mb-8">
        <ProductList products={products} />
      </section>

      <section className="mb-8">
        {productsPageData.pagination.totalPages > 0 && (
          <Pagination
            currentPage={productsPageData.pagination.currentPage}
            totalPages={productsPageData.pagination.totalPages}
          />
        )}
      </section>
    </main>
  );
};

export default ProductsPage;

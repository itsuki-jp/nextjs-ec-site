import Link from "next/link";
import { type ProductData } from "@/types/product";
import Pagination from "@/components/Pagination";
import DeleteLink from "@/app/admin/products/DeleteLink";

type Product = Pick<ProductData, "id" | "name" | "price" | "stock" | "updated_at">;

interface ProductsPageData {
  products: Product[];
  pagination: {
    currentPage: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
  };
}

const AdminProductsPage = async ({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const sp = await searchParams;
  const page = Number(sp?.page ?? "1");
  const perPage = Number(sp?.perPage ?? "20");

  const res = await fetch(
    `${process.env.BASE_URL}/api/products?page=${page}&perPage=${perPage}`,
    { cache: "no-store" },
  );

  const { products, pagination }: ProductsPageData = await res.json();
  if (!Array.isArray(products)) {
    console.error("商品データの取得に失敗しました。");
    return (
      <p className="text-center text-gray-500 text-lg py-10">
        商品データの取得に失敗しました。
      </p>
    );
  }

  const tableStyle = "px-5 py-3 border-b border-gray-300";

  // クエリパラメータに応じたメッセージを設定
  const message =
    sp?.registered
      ? "商品を登録しました。"
      : sp?.edited
        ? "商品を編集しました。"
        : sp?.deleted
          ? "商品を削除しました。"
          : null;

  return (
    <>
      {message && (
        <div className="flex w-full items-center justify-center bg-green-100 p-3 text-center text-green-800 shadow-md">
          {message}
        </div>
      )}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-center">商品一覧</h1>
        <div className="flex justify-end mb-4">
          <Link
            href="/admin/inquiries"
            className="mr-3 rounded-sm bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
          >
            お問い合わせ一覧
          </Link>
          <Link
            href="/admin/products/register"
            className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-sm font-semibold"
          >
            商品登録
          </Link>
        </div>

        <div className="shadow-lg rounded-lg overflow-hidden">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-gray-200 text-gray-700 text-left">
                <th className={tableStyle}>ID</th>
                <th className={tableStyle}>商品名</th>
                <th className={tableStyle}>価格(税込)</th>
                <th className={tableStyle}>在庫数</th>
                <th className={tableStyle}>最終更新日</th>
                <th className={tableStyle}></th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className={`${tableStyle} text-center text-gray-500`}
                  >
                    商品が見つかりませんでした。
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-100">
                    <td className={tableStyle}>{product.id}</td>
                    <td className={tableStyle}>{product.name}</td>
                    <td className={tableStyle}>¥{product.price.toLocaleString()}</td>
                    <td className={tableStyle}>{product.stock}</td>
                    <td className={tableStyle}>
                      {product.updated_at
                        ? new Date(product.updated_at).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className={tableStyle}>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-indigo-600 hover:text-indigo-700 mr-6"
                      >
                        編集
                      </Link>
                      <DeleteLink id={product.id} name={product.name} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <section className="mb-8">
          {pagination.totalPages > 0 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
            />
          )}
        </section>
      </div>
    </>
  );
};

export default AdminProductsPage;

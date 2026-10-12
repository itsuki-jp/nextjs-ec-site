import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { type ProductData } from "@/types/product";
import { type ReviewsResponse } from "@/types/review";
import { AUTH_TOKEN, getAuthUser } from "@/lib/auth";
import CartControls from "@/app/products/[id]/CartControls";
import ReviewControls from "@/app/products/[id]/ReviewControls";
import FavoriteControls from "@/app/products/[id]/FavoriteControls";

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

const getReviews = async (id: string): Promise<ReviewsResponse | null> => {
  try {
    const response = await fetch(
      `${process.env.BASE_URL}/api/products/${id}/reviews`,
      { cache: "no-store" },
    );
    if (!response.ok) return null;
    return (await response.json()) as ReviewsResponse;
  } catch (error) {
    console.error("レビュー取得エラー：", error);
    return null;
  }
};

const getFavoriteState = async (
  id: string,
): Promise<{ loggedIn: boolean; isFavorite: boolean }> => {
  const [cookieStore, user] = await Promise.all([cookies(), getAuthUser()]);
  const token = cookieStore.get(AUTH_TOKEN)?.value;
  if (!user || !token) return { loggedIn: false, isFavorite: false };

  try {
    const response = await fetch(`${process.env.BASE_URL}/api/favorites/${id}`, {
      cache: "no-store",
      headers: { Cookie: `${AUTH_TOKEN}=${token}` },
    });
    if (!response.ok) return { loggedIn: true, isFavorite: false };
    return { loggedIn: true, isFavorite: (await response.json()) === true };
  } catch (error) {
    console.error("お気に入り状態取得エラー：", error);
    return { loggedIn: true, isFavorite: false };
  }
};

const displayStars = (score: number) => {
  const filledStars = Math.max(0, Math.min(5, Math.round(score)));
  return `${"★".repeat(filledStars)}${"☆".repeat(5 - filledStars)}`;
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
  const [product, reviewsResponse, favoriteState] = await Promise.all([
    getProduct(id),
    getReviews(id),
    getFavoriteState(id),
  ]);

  if (!product) {
    notFound();
  }

  const reviews = reviewsResponse?.reviews ?? [];
  const rating = reviewsResponse?.review_avg ?? 0;
  const reviewCount = reviewsResponse?.pagination.totalItems ?? 0;

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

  const finalImageUrl = product.image_url
    ? `/uploads/${product.image_url}`
    : "/images/no-image.jpg";

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
          {reviewCount > 0 ? (
            <p className="flex items-center gap-2" aria-label={`評価 ${rating.toFixed(1)}点、レビュー${reviewCount}件`}>
              <span className="text-xl text-yellow-500">{displayStars(rating)}</span>
              <span className="text-gray-700">{rating.toFixed(1)}</span>
              <span className="text-sm text-gray-500">（レビュー{reviewCount}件）</span>
            </p>
          ) : (
            <p className="text-sm text-gray-500">まだレビューがありません</p>
          )}
          <p className={`text-base font-medium ${stockStyle}`}>
            在庫状況：{stockText}
          </p>

          <div className="mt-8 space-y-6">
            <CartControls
              cartItem={{
                id: String(product.id),
                title: product.name,
                price: product.price,
                imageUrl: product.image_url ?? undefined,
              }}
              stock={stock}
              loggedIn={favoriteState.loggedIn}
            />
            {favoriteState.loggedIn && (
              <FavoriteControls
                productId={product.id}
                initialIsFavorite={favoriteState.isFavorite}
              />
            )}
          </div>

          <div className="mt-8 border-t border-gray-200 pt-4">
            <Link href="/products" className="text-indigo-600 hover:underline">
              ← 商品一覧に戻る
            </Link>
          </div>
        </div>
      </div>

      <section className="mt-8 grid gap-8 rounded-md border border-gray-300 p-4 shadow-sm md:grid-cols-2">
        <div>
          <h2 className="mb-4">レビュー一覧</h2>
          {reviews.length > 0 ? (
            <ul className="space-y-4">
              {reviews.slice(0, 3).map((review) => (
                <li key={review.id} className="border-b border-gray-300 pb-3">
                  <p className="mb-1 text-yellow-500">{displayStars(review.score)}</p>
                  <p className="whitespace-pre-wrap text-gray-800">{review.content}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {review.user_name} さん {new Date(review.created_at).toLocaleDateString("ja-JP")}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">まだレビューがありません。</p>
          )}
          {reviewCount > 3 && (
            <p className="mt-4 text-center">
              <Link href={`/products/${product.id}/reviews`} className="text-indigo-600 hover:underline">
                すべてのレビューを見る（{reviewCount}件）
              </Link>
            </p>
          )}
        </div>
        <div className="border-t border-gray-200 pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <ReviewControls productId={product.id} loggedIn={favoriteState.loggedIn} />
        </div>
      </section>
    </main>
  );
};

export default ProductDetailPage;

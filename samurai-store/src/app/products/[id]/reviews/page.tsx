import Link from "next/link";
import { notFound } from "next/navigation";

import Pagination from "@/components/Pagination";
import { type ReviewsResponse } from "@/types/review";

type ReviewsPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

const ReviewsPage = async ({ params, searchParams }: ReviewsPageProps) => {
  const { id: productId } = await params;
  const queryParams = await searchParams;
  const pageValue = queryParams?.page;
  const page = typeof pageValue === "string" ? Number(pageValue) : 1;
  const safePage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  const perPage = 10;
  const query = new URLSearchParams({
    page: String(safePage),
    perPage: String(perPage),
  });

  let response: Response;
  try {
    response = await fetch(
      `${process.env.BASE_URL}/api/products/${productId}/reviews?${query.toString()}`,
      { cache: "no-store" },
    );
  } catch {
    notFound();
  }

  if (!response.ok) notFound();

  const reviewsPageData = (await response.json()) as ReviewsResponse;
  if (!Array.isArray(reviewsPageData.reviews)) notFound();

  return (
    <main className="p-8">
      <p className="my-4">
        <Link href={`/products/${productId}`} className="text-indigo-600 hover:underline">
          ← 商品詳細ページに戻る
        </Link>
      </p>
      <h1 className="mb-6 text-center">レビュー一覧</h1>

      {reviewsPageData.reviews.length > 0 ? (
        <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {reviewsPageData.reviews.map((review) => (
            <article key={review.id} className="rounded-md border border-gray-200 p-4 shadow-sm">
              <p className="mb-2 text-lg text-yellow-500" aria-label={`${review.score}点`}>
                {Array.from({ length: 5 }, (_, index) => (
                  <span key={index}>{index < review.score ? "★" : "☆"}</span>
                ))}
              </p>
              <p className="mb-2 whitespace-pre-wrap text-gray-800">{review.content}</p>
              <p className="text-xs text-gray-500">
                {review.user_name} さん {new Date(review.created_at).toLocaleDateString("ja-JP")}
              </p>
            </article>
          ))}
        </section>
      ) : (
        <p className="py-8 text-center text-gray-500">まだレビューがありません。</p>
      )}

      {reviewsPageData.pagination.totalItems > 0 && (
        <Pagination
          currentPage={reviewsPageData.pagination.currentPage}
          totalPages={reviewsPageData.pagination.totalPages}
        />
      )}
    </main>
  );
};

export default ReviewsPage;

"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type ReviewControlsProps = {
  productId: number;
  loggedIn: boolean;
};

const ReviewControls = ({ productId, loggedIn }: ReviewControlsProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [rating, setRating] = useState(0);
  const [clickedRating, setClickedRating] = useState(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (rating === 0 || !content.trim()) {
      setErrorMessage("評価とレビュー内容を入力してください。");
      return;
    }

    if (!loggedIn) {
      setErrorMessage("レビューの投稿にはログインが必要です。");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, content }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        setErrorMessage(data.message || "レビューの投稿に失敗しました。");
        return;
      }

      setSuccessMessage("レビューを投稿しました。");
      setRating(0);
      setClickedRating(0);
      setContent("");
      router.refresh();
    } catch {
      setErrorMessage("通信エラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginRedirect = () => {
    const redirectUrl = encodeURIComponent(pathname);
    router.push(`/login?redirect=${redirectUrl}`);
  };

  return (
    <section aria-labelledby="review-form-heading">
      <h2 id="review-form-heading" className="mt-2">レビューを投稿する</h2>
      {!loggedIn ? (
        <div className="py-4 text-center">
          <p className="mb-4 text-gray-600">レビューの投稿にはログインが必要です。</p>
          <button
            type="button"
            onClick={handleLoginRedirect}
            className="rounded-md bg-indigo-500 px-6 py-2 text-white hover:bg-indigo-600"
          >
            ログインしてレビューを投稿
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <fieldset>
            <legend className="mb-2 font-semibold text-gray-700">評価</legend>
            <div className="flex text-2xl text-yellow-500">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  type="button"
                  aria-pressed={clickedRating === score}
                  aria-label={`${score}点`}
                  onClick={() => {
                    setRating(score);
                    setClickedRating(score);
                  }}
                  onMouseEnter={() => setRating(score)}
                  onMouseLeave={() => setRating(clickedRating)}
                  className="cursor-pointer px-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
                >
                  {score <= rating ? "★" : "☆"}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="review-content" className="mb-2 block font-semibold text-gray-700">
              コメント
            </label>
            <textarea
              id="review-content"
              rows={4}
              value={content}
              disabled={submitting}
              onChange={(event) => setContent(event.target.value)}
              className="w-full resize-y rounded-md border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="商品の感想や体験をご記入ください。"
            />
          </div>

          {errorMessage && <p role="alert" className="text-red-600">{errorMessage}</p>}
          {successMessage && <p role="status" className="text-green-700">{successMessage}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-indigo-600 px-4 py-3 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {submitting ? "投稿中..." : "レビューを投稿"}
          </button>
        </form>
      )}
    </section>
  );
};

export default ReviewControls;

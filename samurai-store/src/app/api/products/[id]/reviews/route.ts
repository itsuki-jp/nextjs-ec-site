import { NextRequest, NextResponse } from "next/server";

import { getAuthUser } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { type ReviewData } from "@/types/review";

type ReviewSummary = {
  count: number;
  review_avg: number;
};

const reviewsPerPage = 10;

export const GET = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  const { id } = await context.params;
  const productId = Number.parseInt(id, 10);
  if (!Number.isSafeInteger(productId) || productId < 1) {
    return NextResponse.json({ message: "商品が見つかりませんでした。" }, { status: 404 });
  }

  const requestedPage = Number(new URL(request.url).searchParams.get("page") ?? "1");
  const page = Number.isFinite(requestedPage)
    ? Math.max(1, Math.min(Math.floor(requestedPage), 1000))
    : 1;
  const offset = (page - 1) * reviewsPerPage;

  try {
    const [reviews, summaryRows] = await Promise.all([
      executeQuery<ReviewData>(`
        SELECT
          r.id,
          r.product_id,
          r.user_id,
          r.score,
          r.content,
          r.created_at,
          u.name AS user_name
        FROM reviews AS r
        JOIN users AS u ON r.user_id = u.id
        WHERE r.product_id = ?
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?;
      `, [productId, reviewsPerPage, offset]),
      executeQuery<ReviewSummary>(`
        SELECT
          COUNT(*) AS count,
          COALESCE(ROUND(AVG(score), 1), 0) AS review_avg
        FROM reviews
        WHERE product_id = ?;
      `, [productId]),
    ]);

    const totalItems = Number(summaryRows[0]?.count ?? 0);
    const reviewAvg = Number(summaryRows[0]?.review_avg ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalItems / reviewsPerPage));

    return NextResponse.json({
      reviews,
      review_avg: reviewAvg,
      pagination: {
        currentPage: page,
        perPage: reviewsPerPage,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error("レビュー取得エラー：", error);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました。" },
      { status: 500 },
    );
  }
};

export const POST = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  const { id } = await context.params;
  const productId = Number.parseInt(id, 10);
  if (!Number.isSafeInteger(productId) || productId < 1) {
    return NextResponse.json({ message: "商品が見つかりませんでした。" }, { status: 404 });
  }

  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
    }

    const bodyValue: unknown = await request.json().catch(() => null);
    if (typeof bodyValue !== "object" || bodyValue === null || Array.isArray(bodyValue)) {
      return NextResponse.json({ message: "入力内容を確認してください。" }, { status: 400 });
    }

    const body = bodyValue as Record<string, unknown>;
    const score = Number(body.rating);
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!Number.isInteger(score) || score < 1 || score > 5 || !content) {
      return NextResponse.json({ message: "評価とレビュー内容を入力してください。" }, { status: 400 });
    }

    const products = await executeQuery<{ id: number }>(
      "SELECT id FROM products WHERE id = ?;",
      [productId],
    );
    if (products.length === 0) {
      return NextResponse.json({ message: "商品が見つかりませんでした。" }, { status: 404 });
    }

    await executeQuery(
      `INSERT INTO reviews (product_id, user_id, score, content)
       VALUES (?, ?, ?, ?);`,
      [productId, user.userId, score, content],
    );

    return NextResponse.json({ message: "レビューを登録しました。" }, { status: 201 });
  } catch (error) {
    console.error("レビュー登録エラー：", error);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました。" },
      { status: 500 },
    );
  }
};

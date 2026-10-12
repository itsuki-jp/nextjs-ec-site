import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { type FavoriteProduct } from "@/types/favorite";

export const GET = async () => {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
    }

    const favorites = await executeQuery<FavoriteProduct>(
      `SELECT
        f.id,
        f.product_id,
        f.user_id,
        f.created_at,
        p.name,
        p.price,
        p.stock,
        p.image_url
      FROM favorites AS f
      INNER JOIN products AS p ON p.id = f.product_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC, f.id DESC;`,
      [user.userId],
    );

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error("お気に入り取得エラー：", error);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました。" },
      { status: 500 },
    );
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
    }

    const body: unknown = await request.json().catch(() => null);
    if (typeof body !== "object" || body === null || !("productId" in body)) {
      return NextResponse.json({ message: "商品を指定してください。" }, { status: 400 });
    }

    const productId = Number(body.productId);
    if (!Number.isSafeInteger(productId) || productId < 1) {
      return NextResponse.json({ message: "商品を指定してください。" }, { status: 400 });
    }

    const products = await executeQuery<{ id: number }>(
      "SELECT id FROM products WHERE id = ? LIMIT 1;",
      [productId],
    );
    if (products.length === 0) {
      return NextResponse.json({ message: "商品が見つかりませんでした。" }, { status: 404 });
    }

    await executeQuery(
      "INSERT IGNORE INTO favorites (product_id, user_id) VALUES (?, ?);",
      [productId, user.userId],
    );

    return NextResponse.json({ message: "お気に入りに登録しました。" });
  } catch (error) {
    console.error("お気に入り登録エラー：", error);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました。" },
      { status: 500 },
    );
  }
};

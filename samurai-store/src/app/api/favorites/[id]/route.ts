import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { executeQuery } from "@/lib/db";

type FavoriteRouteContext = {
  params: Promise<{ id: string }>;
};

const getProductId = (id: string) => {
  const productId = Number(id);
  return Number.isSafeInteger(productId) && productId > 0 ? productId : null;
};

export const GET = async (
  _request: NextRequest,
  context: FavoriteRouteContext,
) => {
  const { id } = await context.params;
  const productId = getProductId(id);
  if (productId === null) {
    return NextResponse.json({ message: "商品が見つかりませんでした。" }, { status: 404 });
  }

  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
    }

    const favorites = await executeQuery<{ id: number }>(
      "SELECT id FROM favorites WHERE product_id = ? AND user_id = ? LIMIT 1;",
      [productId, user.userId],
    );

    return NextResponse.json(favorites.length > 0);
  } catch (error) {
    console.error("お気に入り状態取得エラー：", error);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました。" },
      { status: 500 },
    );
  }
};

export const DELETE = async (
  _request: NextRequest,
  context: FavoriteRouteContext,
) => {
  const { id } = await context.params;
  const productId = getProductId(id);
  if (productId === null) {
    return NextResponse.json({ message: "商品が見つかりませんでした。" }, { status: 404 });
  }

  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
    }

    await executeQuery(
      "DELETE FROM favorites WHERE product_id = ? AND user_id = ?;",
      [productId, user.userId],
    );

    return NextResponse.json({ message: "お気に入りを解除しました。" });
  } catch (error) {
    console.error("お気に入り解除エラー：", error);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました。" },
      { status: 500 },
    );
  }
};

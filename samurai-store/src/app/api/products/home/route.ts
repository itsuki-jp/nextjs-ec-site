import { NextResponse } from "next/server";

import { executeQuery } from "@/lib/db";
import { type ProductData } from "@/types/product";

type Product = Pick<
  ProductData,
  "id" | "name" | "price" | "image_url" | "review_avg" | "review_count"
>;

export const GET = async () => {
  try {
    const [pickUp, newArrival, hotItems] = await Promise.all([
      executeQuery<Product[]>(`
        SELECT id, name, price, image_url
        FROM products
        ORDER BY sales_count DESC
        LIMIT 3;
      `),
      executeQuery<Product[]>(`
        SELECT id, name, price, image_url
        FROM products
        ORDER BY created_at DESC
        LIMIT 4;
      `),
      executeQuery<Product[]>(`
        SELECT id, name, price, image_url
        FROM products
        WHERE is_featured = true
        ORDER BY RAND()
        LIMIT 4;
      `),
    ]);

    return NextResponse.json({ pickUp, newArrival, hotItems });
  } catch (err) {
    console.error("トップページ商品取得エラー：", err);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました。" },
      { status: 500 },
    );
  }
};

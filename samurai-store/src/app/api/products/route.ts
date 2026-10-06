import { NextRequest, NextResponse } from "next/server";

import path from "path";
import { writeFile } from "fs/promises";
import { randomUUID } from "crypto";

import { executeQuery } from "@/lib/db";
import { type ProductData } from "@/types/product";

type Product = Omit<ProductData, "description">;

// 全商品のデータを取得
export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);

    // クエリパラメータからpageとperPageを取得
    let page = Number(searchParams.get("page")) || 1;
    let perPage = Number(searchParams.get("perPage")) || 16;

    // 最小値・最大値を超えている場合は補正
    page = Math.max(1, Math.min(page, 1000));
    perPage = Math.max(1, Math.min(perPage, 100));

    // オフセット（スキップする件数）を計算
    const offset = (page - 1) * perPage;

    // クエリパラメータから並べ替え条件を取得
    const sort = searchParams.get("sort") ?? "new";

    // ORDER BY句は許可した文字列だけを使う
    let order = "ORDER BY created_at DESC";
    switch (sort) {
      case "priceAsc":
        order = "ORDER BY price ASC";
        break;
      case "new":
      default:
        order = "ORDER BY created_at DESC";
        break;
    }

    // クエリパラメータから検索キーワードを取得
    const keyword = searchParams.get("keyword")?.trim() || "";
    const where = keyword
      ? "WHERE (name LIKE ? OR description LIKE ?)"
      : "";
    const whereParams = keyword ? [`%${keyword}%`, `%${keyword}%`] : [];
    const productsParams = [...whereParams, perPage, offset];
    const countParams = [...whereParams];

    // 2つのデータベース操作を並行処理で実施
    const [products, totalItemsResult] = await Promise.all([
      // LIMITとOFFSETを使い、現在のページに表示する商品データだけを取得
      executeQuery<Product>(
        `SELECT * FROM products ${where} ${order} LIMIT ? OFFSET ?;`,
        productsParams,
      ),
      // 検索条件に合致する商品の全件数を取得
      executeQuery<{ count: number }>(
        `SELECT COUNT(*) AS count FROM products ${where};`,
        countParams,
      ),
    ]);

    // 全件数を扱いやすい変数に取得
    const totalItems = totalItemsResult[0].count;

    // 総ページ数を計算
    const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

    // 取得した商品データとページネーション情報を返す
    return NextResponse.json({
      products,
      pagination: { currentPage: page, perPage, totalItems, totalPages },
    });
  } catch (err) {
    console.error("商品取得エラー：", err);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました。" },
      { status: 500 },
    );
  }
};

// 商品データを新規登録
export const POST = async (request: NextRequest) => {
  try {
    // 画像ファイルを含むフォームデータを取得
    const formData = await request.formData();
    const name = formData.get("name")?.toString().trim() || "";
    const file = formData.get("imageFile") as File;
    const description =
      formData.get("description")?.toString().trim() || "商品の説明がありません。";
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock"));
    const isFeatured = formData.get("isFeatured") === "on";

    // 入力値のバリデーション
    if (!name.trim() || !file || isNaN(price) || isNaN(stock)) {
      return NextResponse.json(
        { message: "必須項目が不足しています。" },
        { status: 400 },
      );
    }

    // 拡張子を安全に取得
    const ext = file.name.split(".").pop();
    if (!ext || !["jpg", "jpeg", "png"].includes(ext.toLowerCase())) {
      return NextResponse.json(
        { message: "対応していないファイル形式です。" },
        { status: 400 },
      );
    }

    // UUIDで衝突確率を十分小さくし、排他的作成で既存ファイルの上書きも防止
    const fileName = `${randomUUID()}.${ext.toLowerCase()}`;

    // 保存先のファイルパスを構築
    const filePath = path.join(process.cwd(), "public/uploads", fileName);

    // ファイルを保存
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer, { flag: "wx" });

    // 商品情報をproductsテーブルに追加
    await executeQuery(
      `INSERT INTO products (name, image_url, description, price, stock, is_featured)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [name, fileName, description, price, stock, isFeatured ? 1 : 0],
    );

    return NextResponse.json(
      { message: "商品を登録しました。" },
      { status: 201 },
    );
  } catch (err) {
    console.error("商品登録エラー：", err);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました。" },
      { status: 500 },
    );
  }
};

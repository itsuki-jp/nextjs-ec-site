import { NextResponse, type NextRequest } from "next/server";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { rm, writeFile } from "node:fs/promises";

import { AUTH_TOKEN } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { type ProductData } from "@/types/product";

type Product = ProductData;

// 指定IDの商品データを取得
export const GET = async (
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  // URLのパラメータからIDを取得
  const { id } = await context.params;

  // IDを数値に変換
  const productId = parseInt(id, 10);

  try {
    const result = await executeQuery<Product>(
      "SELECT * FROM products WHERE id = ?;",
      [productId],
    );

    if (result.length === 0) {
      return NextResponse.json(
        { message: "商品が見つかりませんでした。" },
        { status: 404 },
      );
    }

    return NextResponse.json(result[0]);
  } catch (err) {
    console.error("商品取得エラー：", err);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました。" },
      { status: 500 },
    );
  }
};

// 指定IDの商品を更新
export const PUT = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  const { id } = await context.params;
  const productId = Number.parseInt(id, 10);
  if (!Number.isSafeInteger(productId) || productId < 1) {
    return NextResponse.json({ message: "商品が見つかりませんでした。" }, { status: 404 });
  }

  let uploadedPath: string | undefined;
  try {
    const existing = await executeQuery<Product>("SELECT * FROM products WHERE id = ?;", [productId]);
    if (existing.length === 0) {
      return NextResponse.json({ message: "商品が見つかりませんでした。" }, { status: 404 });
    }

    const formData = await request.formData();
    const name = formData.get("name")?.toString().trim() ?? "";
    const description = formData.get("description")?.toString().trim() || "商品の説明がありません。";
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock"));
    const isFeatured = formData.get("isFeatured") === "on";
    const fileValue = formData.get("imageFile");
    const file = fileValue instanceof File ? fileValue : null;

    if (!name || !Number.isFinite(price) || price < 0 || !Number.isInteger(price) ||
        !Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
      return NextResponse.json({ message: "入力内容を確認してください。" }, { status: 400 });
    }

    let imageFileName = existing[0].image_url ?? null;
    if (file && file.size > 0) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !["jpg", "jpeg", "png"].includes(ext) || file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ message: "画像は5MB以下のJPG、JPEG、PNGにしてください。" }, { status: 400 });
      }

      const bytes = Buffer.from(await file.arrayBuffer());
      const isPng = ext === "png" && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      const isJpeg = ["jpg", "jpeg"].includes(ext) && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9;
      if (!isPng && !isJpeg) {
        return NextResponse.json({ message: "ファイル内容が有効なJPG/PNG画像ではありません。" }, { status: 400 });
      }

      imageFileName = `${randomUUID()}.${ext}`;
      uploadedPath = path.join(process.cwd(), "public/uploads", imageFileName);
      await writeFile(uploadedPath, bytes, { flag: "wx" });
    }

    await executeQuery(
      `UPDATE products SET name = ?, image_url = ?, description = ?, price = ?, stock = ?, is_featured = ? WHERE id = ?;`,
      [name, imageFileName, description, price, stock, isFeatured ? 1 : 0, productId],
    );

    const oldFileName = existing[0].image_url;
    if (uploadedPath && oldFileName) {
      const oldPath = path.join(process.cwd(), "public/uploads", path.basename(oldFileName));
      await rm(oldPath, { force: true }).catch((err: unknown) => {
        console.error("旧画像の削除に失敗しました:", err);
      });
    }

    return NextResponse.json({ message: "商品を編集しました。" });
  } catch (err) {
    if (uploadedPath) await rm(uploadedPath, { force: true }).catch(() => undefined);
    console.error("商品更新エラー：", err);
    return NextResponse.json({ message: "サーバーエラーが発生しました。" }, { status: 500 });
  }
};

// 指定IDの商品を削除
export const DELETE = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  const token = request.cookies.get(AUTH_TOKEN)?.value;
  if (!token) {
    return NextResponse.json({ message: "ログインが必要です。" }, { status: 401 });
  }

  try {
    const user = await verifyToken(token);
    if (!user?.isAdmin) {
      return NextResponse.json({ message: "管理者権限が必要です。" }, { status: 403 });
    }
  } catch (err) {
    console.error("認証情報の確認に失敗しました：", err);
    return NextResponse.json({ message: "認証情報を確認できませんでした。" }, { status: 401 });
  }

  const { id } = await context.params;
  const productId = Number.parseInt(id, 10);
  if (!Number.isSafeInteger(productId) || productId < 1) {
    return NextResponse.json(
      { message: "商品が見つかりませんでした。" },
      { status: 404 },
    );
  }

  try {
    const existing = await executeQuery<Product>(
      "SELECT * FROM products WHERE id = ?;",
      [productId],
    );
    if (existing.length === 0) {
      return NextResponse.json(
        { message: "商品が見つかりませんでした。" },
        { status: 404 },
      );
    }

    await executeQuery("DELETE FROM products WHERE id = ?;", [productId]);

    const imageFileName = existing[0].image_url;
    if (imageFileName && path.basename(imageFileName) === imageFileName) {
      const imagePath = path.join(process.cwd(), "public/uploads", imageFileName);
      await rm(imagePath, { force: true }).catch((err: unknown) => {
        console.error("画像ファイル削除エラー：", err);
      });
    }

    return NextResponse.json({ message: "商品を削除しました。" }, { status: 200 });
  } catch (err) {
    console.error("商品削除エラー：", err);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました。" },
      { status: 500 },
    );
  }
};

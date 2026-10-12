import { type NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getAuthUser } from "@/lib/auth";
import { executeQuery } from "@/lib/db";

export const PUT = async (request: NextRequest) => {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { message: "ログインしてください。" },
        { status: 401 },
      );
    }

    const payload: unknown = await request.json();
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
      return NextResponse.json(
        { message: "入力内容を確認してください。" },
        { status: 400 },
      );
    }

    const { oldPassword, newPassword } = payload as Record<string, unknown>;
    if (
      typeof oldPassword !== "string" ||
      typeof newPassword !== "string" ||
      !oldPassword.trim() ||
      !newPassword.trim()
    ) {
      return NextResponse.json(
        { message: "すべての項目を入力してください。" },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "パスワードは8文字以上で入力してください。" },
        { status: 400 },
      );
    }

    const result = await executeQuery<{ password: string }>(
      "SELECT password FROM users WHERE id = ?",
      [user.userId],
    );
    const oldHashed = result[0]?.password;

    if (!oldHashed) {
      return NextResponse.json(
        { message: "ユーザー情報が見つかりません。" },
        { status: 404 },
      );
    }

    const passwordMatches = await bcrypt.compare(oldPassword, oldHashed);
    if (!passwordMatches) {
      return NextResponse.json(
        { message: "現在のパスワードが正しくありません。" },
        { status: 400 },
      );
    }

    const newHashed = await bcrypt.hash(newPassword, 10);
    await executeQuery(
      "UPDATE users SET password = ? WHERE id = ?",
      [newHashed, user.userId],
    );

    return NextResponse.json({ message: "パスワードを変更しました。" });
  } catch (error) {
    console.error("パスワード変更エラー：", error);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました。" },
      { status: 500 },
    );
  }
};

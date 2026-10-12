import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getAuthUser, AUTH_TOKEN } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { generateToken } from "@/lib/jwt";

type RegisterPayload = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
};

const isRecord = (value: unknown): value is RegisterPayload =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const POST = async (request: NextRequest) => {
  try {
    const payload: unknown = await request.json();
    if (!isRecord(payload)) {
      return NextResponse.json({ message: "入力内容を確認してください。" }, { status: 400 });
    }

    const { name, email, password } = payload;
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      return NextResponse.json(
        { message: "すべての項目を入力してください。" },
        { status: 400 },
      );
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
      return NextResponse.json(
        { message: "正しいメールアドレスの形式で入力してください。" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "パスワードは8文字以上で入力してください。" },
        { status: 400 },
      );
    }

    const existingUsers = await executeQuery<{ count: number }>(
      "SELECT COUNT(*) AS count FROM users WHERE email = ?",
      [normalizedEmail],
    );
    if (Number(existingUsers[0]?.count ?? 0) > 0) {
      return NextResponse.json(
        { message: "このメールアドレスは既に登録されています。" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await executeQuery(
      `INSERT INTO users (name, email, password, is_admin, enabled)
       VALUES (?, ?, ?, false, true)`,
      [normalizedName, normalizedEmail, hashedPassword],
    );

    return NextResponse.json({ message: "会員登録が完了しました。" });
  } catch (error) {
    console.error("会員登録エラー：", error);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました。" },
      { status: 500 },
    );
  }
};

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

    const { name, email } = payload as Record<string, unknown>;
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      !name.trim() ||
      !email.trim()
    ) {
      return NextResponse.json(
        { message: "すべての項目を入力してください。" },
        { status: 400 },
      );
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
      return NextResponse.json(
        { message: "正しいメールアドレスの形式で入力してください。" },
        { status: 400 },
      );
    }

    const existingUsers = await executeQuery<{ count: number }>(
      "SELECT COUNT(*) AS count FROM users WHERE email = ? AND id != ?",
      [normalizedEmail, user.userId],
    );
    if (Number(existingUsers[0]?.count ?? 0) > 0) {
      return NextResponse.json(
        { message: "このメールアドレスは既に使用されています。" },
        { status: 400 },
      );
    }

    await executeQuery(
      "UPDATE users SET name = ?, email = ? WHERE id = ?",
      [normalizedName, normalizedEmail, user.userId],
    );

    const newToken = await generateToken({
      userId: user.userId,
      name: normalizedName,
      email: normalizedEmail,
      isAdmin: user.isAdmin,
    });

    const response = NextResponse.json({ message: "会員情報を編集しました。" });
    response.cookies.set({
      name: AUTH_TOKEN,
      value: newToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // StripeからのトップレベルGETによる戻りでも認証Cookieを送信する。
      sameSite: "lax",
      maxAge: 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("会員情報更新エラー：", error);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました。" },
      { status: 500 },
    );
  }
};

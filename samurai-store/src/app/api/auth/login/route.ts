import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { executeQuery } from "@/lib/db";
import { generateToken, JWT_COOKIE } from "@/lib/jwt";

type LoginPayload = {
  email?: unknown;
  password?: unknown;
};

type LoginUser = {
  id: number;
  name: string;
  email: string;
  password: string;
  is_admin: boolean | number;
};

const isLoginPayload = (value: unknown): value is LoginPayload =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const POST = async (request: NextRequest) => {
  try {
    const payload: unknown = await request.json();
    if (!isLoginPayload(payload)) {
      return NextResponse.json({ message: "入力内容を確認してください。" }, { status: 400 });
    }

    const { email, password } = payload;
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password.trim()
    ) {
      return NextResponse.json(
        { message: "メールアドレスとパスワードを入力してください。" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
      return NextResponse.json(
        { message: "正しいメールアドレスの形式で入力してください。" },
        { status: 400 },
      );
    }

    const users = await executeQuery<LoginUser>(
      "SELECT id, name, email, password, is_admin FROM users WHERE email = ? AND enabled = TRUE",
      [normalizedEmail],
    );
    const user = users[0];
    const passwordMatches = user ? await bcrypt.compare(password, user.password) : false;
    if (!user || !passwordMatches) {
      return NextResponse.json(
        { message: "メールアドレスまたはパスワードが違います。" },
        { status: 401 },
      );
    }

    const token = await generateToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      isAdmin: Boolean(user.is_admin),
    });

    const response = NextResponse.json({
      message: "ログイン成功",
      isAdmin: Boolean(user.is_admin),
    });
    response.cookies.set({
      name: JWT_COOKIE,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // StripeからのトップレベルGETによる戻りでも認証Cookieを送る。
      sameSite: "lax",
      maxAge: 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("ログインAPIエラー：", error);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました。" },
      { status: 500 },
    );
  }
};

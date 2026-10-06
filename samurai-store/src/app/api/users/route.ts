import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { executeQuery } from "@/lib/db";

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

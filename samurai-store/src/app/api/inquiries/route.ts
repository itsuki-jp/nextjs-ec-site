import { NextRequest, NextResponse } from "next/server";

import { AUTH_TOKEN } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { verifyToken } from "@/lib/jwt";

type Inquiry = {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
};

type InquiryPayload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
};

const isInquiryPayload = (value: unknown): value is InquiryPayload =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const GET = async (request: NextRequest) => {
  const token = request.cookies.get(AUTH_TOKEN)?.value;
  if (!token) {
    return NextResponse.json({ message: "ログインが必要です。" }, { status: 401 });
  }

  try {
    const user = await verifyToken(token);
    if (!user?.isAdmin) {
      return NextResponse.json({ message: "管理者権限が必要です。" }, { status: 403 });
    }

    const inquiries = await executeQuery<Inquiry>(
      "SELECT id, name, email, message, created_at FROM inquiries ORDER BY created_at DESC;",
    );
    return NextResponse.json({ inquiries });
  } catch (err) {
    console.error("お問い合わせ取得エラー：", err);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました。" },
      { status: 500 },
    );
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const payload: unknown = await request.json();
    if (!isInquiryPayload(payload)) {
      return NextResponse.json({ message: "入力内容を確認してください。" }, { status: 400 });
    }

    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    const email = typeof payload.email === "string" ? payload.email.trim() : "";
    const message = typeof payload.message === "string" ? payload.message.trim() : "";
    if (!name || !email || !message) {
      return NextResponse.json(
        { message: "氏名、メールアドレス、お問い合わせ内容を入力してください。" },
        { status: 400 },
      );
    }

    await executeQuery(
      "INSERT INTO inquiries (name, email, message) VALUES (?, ?, ?);",
      [name, email, message],
    );

    return NextResponse.json({ message: "お問い合わせを受け付けました。" }, { status: 201 });
  } catch (err) {
    console.error("お問い合わせ登録エラー：", err);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました。" },
      { status: 500 },
    );
  }
};

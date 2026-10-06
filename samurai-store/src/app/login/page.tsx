"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { SubmitEvent } from "react";

type LoginResponse = {
  message?: string;
  isAdmin?: boolean;
};

const inputStyle =
  "w-full rounded-sm border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500";
const labelStyle = "mb-1 block font-bold";
const badgeStyle = "ml-2 rounded-md bg-red-500 px-2 py-0.5 text-xs font-semibold text-white";

export const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password.trim()
    ) {
      setErrorMessage("メールアドレスとパスワードを入力してください。");
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" },
      });

      const data = (await response.json()) as LoginResponse;

      if (response.ok) {
        if (data.isAdmin) {
          router.push("/admin/products");
        } else if (redirect) {
          router.replace(redirect);
        } else {
          router.push("/?logged-in=1");
        }
        router.refresh();
        return;
      }

      setErrorMessage(data.message || "ログインに失敗しました。");
    } catch {
      setErrorMessage("通信エラーが発生しました。");
    }
  };

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <h1 className="mb-6 text-center text-2xl font-bold">ログイン</h1>
      {errorMessage && (
        <p role="alert" className="mb-4 text-center text-red-600">
          {errorMessage}
        </p>
      )}
      <form onSubmit={handleSubmit} className="w-full space-y-6 rounded-xl bg-white p-8 shadow-lg">
        <div>
          <label className={labelStyle} htmlFor="email">
            メールアドレス<span className={badgeStyle}>必須</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            required
            className={inputStyle}
          />
        </div>

        <div>
          <label className={labelStyle} htmlFor="password">
            パスワード<span className={badgeStyle}>必須</span>
          </label>
          <input
            type="password"
            id="password"
            name="password"
            autoComplete="current-password"
            required
            className={inputStyle}
          />
        </div>

        <button
          type="submit"
          className="mt-6 w-full rounded-sm bg-indigo-500 py-2 font-semibold text-white hover:bg-indigo-600"
        >
          ログイン
        </button>

        <div className="mt-4 text-center">
          <Link href="/register" className="text-indigo-600 hover:underline">
            会員登録はこちら
          </Link>
        </div>
      </form>
    </main>
  );
};

export default LoginPage;

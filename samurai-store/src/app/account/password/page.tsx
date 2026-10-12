"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SubmitEvent } from "react";

const PasswordChangePage = () => {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const oldPassword = formData.get("oldPassword");
    const newPassword = formData.get("newPassword");
    const confirmPassword = formData.get("confirmPassword");

    if (
      typeof oldPassword !== "string" ||
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string" ||
      !oldPassword.trim() ||
      !newPassword.trim() ||
      !confirmPassword.trim()
    ) {
      setErrorMessage("すべての項目を入力してください。");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("新しいパスワードが一致しません。");
      return;
    }

    try {
      const response = await fetch("/api/users/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      if (response.ok) {
        router.push("/account?password-changed=1");
        return;
      }

      const data = (await response.json()) as { message?: string };
      setErrorMessage(data.message ?? "パスワード変更に失敗しました。");
    } catch {
      setErrorMessage("通信エラーが発生しました。");
    }
  };

  const inputStyle =
    "w-full rounded-sm border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500";
  const labelStyle = "mb-1 block font-bold";
  const badgeStyle =
    "ml-2 rounded-md bg-red-500 px-2 py-0.5 text-xs font-semibold text-white";

  return (
    <main className="mx-auto max-w-md py-10">
      <div className="my-4">
        <Link href="/account" className="text-indigo-600 hover:underline">
          ← マイページに戻る
        </Link>
      </div>
      <h1 className="mb-6 text-center">パスワード変更</h1>
      {errorMessage && (
        <p role="alert" className="mt-8 text-center text-red-600">
          {errorMessage}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="w-full space-y-6 rounded-xl bg-white p-8 shadow-lg"
      >
        <label className={labelStyle} htmlFor="oldPassword">
          現在のパスワード<span className={badgeStyle}>必須</span>
        </label>
        <input
          type="password"
          id="oldPassword"
          name="oldPassword"
          required
          autoComplete="current-password"
          className={inputStyle}
        />

        <label className={labelStyle} htmlFor="newPassword">
          新しいパスワード<span className={badgeStyle}>必須</span>
        </label>
        <input
          type="password"
          id="newPassword"
          name="newPassword"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputStyle}
        />

        <label className={labelStyle} htmlFor="confirmPassword">
          新しいパスワード（確認用）<span className={badgeStyle}>必須</span>
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          required
          autoComplete="new-password"
          className={inputStyle}
        />

        <button
          type="submit"
          className="mt-2 w-full rounded-sm bg-indigo-500 py-2 text-white hover:bg-indigo-600"
        >
          更新
        </button>
      </form>
    </main>
  );
};

export default PasswordChangePage;

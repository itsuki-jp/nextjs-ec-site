"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SubmitEvent } from "react";

const inputStyle =
  "w-full rounded-sm border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500";
const labelStyle = "mb-1 block font-bold";

const ContactPage = () => {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name");
    const email = formData.get("email");
    const message = formData.get("message");
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof message !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !message.trim()
    ) {
      setErrorMessage("すべての項目を入力してください。");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setErrorMessage(data.message || "お問い合わせの送信に失敗しました。");
        return;
      }

      router.push("/?submitted=1");
    } catch {
      setErrorMessage("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <Link href="/" className="mb-6 inline-block text-indigo-600 hover:underline">
        トップページへ戻る
      </Link>
      <h1 className="mb-6 text-center text-2xl font-bold">お問い合わせ</h1>
      {errorMessage && (
        <p role="alert" className="mb-4 text-center text-red-600">
          {errorMessage}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl bg-white p-8 shadow-lg">
        <div>
          <label htmlFor="name" className={labelStyle}>氏名</label>
          <input id="name" name="name" type="text" required className={inputStyle} />
        </div>
        <div>
          <label htmlFor="email" className={labelStyle}>メールアドレス</label>
          <input id="email" name="email" type="email" required className={inputStyle} />
        </div>
        <div>
          <label htmlFor="message" className={labelStyle}>お問い合わせ内容</label>
          <textarea
            id="message"
            name="message"
            rows={6}
            required
            className={inputStyle}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-sm bg-indigo-500 py-2 font-semibold text-white hover:bg-indigo-600 disabled:cursor-wait disabled:opacity-60"
        >
          {isSubmitting ? "送信中..." : "送信"}
        </button>
      </form>
    </main>
  );
};

export default ContactPage;

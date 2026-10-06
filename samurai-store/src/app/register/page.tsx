"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import UserForm from "@/components/UserForm";

type RegisterResponse = {
  message?: string;
};

export const UserRegisterPage = () => {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof confirmPassword !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setErrorMessage("すべての項目を入力してください。");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("パスワードが一致しません。");
      return;
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        router.push("/?registered=1");
        return;
      }

      const data = (await response.json()) as RegisterResponse;
      setErrorMessage(data.message || "登録に失敗しました。");
    } catch {
      setErrorMessage("通信エラーが発生しました。");
    }
  };

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <h1 className="mb-4 text-center text-2xl font-bold">会員登録</h1>
      {errorMessage && (
        <p role="alert" className="mt-8 text-center text-red-600">
          {errorMessage}
        </p>
      )}
      <UserForm onSubmit={handleSubmit} withPassword submitLabel="登録" />
    </main>
  );
};

export default UserRegisterPage;

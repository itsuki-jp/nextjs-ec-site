"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SubmitEvent } from "react";
import UserForm from "@/components/UserForm";

type UserEditFormProps = {
  initialValues: { name: string; email: string };
};

const UserEditForm = ({ initialValues }: UserEditFormProps) => {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name");
    const email = formData.get("email");

    if (typeof name !== "string" || typeof email !== "string" || !name.trim() || !email.trim()) {
      setErrorMessage("すべての項目を入力してください。");
      return;
    }

    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        body: JSON.stringify({ name, email }),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        router.push("/account?edited=1");
        return;
      }

      const data = (await response.json()) as { message?: string };
      setErrorMessage(data.message ?? "更新に失敗しました。");
    } catch {
      setErrorMessage("通信エラーが発生しました。");
    }
  };

  return (
    <>
      {errorMessage && (
        <p role="alert" className="mt-8 text-center text-red-600">
          {errorMessage}
        </p>
      )}
      <UserForm
        onSubmit={handleSubmit}
        initialValues={initialValues}
        submitLabel="更新"
      />
    </>
  );
};

export default UserEditForm;

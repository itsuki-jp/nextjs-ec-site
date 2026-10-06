"use client";

import type { SubmitEvent } from "react";

type UserFormProps = {
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  initialValues?: {
    name: string;
    email: string;
  };
  submitLabel: string;
  withPassword?: boolean;
};

const inputStyle =
  "w-full rounded-sm border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500";
const labelStyle = "mb-1 block font-bold";
const badgeStyle = "ml-2 rounded-md bg-red-500 px-2 py-0.5 text-xs font-semibold text-white";

const UserForm = ({
  onSubmit,
  initialValues = { name: "", email: "" },
  submitLabel,
  withPassword = false,
}: UserFormProps) => (
  <form onSubmit={onSubmit} className="w-full space-y-6 rounded-xl bg-white p-8 shadow-lg">
    <div>
      <label className={labelStyle} htmlFor="name">
        氏名<span className={badgeStyle}>必須</span>
      </label>
      <input
        type="text"
        id="name"
        name="name"
        required
        autoComplete="name"
        defaultValue={initialValues.name}
        className={inputStyle}
      />
    </div>

    <div>
      <label className={labelStyle} htmlFor="email">
        メールアドレス<span className={badgeStyle}>必須</span>
      </label>
      <input
        type="email"
        id="email"
        name="email"
        required
        autoComplete="email"
        defaultValue={initialValues.email}
        className={inputStyle}
      />
    </div>

    {withPassword && (
      <>
        <div>
          <label className={labelStyle} htmlFor="password">
            パスワード<span className={badgeStyle}>必須</span>
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            autoComplete="new-password"
            className={inputStyle}
          />
        </div>

        <div>
          <label className={labelStyle} htmlFor="confirmPassword">
            パスワード（確認用）<span className={badgeStyle}>必須</span>
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            required
            autoComplete="new-password"
            className={inputStyle}
          />
        </div>
      </>
    )}

    <button
      type="submit"
      className="mt-2 w-full rounded-sm bg-indigo-500 py-2 text-white hover:bg-indigo-600"
    >
      {submitLabel}
    </button>
  </form>
);

export default UserForm;

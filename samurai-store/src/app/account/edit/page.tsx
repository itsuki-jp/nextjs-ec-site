import Link from "next/link";
import UserEditForm from "@/app/account/edit/UserEditForm";
import { getAuthUser } from "@/lib/auth";

const UserEditPage = async () => {
  const user = await getAuthUser();

  if (!user) {
    return <p className="mt-10 text-center">ログインしてください。</p>;
  }

  return (
    <main className="mx-auto max-w-md py-10">
      <div className="my-4">
        <Link href="/account" className="text-indigo-600 hover:underline">
          ← マイページに戻る
        </Link>
      </div>
      <h1 className="mb-4 text-center">会員情報の編集</h1>
      <UserEditForm initialValues={{ name: user.name, email: user.email }} />
    </main>
  );
};

export default UserEditPage;

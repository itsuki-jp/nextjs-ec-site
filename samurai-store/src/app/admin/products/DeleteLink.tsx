"use client";

import { useRouter } from "next/navigation";

type DeleteLinkProps = {
  id: number;
  name: string;
};

const DeleteLink = ({ id, name }: DeleteLinkProps) => {
  const router = useRouter();

  const handleDelete = async () => {
    if (!window.confirm(`「${name}」を削除すると元に戻せません。\n削除してもよろしいですか？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (response.ok) {
        router.push("/admin/products?deleted=1");
        return;
      }

      const data = (await response.json()) as { message?: string };
      window.alert(data.message || "削除に失敗しました。");
    } catch {
      window.alert("通信エラーが発生しました。");
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="cursor-pointer text-red-600 hover:text-red-700"
    >
      削除
    </button>
  );
};

export default DeleteLink;

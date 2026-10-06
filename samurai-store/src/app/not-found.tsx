import Link from "next/link";

const NotFound = () => (
  <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
    <h1>404：ページが見つかりません</h1>
    <p className="mb-6 text-gray-600">
      URLが間違っているか、ページが移動または削除された可能性があります。
    </p>
    <Link href="/" className="text-indigo-600 hover:underline">
      ホームに戻る
    </Link>
  </main>
);

export default NotFound;

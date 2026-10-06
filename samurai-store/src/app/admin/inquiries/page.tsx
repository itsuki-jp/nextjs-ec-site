import Link from "next/link";
import { cookies } from "next/headers";

type Inquiry = {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
};

type InquiriesResponse = {
  inquiries?: Inquiry[];
  message?: string;
};

const AdminInquiriesPage = async () => {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  let inquiries: Inquiry[] = [];
  let errorMessage = "";
  try {
    const response = await fetch(`${process.env.BASE_URL}/api/inquiries`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    const data = (await response.json()) as InquiriesResponse;
    if (!response.ok || !Array.isArray(data.inquiries)) {
      errorMessage = data.message || "お問い合わせ一覧の取得に失敗しました。";
    } else {
      inquiries = data.inquiries;
    }
  } catch {
    errorMessage = "お問い合わせ一覧の取得に失敗しました。";
  }

  const cellStyle = "border-b border-gray-300 px-4 py-3 align-top";

  return (
    <main className="container mx-auto px-4 py-8">
      <Link href="/admin/products" className="mb-6 inline-block text-indigo-600 hover:underline">
        管理者用商品一覧へ戻る
      </Link>
      <h1 className="mb-6 text-center text-2xl font-bold">お問い合わせ一覧</h1>

      {errorMessage ? (
        <p role="alert" className="py-8 text-center text-red-600">{errorMessage}</p>
      ) : inquiries.length === 0 ? (
        <p className="py-8 text-center text-gray-500">お問い合わせはありません。</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-lg">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-gray-200 text-left text-gray-700">
                <th className={cellStyle}>ID</th>
                <th className={cellStyle}>氏名</th>
                <th className={cellStyle}>メールアドレス</th>
                <th className={cellStyle}>お問い合わせ内容</th>
                <th className={cellStyle}>送信日時</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inquiry) => (
                <tr key={inquiry.id} className="hover:bg-gray-50">
                  <td className={cellStyle}>{inquiry.id}</td>
                  <td className={cellStyle}>{inquiry.name}</td>
                  <td className={cellStyle}>{inquiry.email}</td>
                  <td className={`${cellStyle} min-w-64 whitespace-pre-wrap`}>{inquiry.message}</td>
                  <td className={`${cellStyle} whitespace-nowrap`}>
                    {new Date(inquiry.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
};

export default AdminInquiriesPage;

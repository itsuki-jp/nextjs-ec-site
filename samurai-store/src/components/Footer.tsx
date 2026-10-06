import Image from "next/image";
import Link from "next/link";

// 共通フッター
export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 py-4 text-white">
      <div className="container mx-auto mb-8 grid grid-cols-1 gap-8 border-b border-gray-700 px-4 pb-8 md:grid-cols-3">
        <div>
          <h3 className="mb-4 text-xl">SAMURAI Storeについて</h3>
          <p className="text-sm leading-relaxed">最新のトレンドとテクノロジーを取り入れたアイテムをお届けします。</p>
        </div>

        <div>
          <h3 className="mb-4 text-xl">クイックリンク</h3>
          <ul className="list-none space-y-2 pl-0">
            <li><Link href="/privacy">プライバシーポリシー</Link></li>
            <li><Link href="/terms">利用規約</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xl">お問い合わせ</h3>
          <p><Link href="/contact">お問い合わせはこちら</Link></p>
          <div className="mt-4 flex space-x-4">
            <Image src="/icons/facebook-icon.png" alt="Facebook" width={24} height={24} className="h-6 w-6" />
            <Image src="/icons/x-icon.svg" alt="X" width={24} height={24} className="h-6 w-6" />
            <Image src="/icons/youtube-icon.svg" alt="YouTube" width={24} height={24} className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 text-center text-sm">
        <p>&copy; {currentYear} SAMURAI Store. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;

'use client';

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { type AuthUser } from "@/lib/auth";

const navigationItems = [
  { href: "/", label: "ホーム" },
  { href: "/products", label: "商品一覧" },
  { href: "/contact", label: "お問い合わせ" },
];

export interface HeaderProps {
  user: AuthUser | null;
}

export const Header = ({ user }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const perPage = searchParams.get("perPage") || "16";
  const sort = searchParams.get("sort") || "new";
  const keyword = searchParams.get("keyword") || "";

  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeAccountMenu = () => setIsAccountMenuOpen(false);
  const toggleAccountMenu = () => setIsAccountMenuOpen((prev) => !prev);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        closeAccountMenu();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const menuItemStyle = "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100";

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex-shrink-0">
          <Link href="/" className="block">
            <Image
              src="/images/samurai-store-logo.png"
              alt="SAMURAI Store"
              width={910}
              height={200}
              className="h-auto w-[140px] object-contain sm:h-[55px] sm:w-[250px]"
              priority
            />
          </Link>
        </div>

        <nav className="mt-8 hidden flex-grow text-center md:block">
          <ul className="flex list-none justify-center space-x-8 pl-0">
            {navigationItems.map((item, index) => (
              <li
                key={item.href}
                className={index < navigationItems.length - 1 ? "border-r border-gray-300 pr-8" : undefined}
              >
                <Link href={item.href} className="whitespace-nowrap">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-shrink-0 items-center space-x-2 sm:space-x-6">
          <form action="/products" method="GET" className="hidden sm:block">
            <input type="hidden" name="page" value="1" />
            <input type="hidden" name="perPage" value={perPage} />
            <input type="hidden" name="sort" value={sort} />
            <input
              type="text"
              name="keyword"
              placeholder="検索..."
              aria-label="商品を検索"
              defaultValue={keyword}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </form>
          <Link href="/account/favorites" aria-label="お気に入り">
            <Image src="/icons/heart-icon.svg" alt="Favorites" width={24} height={24} className="h-6 w-6" />
          </Link>
          <Link href="/cart" aria-label="カート">
            <Image src="/icons/cart-icon.svg" alt="Cart" width={24} height={24} className="h-6 w-6" />
          </Link>
          <div className="relative" ref={accountMenuRef}>
            <button type="button" onClick={toggleAccountMenu} className="relative cursor-pointer" aria-expanded={isAccountMenuOpen} aria-label="アカウントメニュー">
              <Image src="/icons/account-icon.svg" alt="Account" width={24} height={24} className="h-6 w-6" />
              {user && (
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
              )}
            </button>
            {isAccountMenuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-48 rounded-md border border-gray-300 bg-white py-1 shadow-lg">
                {user ? (
                  <>
                    <Link href="/account" onClick={closeAccountMenu} className={menuItemStyle}>
                      マイページ
                    </Link>
                    <form method="POST" action="/api/auth/logout">
                      <button type="submit" className={`${menuItemStyle} w-full text-left`}>
                        ログアウト
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={closeAccountMenu} className={menuItemStyle}>
                      ログイン
                    </Link>
                    <Link href="/register" onClick={closeAccountMenu} className={menuItemStyle}>
                      会員登録
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={toggleMenu}
              className="cursor-pointer rounded-md border border-gray-300 px-2 py-1 text-sm md:hidden"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
            >
              {isMenuOpen ? "閉じる" : "メニュー"}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <nav id="mobile-navigation" className="border-t border-gray-200 px-4 py-4 md:hidden">
          <ul className="container mx-auto list-none space-y-3 pl-0">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block whitespace-nowrap"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="sm:hidden">
              <Link
                href="/account"
                className="block whitespace-nowrap"
                onClick={() => setIsMenuOpen(false)}
              >
                アカウント
              </Link>
            </li>
            <li>
              <form method="POST" action="/api/auth/logout">
                <button type="submit" className="text-indigo-600 hover:underline">
                  ログアウト
                </button>
              </form>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
};

export default Header;

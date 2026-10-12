import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getAuthUser } from "@/lib/auth";
import { CartProvider } from "@/hooks/useCart";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SAMURAI Store",
    template: "%s | SAMURAI Store",
  },
  description: "最新のトレンドとテクノロジーを取り入れたアイテムをお届けします。",
};

export const RootLayout = async ({ children }: LayoutProps<"/">) => {
  const user = await getAuthUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>
          <Suspense fallback={null}>
            <Header user={user} />
          </Suspense>
          {children}
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
};

export default RootLayout;

import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { AUTH_TOKEN } from "@/lib/auth";

const authPages = [
  "/account",
  "/account/edit",
  "/account/orders",
  "/account/password",
  "/account/favorites",
  "/order-confirm",
];

const adminPages = [
  "/admin/products",
  "/admin/products/register",
  "/admin/inquiries",
];

export const proxy = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  const isProtected = [...authPages, ...adminPages].some((path) =>
    pathname.startsWith(path),
  );

  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get(AUTH_TOKEN)?.value;
  if (!token) return redirectToLogin(request);

  const user = await verifyToken(token);
  if (!user) return redirectToLogin(request);

  if (adminPages.some((path) => pathname.startsWith(path)) && !user.isAdmin) {
    return redirectToLogin(request);
  }

  return NextResponse.next();
};

const redirectToLogin = (request: NextRequest) => {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
};

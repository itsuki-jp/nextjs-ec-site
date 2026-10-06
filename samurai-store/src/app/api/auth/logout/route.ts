import { NextRequest, NextResponse } from "next/server";
import { JWT_COOKIE } from "@/lib/jwt";

export const POST = async (request: NextRequest) => {
  const response = NextResponse.redirect(new URL("/?logged-out=1", request.url), 303);
  response.cookies.delete({ name: JWT_COOKIE, path: "/" });
  return response;
};

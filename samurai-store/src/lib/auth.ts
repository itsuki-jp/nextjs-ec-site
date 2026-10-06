import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

export type AuthUser = {
  userId: number;
  name: string;
  email: string;
  isAdmin: boolean;
};

export const AUTH_TOKEN = "authToken";

export const getAuthUser = async (): Promise<AuthUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN)?.value;
  if (!token) {
    return null;
  }

  const user = (await verifyToken(token)) as AuthUser | null;
  return user;
};

export const isLoggedIn = async (): Promise<boolean> => {
  const user = await getAuthUser();
  return user !== null;
};

export const isAdmin = async (): Promise<boolean> => {
  const user = await getAuthUser();
  return user?.isAdmin ?? false;
};

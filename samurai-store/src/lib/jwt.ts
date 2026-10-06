import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const JWT_COOKIE = "authToken";

const getSecret = () => {
  const secretKey = process.env.JWT_SECRET;
  if (!secretKey) {
    throw new Error("環境変数JWT_SECRETが設定されていません。");
  }

  return new TextEncoder().encode(secretKey);
};

export const generateToken = (payload: JWTPayload): Promise<string> =>
  new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(getSecret());

export const verifyToken = async (token: string): Promise<JWTPayload | null> => {
  const secret = getSecret();
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    return payload;
  } catch {
    return null;
  }
};

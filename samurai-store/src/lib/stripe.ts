import Stripe from "stripe";

// この教材用プロジェクトではSandboxのキーだけを使用する。
export const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !/^(sk|rk)_test_/.test(secretKey)) {
    throw new Error("Stripeのテスト用シークレットキーを設定してください。");
  }
  // APIバージョンはインストール済みSDKの既定値を使用する。
  return new Stripe(secretKey);
};

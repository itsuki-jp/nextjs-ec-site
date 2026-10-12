import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd(), true);
const key = process.env.STRIPE_SECRET_KEY;
if (!key || !/^(sk|rk)_test_/.test(key)) throw new Error("Stripeのテスト用キーを.env.developmentに設定してください。");
const localCli = path.resolve(".tools", "stripe", process.platform === "win32" ? "stripe.exe" : "stripe");
const executable = fs.existsSync(localCli) ? localCli : "stripe";
const env = { ...process.env, STRIPE_API_KEY: key };
const redact = (text) => text.replace(/(?:[psr]k_(?:test|live)_|whsec_)[A-Za-z0-9]+/g, "[REDACTED]");

if (process.argv[2] === "setup") {
  const result = spawnSync(executable, ["listen", "--print-secret", "--skip-update"], { env, encoding: "utf8", windowsHide: true });
  const secret = result.stdout?.match(/whsec_[A-Za-z0-9]+/)?.[0];
  if (result.status !== 0 || !secret) {
    console.error(redact(result.stderr ?? result.error?.message ?? "Webhookシークレットの取得に失敗しました。"));
    process.exit(1);
  }
  const envPath = path.resolve(".env.development");
  const text = fs.readFileSync(envPath, "utf8").replace(/^\s*STRIPE_WEBHOOK_SECRET=.*\r?\n?/gm, "");
  fs.writeFileSync(envPath, `${text.trimEnd()}\nSTRIPE_WEBHOOK_SECRET=${secret}\n`);
  console.log("[stripe] WebhookシークレットをGit対象外の.env.developmentに保存しました。");
} else if (process.argv[2] === "listen") {
  const target = process.env.STRIPE_FORWARD_TO ?? "localhost:3000/api/orders/webhook";
  const child = spawn(executable, ["listen", "--events", "checkout.session.completed,checkout.session.async_payment_succeeded", "--forward-to", target, "--skip-update"], { env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  for (const stream of [child.stdout, child.stderr]) {
    let buffer = "";
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => {
      buffer += chunk;
      let end;
      while ((end = buffer.indexOf("\n")) !== -1) {
        console.log(redact(buffer.slice(0, end)));
        buffer = buffer.slice(end + 1);
      }
    });
    stream.on("end", () => { if (buffer) console.log(redact(buffer)); });
  }
  child.on("error", (error) => { console.error(redact(error.message)); process.exitCode = 1; });
  child.on("exit", (code) => { process.exitCode = code ?? 1; });
  process.on("SIGINT", () => child.kill());
  process.on("SIGTERM", () => child.kill());
} else {
  console.error("Usage: node scripts/stripe-local.mjs setup|listen");
  process.exit(1);
}

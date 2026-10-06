import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(rootDir, ".env.development");

const fileEnv = {};
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    const value = match[2].trim().replace(/^(?:"(.*)"|'(.*)')$/, (_, doubleQuoted, singleQuoted) =>
      doubleQuoted ?? singleQuoted,
    );
    fileEnv[match[1]] = value;
  }
}

const host = process.env.DB_HOST || fileEnv.DB_HOST || "127.0.0.1";
const port = Number(process.env.DB_PORT || fileEnv.DB_PORT || 3306);
const xamppDir = process.env.XAMPP_DIR || "C:\\xampp";
const timeoutMs = 30_000;

const canConnect = (connectHost, connectPort) =>
  new Promise((resolve) => {
    const socket = net.createConnection({ host: connectHost, port: connectPort });
    const finish = (connected) => {
      socket.destroy();
      resolve(connected);
    };

    socket.setTimeout(1_500);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const startMysql = async () => {
  const mysqldPath = path.join(xamppDir, "mysql", "bin", "mysqld.exe");
  const configPath = path.join(xamppDir, "mysql", "bin", "my.ini");
  if (!fs.existsSync(mysqldPath)) {
    console.error(`[ensure-db] mysqld.exe が見つかりません: ${mysqldPath}`);
    return false;
  }

  console.log("[ensure-db] MySQL停止中のため、XAMPP MySQLを起動します...");
  const child = spawn(mysqldPath, [`--defaults-file=${configPath}`, "--standalone"], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });

  try {
    await new Promise((resolve, reject) => {
      child.once("spawn", resolve);
      child.once("error", reject);
    });
    child.unref();
    return true;
  } catch (error) {
    console.error("[ensure-db] MySQLの起動に失敗しました:", error);
    return false;
  }
};

if (await canConnect(host, port)) {
  console.log(`[ensure-db] MySQL起動済み (${host}:${port})`);
  process.exit(0);
}

if (!(await startMysql())) process.exit(1);

const deadline = Date.now() + timeoutMs;
while (Date.now() < deadline) {
  await sleep(500);
  if (await canConnect(host, port)) {
    console.log(`[ensure-db] MySQLが起動しました (${host}:${port})`);
    process.exit(0);
  }
}

console.error(`[ensure-db] 30秒待ってもMySQL (${host}:${port}) に接続できませんでした。`);
process.exit(1);

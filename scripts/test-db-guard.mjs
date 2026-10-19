import fs from "node:fs";
import { spawnSync } from "node:child_process";

const envPath = ".env.test";
if (!fs.existsSync(envPath)) throw new Error("Missing .env.test; database writes are refused.");
const env = Object.fromEntries(fs.readFileSync(envPath, "utf8").split(/\r?\n/).map((line) => line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)).filter(Boolean).map(([, key, value]) => [key, value.replace(/^['"]|['"]$/g, "")]));
const site = new URL(env.SITE_URL ?? "");
const database = new URL(env.DATABASE_URL ?? "");
if (site.hostname !== "localhost") throw new Error("Refusing database writes: SITE_URL must be localhost.");
if (!(["localhost", "127.0.0.1", "::1"].includes(database.hostname)) || !database.pathname.toLowerCase().includes("test")) throw new Error("Refusing database writes: DATABASE_URL must be a localhost test database.");
const [tool, ...args] = process.argv.slice(2);
const entry = tool === "prisma" ? "node_modules/prisma/build/index.js" : tool === "tsx" ? "node_modules/tsx/dist/cli.mjs" : null;
if (!entry) throw new Error("Specify a supported guarded tool (prisma or tsx).");
const result = spawnSync(process.execPath, [entry, ...args], { stdio: "inherit", env: { ...process.env, ...env, SITE_URL: env.SITE_URL } });
if (result.error) throw result.error;
process.exit(result.status ?? 1);

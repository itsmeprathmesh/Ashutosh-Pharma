import readline from "node:readline";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

if (!process.stdin.isTTY) throw new Error("Run this helper in an interactive terminal.");
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
let password = "";
process.stderr.write("Admin password: ");
const input = await new Promise((resolve) => {
  process.stdin.on("keypress", (char, key) => {
    if (key?.ctrl && key.name === "c") { process.stdin.setRawMode(false); process.exit(1); }
    if (key?.name === "return") { process.stdin.setRawMode(false); process.stderr.write("\n"); resolve(password); return; }
    if (key?.name === "backspace") password = password.slice(0, -1);
    else if (!key?.ctrl && !key?.meta) password += char;
  });
});
if (input.length < 12) throw new Error("Use a password with at least 12 characters.");
const hash = await bcrypt.hash(input, 12);
password = "";
console.log(`ADMIN_PASSWORD_HASH_B64=${Buffer.from(hash).toString("base64")}`);
console.log(`SESSION_SECRET=${randomBytes(48).toString("base64url")}`);
console.log(`IMPORT_API_TOKEN=${randomBytes(32).toString("base64url")}`);

import fs from "node:fs/promises";
import path from "node:path";
import { watch } from "node:fs";

const folder = process.env.WATCH_FOLDER;
const site = process.env.SITE_URL;
const token = process.env.IMPORT_API_TOKEN;
if (!folder || !site || !token) throw new Error("Set WATCH_FOLDER, SITE_URL, and IMPORT_API_TOKEN.");
const endpoint = new URL("/api/admin/import", site);
const allowed = /\.(csv|tsv|xlsx|json)$/i;
const maxUploadBytes = 3.5 * 1024 * 1024;
const maxFiles = 20;
let pending = false;
async function sync() {
  if (pending) return;
  pending = true;
  try {
    const candidates = (await fs.readdir(folder, { withFileTypes: true })).filter((entry) => entry.isFile() && allowed.test(entry.name));
    if (candidates.length > maxFiles) throw new Error(`Select no more than ${maxFiles} catalogue files per sync.`);
    const files = [];
    let totalBytes = 0;
    for (const entry of candidates) {
      const filePath = path.join(folder, entry.name);
      const size = (await fs.stat(filePath)).size;
      if (size > maxUploadBytes || totalBytes + size > maxUploadBytes) throw new Error("Catalogue sync exceeds the 3.5 MB request limit.");
      totalBytes += size;
      files.push({ entry, filePath });
    }
    const form = new FormData();
    for (const { entry, filePath } of files) {
      const bytes = await fs.readFile(filePath);
      form.append("files", new Blob([bytes]), entry.name);
    }
    if (!files.length) return;
    const response = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${token}`, Origin: endpoint.origin }, body: form });
    if (!response.ok) throw new Error(`Import failed (${response.status}).`);
    console.log("Folder sync completed.");
  } catch (error) { console.error("Folder sync failed.", error instanceof Error ? error.name : "unknown"); }
  finally { pending = false; }
}
await sync();
watch(folder, { persistent: true }, () => setTimeout(sync, 500));
console.log(`Watching ${folder} for catalogue files.`);

import Papa from "papaparse";
import ExcelJS from "exceljs";
import slugify from "slugify";
import { db } from "@/lib/db";
import { isBlocked } from "@/lib/blocked";
import { isSafeXlsxArchive, matchesFileExtension, sniffUploadType } from "@/lib/file-signatures";
import { readBoundedBytes } from "@/lib/request-body";

const MAX_IMPORT_ROWS = 5000;
const MAX_IMPORT_COLUMNS = 100;

export type Row = Record<string, string>;

const ALIASES: Record<string, string[]> = {
  name: ["name", "product name", "product", "title", "item", "item name"],
  category: ["category", "product category", "group", "type"],
  packSize: ["packsize", "pack size", "packing", "packaging size", "packaging", "pack"],
  strength: ["strength", "dosage", "dose"],
  generic: ["generic", "generic name", "composition", "salt"],
  description: ["description", "details", "about"],
  imageUrl: ["imageurl", "image", "image url", "photo", "picture"],
};

function normalized(value: string) {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function pick(row: Row, key: string) {
  const aliases = ALIASES[key];
  const hit = Object.keys(row).find((column) => aliases.includes(normalized(column)));
  const value = hit ? row[hit].trim() : "";
  return value || undefined;
}

function cellText(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && "text" in value) return String(value.text ?? "");
  if (typeof value === "object" && "result" in value) return String(value.result ?? "");
  return String(value);
}

export async function parseFile(filename: string, buffer: Buffer): Promise<Row[]> {
  const extension = filename.split(".").pop()?.toLowerCase();
  const detectedType = sniffUploadType(buffer);
  if (!detectedType || !matchesFileExtension(filename, detectedType)) throw new Error("File content does not match an allowed catalogue format.");
  if (["csv", "tsv", "txt"].includes(extension ?? "")) {
    const delimiter = extension === "tsv" ? "\t" : undefined;
    if (extension === "txt") throw new Error("Unsupported catalogue format.");
    const result = Papa.parse<Row>(buffer.toString("utf8"), { header: true, skipEmptyLines: true, delimiter, preview: MAX_IMPORT_ROWS + 1 });
    if (result.errors.length || result.data.length > MAX_IMPORT_ROWS || (result.meta.fields?.length ?? 0) > MAX_IMPORT_COLUMNS) throw new Error("Catalogue file is malformed or exceeds row/column limits.");
    return result.data;
  }
  if (extension === "json") {
    const parsed: unknown = JSON.parse(buffer.toString("utf8"));
    const rows = Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" && "products" in parsed ? parsed.products : null;
    if (!Array.isArray(rows) || rows.length > MAX_IMPORT_ROWS) throw new Error("Catalogue JSON must contain a product array and stay under the row limit.");
    if (rows.some((row) => !row || typeof row !== "object" || Array.isArray(row) || Object.keys(row).length > MAX_IMPORT_COLUMNS)) throw new Error("Catalogue JSON rows must be simple product objects.");
    return rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key.slice(0, 100), cellText(value).slice(0, 5000)])));
  }
  if (extension === "xlsx") {
    if (!isSafeXlsxArchive(buffer)) throw new Error("The workbook archive exceeds safe expansion limits.");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error("The workbook does not contain a worksheet.");
    if (sheet.rowCount > MAX_IMPORT_ROWS + 1 || sheet.columnCount > MAX_IMPORT_COLUMNS) throw new Error("The worksheet exceeds row or column limits.");
    const headers: string[] = [];
    const rows: Row[] = [];
    sheet.eachRow((row, index) => {
      const values = (row.values as unknown[]).slice(1).map(cellText);
      if (index === 1) headers.push(...values);
      else rows.push(Object.fromEntries(headers.map((header, i) => [header, values[i] ?? ""])));
    });
    return rows;
  }
  throw new Error(`Unsupported file type: ${filename}. Use CSV, XLSX, or JSON.`);
}

export function sheetCsvUrl(input: string) {
  const url = new URL(input);
  if (url.protocol !== "https:" || url.hostname !== "docs.google.com") {
    throw new Error("Only HTTPS Google Sheets links are allowed.");
  }
  const match = url.pathname.match(/^\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) throw new Error("That does not look like a Google Sheets link.");
  const gid = new URLSearchParams(url.hash.slice(1)).get("gid") ?? url.searchParams.get("gid") ?? "0";
  return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${encodeURIComponent(gid)}`;
}

export async function fetchSheet(input: string) {
  const response = await fetch(sheetCsvUrl(input), { cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("Could not read the sheet. Set sharing to Anyone with the link can view.");
  const body = await readBoundedBytes(response, 4 * 1024 * 1024);
  if (!body.ok) throw new Error("The Google Sheet exceeds the import size limit.");
  return parseFile("sheet.csv", Buffer.from(body.bytes));
}

export async function importRows(rows: Row[], dryRun = false) {
  const excluded: { name: string; reason: string }[] = [];
  const errors: string[] = [];
  const createdNames: string[] = [];
  const updatedNames: string[] = [];
  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const name = pick(row, "name");
    if (!name) {
      errors.push("A row without a product name was skipped");
      continue;
    }
    const suppliedCategory = pick(row, "category");
    const categoryName = suppliedCategory ?? "General";
    const description = pick(row, "description");
    const generic = pick(row, "generic");
    const combined = `${name} ${categoryName} ${description ?? ""} ${generic ?? ""}`;
    if (isBlocked(combined)) {
      excluded.push({ name, reason: "controlled or abuse-prone product safety filter" });
      continue;
    }

    const slug = slugify(name, { lower: true, strict: true });
    if (!slug) {
      errors.push(`Could not create a safe URL slug for ${name}`);
      continue;
    }
    const existing = await db.product.findUnique({ where: { slug }, select: { id: true } });
    if (existing) {
      updated++;
      updatedNames.push(name);
    } else {
      created++;
      createdNames.push(name);
    }
    if (dryRun) continue;

    const categorySlug = slugify(categoryName, { lower: true, strict: true });
    const category = suppliedCategory || !existing
      ? await db.category.upsert({
          where: { slug: categorySlug },
          update: {},
          create: { name: categoryName, slug: categorySlug },
        })
      : null;
    const patentRestricted = /mounjaro|tirzepatide/i.test(combined);
    const data = {
      name,
      slug,
      ...(pick(row, "packSize") ? { packSize: pick(row, "packSize") } : {}),
      ...(pick(row, "strength") ? { strength: pick(row, "strength") } : {}),
      ...(generic ? { generic } : {}),
      ...(description ? { description } : {}),
      ...(pick(row, "imageUrl") ? { imageUrl: pick(row, "imageUrl") } : {}),
      ...(patentRestricted ? { patentRestricted: true } : {}),
    };
    if (existing) {
      await db.product.update({ where: { slug }, data: { ...data, ...(category ? { categoryId: category.id } : {}) } });
    } else if (category) {
      await db.product.create({ data: { ...data, description: description ?? `${name} supplied to licensed importers.`, category: { connect: { id: category.id } } } });
    }
  }

  return { created, updated, createdNames, updatedNames, excluded, errors };
}

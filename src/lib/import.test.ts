import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import fs from "node:fs";
import path from "node:path";
import { parseFile, sheetCsvUrl } from "@/lib/import";

describe("product import parsing", () => {
  it("parses CSV and TSV headers and values", async () => {
    await expect(parseFile("catalog.csv", fs.readFileSync(path.join(process.cwd(), "tests/fixtures/catalog.csv")))).resolves.toEqual([{ "Product name": "Sample item", Description: "Trade supply", Unknown: "ignored" }]);
    await expect(parseFile("catalog.tsv", fs.readFileSync(path.join(process.cwd(), "tests/fixtures/catalog.tsv")))).resolves.toEqual([{ name: "Sample item", "pack size": "10 units" }]);
  });

  it("parses JSON product arrays and rejects malformed top-level data", async () => {
    await expect(parseFile("catalog.json", fs.readFileSync(path.join(process.cwd(), "tests/fixtures/catalog.json")))).resolves.toEqual([{ name: "Sample item", description: "" }]);
    await expect(parseFile("catalog.json", Buffer.from("{}"))).rejects.toThrow(/product array/i);
  });

  it("parses XLSX worksheet rows", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Catalog");
    sheet.addRow(["name", "description"]);
    sheet.addRow(["Sample item", "Synthetic test fixture"]);
    const data = await workbook.xlsx.writeBuffer();
    await expect(parseFile("catalog.xlsx", Buffer.from(data))).resolves.toEqual([{ name: "Sample item", description: "Synthetic test fixture" }]);
  });

  it("accepts only HTTPS Google Sheets URLs", () => {
    expect(sheetCsvUrl("https://docs.google.com/spreadsheets/d/abc123/edit#gid=7")).toBe("https://docs.google.com/spreadsheets/d/abc123/export?format=csv&gid=7");
    expect(() => sheetCsvUrl("https://example.com/spreadsheets/d/abc123")).toThrow(/Google Sheets/i);
    expect(() => sheetCsvUrl("http://docs.google.com/spreadsheets/d/abc123")).toThrow(/HTTPS/i);
  });
});

import { describe, expect, it } from "vitest";
import { csvCell } from "@/lib/csv-safe";
import { jsonForHtml } from "@/lib/json-safe";
import { isSafeXlsxArchive, matchesFileExtension, sniffUploadType } from "@/lib/file-signatures";

describe("security-sensitive output and file checks", () => {
  it("neutralizes spreadsheet formulas after leading whitespace", () => {
    expect(csvCell("  =HYPERLINK(\"https://example.invalid\")")).toContain("'  =");
    expect(csvCell("@SUM(1,2)")).toContain("'@");
  });
  it("escapes angle brackets before JSON-LD is embedded in HTML", () => {
    expect(jsonForHtml({ name: "</script><script>alert(1)</script>" })).not.toContain("</script>");
  });
  it("accepts matching binary signatures and rejects extension-only spoofing", () => {
    const pdf = new TextEncoder().encode("%PDF-1.7 test");
    expect(sniffUploadType(pdf)).toBe("application/pdf");
    expect(matchesFileExtension("document.pdf", "application/pdf")).toBe(true);
    expect(matchesFileExtension("payload.exe", "application/pdf")).toBe(false);
    expect(sniffUploadType(new TextEncoder().encode("MZ fake executable"))).toBeNull();
  });
  it("rejects archive content that is not a safe OOXML workbook", () => {
    const zipHeaderOnly = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]);
    expect(sniffUploadType(zipHeaderOnly)).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    expect(isSafeXlsxArchive(zipHeaderOnly)).toBe(false);
  });
});

export type AcceptedUploadType = "image/jpeg" | "image/png" | "image/webp" | "application/pdf" | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" | "text/csv" | "application/json";

export function sniffUploadType(bytes: Uint8Array): AcceptedUploadType | null {
  if (bytes.length >= 2 && bytes[0] === 0x4d && bytes[1] === 0x5a) return null; // DOS/Windows executable header
  if (bytes.length >= 4 && bytes[0] === 0x7f && String.fromCharCode(...bytes.slice(1, 4)) === "ELF") return null;
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)) return "image/png";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  if (bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-") return "application/pdf";
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && [3, 5, 7].includes(bytes[2]) && [4, 6, 8].includes(bytes[3])) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  let text: string;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^\uFEFF/, "").trimStart(); } catch { return null; }
  if (!text || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text)) return null;
  if (text.startsWith("{") || text.startsWith("[")) {
    try { JSON.parse(text); return "application/json"; } catch { return null; }
  }
  return "text/csv";
}

export function matchesFileExtension(filename: string, type: AcceptedUploadType) {
  const ext = filename.split(".").pop()?.toLowerCase();
  return (type === "image/jpeg" && ["jpg", "jpeg"].includes(ext ?? ""))
    || (type === "image/png" && ext === "png")
    || (type === "image/webp" && ext === "webp")
    || (type === "application/pdf" && ext === "pdf")
    || (type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" && ext === "xlsx")
    || (type === "text/csv" && ["csv", "tsv"].includes(ext ?? ""))
    || (type === "application/json" && ext === "json");
}

// Reject oversized or highly compressed XLSX archives before ExcelJS expands them.
export function isSafeXlsxArchive(bytes: Uint8Array, maxExpandedBytes = 20 * 1024 * 1024, maxEntries = 1000) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const signature = (offset: number, value: number) => offset >= 0 && offset + 4 <= bytes.length && view.getUint32(offset, true) === value;
  const earliest = Math.max(0, bytes.length - 65_557);
  let endRecord = -1;
  for (let offset = bytes.length - 22; offset >= earliest; offset--) if (signature(offset, 0x06054b50)) { endRecord = offset; break; }
  if (endRecord < 0 || endRecord + 22 > bytes.length) return false;
  const entryCount = view.getUint16(endRecord + 10, true);
  const centralSize = view.getUint32(endRecord + 12, true);
  const centralOffset = view.getUint32(endRecord + 16, true);
  if (!entryCount || entryCount > maxEntries || centralOffset + centralSize > endRecord) return false;
  let cursor = centralOffset;
  let expandedBytes = 0;
  const names = new Set<string>();
  for (let index = 0; index < entryCount; index++) {
    if (!signature(cursor, 0x02014b50) || cursor + 46 > bytes.length) return false;
    const flags = view.getUint16(cursor + 8, true);
    const expanded = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    if ((flags & 1) !== 0 || expanded === 0xffffffff || cursor + 46 + nameLength + extraLength + commentLength > bytes.length) return false;
    const nameStart = cursor + 46;
    let name: string;
    try { name = new TextDecoder("utf-8", { fatal: true }).decode(bytes.slice(nameStart, nameStart + nameLength)); } catch { return false; }
    if (!name || name.startsWith("/") || name.includes("\\") || name.split("/").includes("..") || /(?:vbaProject\.bin|activeX|embeddings|externalLinks|customUI|oleObjects)/i.test(name)) return false;
    names.add(name);
    expandedBytes += expanded;
    if (expandedBytes > maxExpandedBytes) return false;
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return cursor <= centralOffset + centralSize && names.has("[Content_Types].xml") && names.has("xl/workbook.xml");
}

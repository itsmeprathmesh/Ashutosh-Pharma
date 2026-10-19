"use client";

import { useState, type DragEvent } from "react";
import { upload as uploadBlob } from "@vercel/blob/client";
import { attachUploadedImage } from "@/app/admin/actions";

type Result = { created: number; updated: number; createdNames: string[]; updatedNames: string[]; excluded: { name: string; reason: string }[]; errors: string[] };

export function ImportConsole() {
  const [files, setFiles] = useState<File[]>([]);
  const [sheetUrl, setSheetUrl] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageMessage, setImageMessage] = useState("");
  const [unmatchedImages, setUnmatchedImages] = useState<string[]>([]);

  function takeFiles(incoming: FileList | null) {
    if (incoming) setFiles(Array.from(incoming));
    setResult(null);
    setError("");
  }

  function drag(event: DragEvent<HTMLLabelElement>, over: boolean) {
    event.preventDefault();
    setDragging(over);
  }

  async function upload(dryRun: boolean) {
    setBusy(true);
    setError("");
    try {
      let response: Response;
      if (sheetUrl.trim()) {
        response = await fetch(`/api/admin/import?dryRun=${dryRun ? "1" : "0"}`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sheetUrl }),
        });
      } else {
        const form = new FormData();
        files.forEach((file) => form.append("files", file));
        response = await fetch(`/api/admin/import?dryRun=${dryRun ? "1" : "0"}`, { method: "POST", body: form });
      }
      const body = await response.json() as Result | { error?: string };
      if (!response.ok) throw new Error("error" in body ? body.error : "Import failed.");
      setResult(body as Result);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadImages() {
    setBusy(true);
    setImageMessage("");
    const unmatched: string[] = [];
    try {
      for (const [index, file] of imageFiles.entries()) {
        setImageMessage(`Uploading ${index + 1} of ${imageFiles.length}: ${file.name}`);
        const blob = await uploadBlob(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/blob",
          multipart: file.size > 5 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => setImageMessage(`Uploading ${file.name}: ${Math.round(percentage)}%`),
        });
        const match = await attachUploadedImage(file.name, blob.url);
        if (!match.matched) unmatched.push(file.name);
      }
      setUnmatchedImages(unmatched);
      setImageMessage(`Finished uploading ${imageFiles.length} image${imageFiles.length === 1 ? "" : "s"}.`);
    } catch (issue) {
      setImageMessage(issue instanceof Error ? issue.message : "Image upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="import-console">
    <label className={`drop-zone ${dragging ? "is-dragging" : ""}`} onDragOver={(event) => drag(event, true)} onDragLeave={(event) => drag(event, false)} onDrop={(event) => { drag(event, false); takeFiles(event.dataTransfer.files); }}>
      <input type="file" accept=".csv,.tsv,.json,.xlsx" multiple onChange={(event) => takeFiles(event.target.files)} />
      <strong>Drop product files here or browse</strong><span>CSV, XLSX, or JSON · up to 4 MB per request · {files.length ? `${files.length} selected` : "multiple files supported"}</span>
    </label>
    <div className="import-actions"><button className="button" disabled={busy || (!files.length && !sheetUrl.trim())} onClick={() => upload(true)}>{busy ? "Working…" : "Preview import"}</button><a className="text-link" href="/api/admin/import-template">Download CSV template ↓</a></div>
    <div className="sheet-box"><label htmlFor="sheet-link">Google Sheets link</label><input id="sheet-link" className="field" type="url" placeholder="https://docs.google.com/spreadsheets/d/…" value={sheetUrl} onChange={(event) => { setSheetUrl(event.target.value); setFiles([]); setResult(null); }} /><small>Set sharing to “Anyone with the link can view”. Preview first, then choose Sync now.</small><div className="import-actions"><button className="button button-outline" disabled={busy || !sheetUrl.trim()} onClick={() => upload(true)}>Preview sheet</button></div></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {result && <section className="import-result" aria-live="polite"><h2>{busy ? "Importing…" : "Import preview"}</h2><p>{result.created} to create · {result.updated} to update · {result.excluded.length} excluded · {result.errors.length} errors</p>{result.createdNames.length > 0 && <div><h3>Products to create</h3><ul>{result.createdNames.map((name, i) => <li key={`${name}-${i}`}>{name}</li>)}</ul></div>}{result.updatedNames.length > 0 && <div><h3>Products to update</h3><ul>{result.updatedNames.map((name, i) => <li key={`${name}-${i}`}>{name}</li>)}</ul></div>}{result.excluded.length > 0 && <div><h3>Excluded by safety filter</h3><ul>{result.excluded.map((item, i) => <li key={`${item.name}-${i}`}>{item.name}: {item.reason}</li>)}</ul></div>}{result.errors.length > 0 && <div><h3>Rows needing attention</h3><ul>{result.errors.map((item, i) => <li key={`${item}-${i}`}>{item}</li>)}</ul></div>}{!busy && <button className="button" disabled={busy} onClick={() => upload(false)}>{sheetUrl ? "Sync now" : "Confirm and import"}</button>}</section>}
    <section className="sheet-box"><label htmlFor="product-images">Product images</label><input id="product-images" className="field" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { setImageFiles(Array.from(event.target.files ?? [])); setUnmatchedImages([]); }} /><small>Choose multiple JPEG, PNG, or WebP files. Use each product’s slug as the filename, such as product-name.jpg. Large images upload directly to Blob.</small><div className="import-actions"><button className="button button-outline" disabled={busy || !imageFiles.length} onClick={uploadImages}>{busy ? "Uploading…" : `Upload ${imageFiles.length || ""} image${imageFiles.length === 1 ? "" : "s"}`}</button>{imageMessage && <span role="status">{imageMessage}</span>}</div>{unmatchedImages.length > 0 && <div><strong>Files without a matching product</strong><ul>{unmatchedImages.map((name) => <li key={name}>{name}</li>)}</ul></div>}</section>
  </div>;
}

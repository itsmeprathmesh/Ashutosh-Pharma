"use client";

import { useState } from "react";
import { upload as uploadBlob } from "@vercel/blob/client";
import { setCategoryImage } from "@/app/admin/actions";

export function CategoryImageUpload({ categoryId, categoryName, imageUrl }: { categoryId: number; categoryName: string; imageUrl: string | null }) {
  const [state, setState] = useState("");
  const [busy, setBusy] = useState(false);
  async function uploadFile(file?: File) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024) { setState("Choose a JPEG, PNG or WebP under 5 MB."); return; }
    setBusy(true); setState("Uploading…");
    try {
      const blob = await uploadBlob(`categories/category-${categoryId}-${file.name}`, file, { access: "public", handleUploadUrl: "/api/blob" });
      const result = await setCategoryImage(categoryId, blob.url);
      setState(result.ok ? "Category image saved." : result.error ?? "Could not save this image.");
    } catch { setState("Upload failed. Check the Blob configuration and try again."); }
    finally { setBusy(false); }
  }
  return <div className="category-admin-image">
    {imageUrl && <img src={imageUrl} alt={`${categoryName} category`} loading="lazy" referrerPolicy="no-referrer"/>}
    <label>{imageUrl ? "Replace image" : "Upload category image"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => uploadFile(event.currentTarget.files?.[0])}/></label>
    <small role="status">{state}</small>
  </div>;
}

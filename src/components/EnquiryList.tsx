"use client";

import { useEffect, useState } from "react";

export type EnquiryListItem = { product: string; quantity: string; slug?: string };
const KEY = "ashutosh-enquiry-list";
export function readEnquiryList(): EnquiryListItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as EnquiryListItem[]; } catch { return []; }
}
export function addEnquiryItem(item: EnquiryListItem) {
  const current = readEnquiryList();
  const next = current.some((entry) => entry.product === item.product) ? current : [...current, item];
  localStorage.setItem(KEY, JSON.stringify(next)); window.dispatchEvent(new Event("enquiry-list-change"));
}
function save(items: EnquiryListItem[]) { localStorage.setItem(KEY, JSON.stringify(items)); window.dispatchEvent(new Event("enquiry-list-change")); }

export function EnquiryListDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [items, setItems] = useState<EnquiryListItem[]>([]);
  const [status, setStatus] = useState("");
  useEffect(() => { const update = () => setItems(readEnquiryList()); update(); window.addEventListener("enquiry-list-change", update); return () => window.removeEventListener("enquiry-list-change", update); }, [open]);
  function update(index: number, patch: Partial<EnquiryListItem>) { const next = items.map((item, i) => i === index ? { ...item, ...patch } : item); setItems(next); save(next); }
  async function submit(form: HTMLFormElement) {
    setStatus("Sending…"); const fields = Object.fromEntries(new FormData(form).entries());
    const response = await fetch("/api/enquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fields, items: items.map(({ product, quantity }) => ({ product, quantity })), product: "", quantity: "", country: fields.country || "Not provided" }) });
    if (response.ok) { save([]); setItems([]); setStatus("Enquiry sent. Our team will follow up."); } else { const body = await response.json().catch(() => null); setStatus(body?.error ?? "Unable to send. Please review the details."); }
  }
  return <div className={`drawer-backdrop ${open ? "is-open" : ""}`} aria-hidden={!open} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="enquiry-drawer" role="dialog" aria-modal="true" aria-label="Enquiry list" aria-hidden={!open}>
      <div className="drawer-heading"><div><span className="eyebrow">Trade request</span><h2>Your enquiry list</h2></div><button className="icon-button" onClick={onClose} aria-label="Close enquiry list">×</button></div>
      <p className="form-note">No prices or checkout. Tell us quantities and your destination market.</p>
      <div className="drawer-items">{items.length ? items.map((item, index) => <div className="drawer-item" key={item.product}><strong>{item.product}</strong><label>Required quantity<input className="field" required minLength={1} value={item.quantity} onChange={(event) => update(index, { quantity: event.target.value })} placeholder="e.g. 500 packs" /></label><button type="button" className="remove-button" onClick={() => { const next = items.filter((_, i) => i !== index); setItems(next); save(next); }}>Remove</button></div>) : <div className="empty-state">Your list is empty. Add products from the catalogue to begin.</div>}</div>
      {items.length > 0 && <form className="enquiry-form" onSubmit={(event) => { event.preventDefault(); void submit(event.currentTarget); }}><label>Full name<input className="field" name="name" required minLength={2} /></label><label>Business email<input className="field" name="email" type="email" required /></label><label>Contact number<input className="field" name="phone" type="tel" required /></label><label>Company<input className="field" name="company" /></label><label>Destination country<input className="field" name="country" required /></label><label>Importer licence number (required for prescription products)<input className="field" name="licenceNo" /></label><label>Message<textarea className="field" name="message" rows={3} /></label><button className="button" type="submit">Send enquiry</button><p role="status" className="form-note">{status}</p></form>}
    </aside>
  </div>;
}

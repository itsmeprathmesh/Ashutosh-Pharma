"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, Search } from "lucide-react";

type Suggestion = { name: string; slug: string; rx: boolean; category: { name: string } };

export function QuickQuotePanel() {
  const [medicine, setMedicine] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (medicine.trim().length < 2 || selected?.name === medicine) { setSuggestions([]); return; }
      fetch(`/api/products?q=${encodeURIComponent(medicine)}`)
        .then((response) => response.json())
        .then((data) => setSuggestions(data.products ?? []))
        .catch(() => setSuggestions([]));
    }, 220);
    return () => window.clearTimeout(timer);
  }, [medicine, selected]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending"); setError("");
    const form = event.currentTarget;
    const fields = new FormData(form);
    const payload = {
      name: fields.get("name"),
      email: fields.get("email"),
      country: fields.get("country"),
      product: selected?.name ?? medicine,
      ...(selected ? { productSlug: selected.slug } : {}),
      quantity: fields.get("quantity"),
      licenceNo: fields.get("licenceNo") ?? "",
      website: fields.get("website"),
    };
    try {
      const response = await fetch("/api/enquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) { setError(result?.error ?? "We could not send the enquiry. Please check the details."); setStatus("error"); return; }
      setStatus("done"); form.reset(); setMedicine(""); setSelected(null);
    } catch { setError("We could not send the enquiry. Please try again."); setStatus("error"); }
  }

  if (status === "done") return <aside className="quick-quote-panel quick-quote-success" aria-live="polite"><span className="eyebrow">Enquiry received</span><h2>Thank you.</h2><p>Our team has received your trade enquiry.</p><button className="text-link" onClick={() => setStatus("idle")}>Send another enquiry <ArrowUpRight size={15}/></button></aside>;

  return <aside className="quick-quote-panel" aria-labelledby="quick-quote-title">
    <div className="quick-quote-heading"><span className="eyebrow">Direct trade enquiry</span><h2 id="quick-quote-title">Request a quick quote</h2><p>Share the product and destination. We’ll take it from there.</p></div>
    <form onSubmit={submit} className="quick-quote-form">
      <label className="quick-medicine-field">Medicine<input name="product" value={medicine} onChange={(event) => { setMedicine(event.target.value); setSelected(null); }} placeholder="Search product name" autoComplete="off" required minLength={2} maxLength={200}/><Search size={16} aria-hidden="true"/>
        {suggestions.length > 0 && <div className="quick-suggestions" role="listbox">{suggestions.map((item) => <button type="button" role="option" key={item.slug} onClick={() => { setMedicine(item.name); setSelected(item); setSuggestions([]); }}><span>{item.name}</span><small>{item.category.name}</small></button>)}</div>}
      </label>
      <div className="quick-quote-two"><label>Quantity<input name="quantity" placeholder="e.g. 500 packs" required maxLength={120}/></label><label>Destination country<input name="country" placeholder="Country" required minLength={2} maxLength={100}/></label></div>
      <label>Your name<input name="name" autoComplete="name" placeholder="Full name" required minLength={2} maxLength={120}/></label>
      <label>Business email<input name="email" type="email" autoComplete="email" placeholder="name@company.com" required maxLength={254}/></label>
      {selected?.rx && <label>Importer licence number<input name="licenceNo" required maxLength={160} placeholder="Required for prescription products"/></label>}
      <label className="quick-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
      {error && <p className="quick-quote-error" role="alert">{error}</p>}
      <button className="button button-primary" type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send enquiry"}<ArrowUpRight size={16}/></button>
      <p className="quick-quote-note">For professional buyers. No online checkout.</p>
    </form>
  </aside>;
}

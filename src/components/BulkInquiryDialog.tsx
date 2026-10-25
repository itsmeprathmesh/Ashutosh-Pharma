"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type ProductSuggestion = { name: string; slug: string; rx: boolean; category: { name: string } };
type InquiryRow = { id: number; product: string; quantity: string; slug: string; rx: boolean };

export function BulkInquiryDialog({ onClose }: { onClose: () => void }) {
  const nextId = useRef(1);
  const [rows, setRows] = useState<InquiryRow[]>([{ id: 0, product: "", quantity: "", slug: "", rx: false }]);
  const [licenceNo, setLicenceNo] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const requiresLicence = rows.some((row) => row.rx);

  function updateRow(id: number, patch: Partial<InquiryRow>) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row));
  }

  function addRow() {
    setRows((current) => current.length >= 50 ? current : [...current, { id: nextId.current++, product: "", quantity: "", slug: "", rx: false }]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    if (rows.some((row) => !row.slug)) {
      setMessage("Choose each product from the catalogue suggestions.");
      return;
    }
    if (requiresLicence && !licenceNo.trim()) {
      setMessage("An importer licence number is required for prescription products.");
      return;
    }

    setSending(true);
    setMessage("Sending your enquiry…");
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          product: "",
          quantity: "",
          country: "Not provided",
          items: rows.map(({ product, quantity }) => ({ product, quantity })),
          licenceNo: requiresLicence ? licenceNo.trim() : "",
        }),
      });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) {
        setMessage(result?.error ?? "Unable to send the enquiry. Please try again.");
        setSending(false);
        return;
      }
      setRows([{ id: 0, product: "", quantity: "", slug: "", rx: false }]);
      setLicenceNo("");
      setMessage("Your enquiry has been sent. Our team will follow up.");
      setSending(false);
    } catch {
      setMessage("Unable to reach the enquiry service. Please try again.");
      setSending(false);
    }
  }

  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="bulk-inquiry-dialog" aria-labelledby="bulk-inquiry-title">
      <header className="bulk-inquiry-header">
        <h2 id="bulk-inquiry-title">Bulk Inquiry Request</h2>
        <button className="bulk-inquiry-close" type="button" onClick={onClose} aria-label="Close inquiry form"><X size={19}/></button>
      </header>
      <form className="bulk-inquiry-form" onSubmit={submit}>
        <input className="bulk-inquiry-field" name="name" placeholder="Enter Your Full Name" aria-label="Full name" autoComplete="name" minLength={2} maxLength={120} required/>
        <input className="bulk-inquiry-field" name="email" type="email" placeholder="Enter Your Email Address" aria-label="Email address" autoComplete="email" maxLength={254} required/>
        <input className="bulk-inquiry-field" name="phone" type="tel" placeholder="Enter Your Mobile Number" aria-label="Mobile number" autoComplete="tel" maxLength={50}/>
        <input className="bulk-inquiry-honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"/>

        <div className="bulk-inquiry-products">
          <div className="bulk-inquiry-labels" aria-hidden="true"><span>Product Name <b>*</b></span><span>Quantity Required <b>*</b></span><span/></div>
          {rows.map((row, index) => <div className="bulk-inquiry-row" key={row.id}>
            <ProductSearchInput
              index={index}
              row={row}
              onProductText={(product) => updateRow(row.id, { product, slug: "", rx: false })}
              onSelect={(product) => updateRow(row.id, { product: product.name, slug: product.slug, rx: product.rx })}
            />
            <input className="bulk-inquiry-field" value={row.quantity} onChange={(event) => updateRow(row.id, { quantity: event.target.value })} placeholder="Enter quantity" aria-label={`Quantity required for product ${index + 1}`} maxLength={120} required/>
            {index === rows.length - 1
              ? <button className="bulk-inquiry-add" type="button" onClick={addRow} disabled={rows.length >= 50} aria-label="Add another product"><Plus size={17}/></button>
              : <button className="bulk-inquiry-remove" type="button" onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))} aria-label={`Remove product ${index + 1}`}><X size={16}/></button>}
          </div>)}
        </div>

        {requiresLicence && <label className="bulk-inquiry-licence">Importer licence number <b>*</b><input className="bulk-inquiry-field" value={licenceNo} onChange={(event) => setLicenceNo(event.target.value)} maxLength={160} autoComplete="off" required/></label>}
        <button className="bulk-inquiry-submit" type="submit" disabled={sending}>{sending ? "SENDING…" : "INQUIRY NOW"}</button>
        <p className="bulk-inquiry-status" role="status" aria-live="polite">{message}</p>
      </form>
    </DialogContent>
  </Dialog>;
}

function ProductSearchInput({ index, row, onProductText, onSelect }: {
  index: number;
  row: InquiryRow;
  onProductText: (value: string) => void;
  onSelect: (product: ProductSuggestion) => void;
}) {
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = `bulk-inquiry-suggestions-${index}`;

  useEffect(() => {
    if (row.product.trim().length < 2 || row.slug) {
      setSuggestions([]);
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      fetch(`/api/products?q=${encodeURIComponent(row.product.trim())}`)
        .then((response) => response.json())
        .then((data: { products?: ProductSuggestion[] }) => {
          if (active) {
            setSuggestions(data.products ?? []);
            setActiveIndex(0);
            setOpen(true);
          }
        })
        .catch(() => { if (active) setSuggestions([]); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [row.product, row.slug]);

  return <div className="bulk-inquiry-search">
    <input
      className="bulk-inquiry-field"
      value={row.product}
      onChange={(event) => { onProductText(event.target.value); setOpen(true); }}
      onFocus={() => { if (suggestions.length) setOpen(true); }}
      onBlur={() => window.setTimeout(() => setOpen(false), 120)}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown" && suggestions.length) {
          event.preventDefault();
          setOpen(true);
          setActiveIndex((current) => (current + 1) % suggestions.length);
        } else if (event.key === "ArrowUp" && suggestions.length) {
          event.preventDefault();
          setActiveIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
        } else if (event.key === "Enter" && open && suggestions[activeIndex]) {
          event.preventDefault();
          onSelect(suggestions[activeIndex]);
          setSuggestions([]);
          setOpen(false);
        } else if (event.key === "Escape") {
          setOpen(false);
        }
      }}
      placeholder="Enter product name"
      aria-label={`Product name ${index + 1}`}
      role="combobox"
      aria-controls={listId}
      aria-autocomplete="list"
      aria-expanded={open && suggestions.length > 0}
      aria-activedescendant={open && suggestions.length ? `bulk-inquiry-option-${index}-${activeIndex}` : undefined}
      autoComplete="off"
      maxLength={200}
      required
    />
    {open && suggestions.length > 0 && <div className="bulk-inquiry-suggestions" id={listId} role="listbox" aria-label="Product suggestions">
      {suggestions.map((product, optionIndex) => <button type="button" role="option" id={`bulk-inquiry-option-${index}-${optionIndex}`} aria-selected={activeIndex === optionIndex} key={product.slug} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActiveIndex(optionIndex)} onClick={() => { onSelect(product); setSuggestions([]); setOpen(false); }}>
        <span>{product.name}</span><small>{product.category.name}{product.rx ? " · Prescription" : ""}</small>
      </button>)}
    </div>}
  </div>;
}

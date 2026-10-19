"use client";

import { useState, type FormEvent } from "react";

type EnquiryFormProps = {
  product?: string;
  productSlug?: string;
  requiresLicence?: boolean;
  general?: boolean;
};

export function EnquiryForm({ product = "", productSlug = "", requiresLicence = true, general = false }: EnquiryFormProps) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    const form = event.currentTarget;
      const values = { ...Object.fromEntries(new FormData(form).entries()), ...(general ? { country: "Not provided", product: "General contact enquiry", quantity: "Not specified", general: true } : {}) };
    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      setState(response.ok ? "done" : "error");
      if (response.ok) form.reset();
    } catch {
      setState("error");
    }
  }

  if (state === "done") return <p role="status" className="form-success">Thank you. Your enquiry has been received.</p>;

  return (
    <form className="enquiry-form" onSubmit={submit}>
      <label>{general ? "Name" : "Full name"}<input className="field" name="name" autoComplete="name" minLength={2} required /></label>
      {!general && <label>Company<input className="field" name="company" autoComplete="organization" /></label>}
      <label>{general ? "Email" : "Business email"}<input className="field" name="email" type="email" autoComplete="email" required /></label>
      <label>{general ? "Phone" : "Phone / WhatsApp"}<input className="field" name="phone" autoComplete="tel" required={general} /></label>
      {!general && <><label>Destination country<input className="field" name="country" autoComplete="country-name" minLength={2} required /></label><label>Product<input className="field" name="product" defaultValue={product} minLength={2} required /></label></>}
      <input type="hidden" name="productSlug" value={productSlug} />
      {!general && <><label>Quantity / pack requirement<input className="field" name="quantity" required /></label><label>Importer licence number{requiresLicence ? " (required for Rx products)" : ""}<input className="field" name="licenceNo" required={requiresLicence} /></label></>}
      <label>Message<textarea className="field" name="message" rows={4} required={general} /></label>
      <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <button className="button" type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send enquiry"}</button>
      {state === "error" && <p role="alert" className="form-error">We could not send this enquiry. Please check the details and try again.</p>}
      <p className="form-note">For trade enquiries only. Please do not include patient information.</p>
    </form>
  );
}

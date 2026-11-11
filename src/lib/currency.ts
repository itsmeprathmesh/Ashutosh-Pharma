export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

export function getPricePresentation(input: { globalEnabled: boolean; productEnabled: boolean; priceInr: unknown; priceUnit?: string | null }) {
  const amount = Number(input.priceInr);
  if (!input.globalEnabled || !input.productEnabled || !Number.isFinite(amount) || amount <= 0) return null;
  const unit = input.priceUnit?.trim() ? ` / ${input.priceUnit.trim()}` : "";
  return { inr: `${formatMoney(amount)}${unit}` };
}

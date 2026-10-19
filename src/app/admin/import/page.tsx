import { ImportConsole } from "@/components/ImportConsole";

export const metadata = { title: "Product import" };

export default function ImportPage() {
  return <main className="admin-main"><div className="admin-heading"><div><span className="eyebrow">Admin</span><h1>Import products</h1></div></div><p className="import-intro">Preview every import before saving it. The shared safety filter excludes known controlled and abuse-prone products, but no keyword filter is complete. Review the excluded list and scan the product preview before confirming.</p><ImportConsole/></main>;
}

import { db } from "@/lib/db";
import { deleteProduct, saveProduct } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ q?: string; error?: string; saved?: string; deleted?: string }> };

export default async function AdminProducts({ searchParams }: PageProps) {
  const params = await searchParams;
  const products = await db.product.findMany({
    where: params.q ? { name: { contains: params.q, mode: "insensitive" } } : undefined,
    include: { category: true }, orderBy: { name: "asc" }, take: 250,
  });
  const message = params.error === "blocked" ? "This product matches the controlled-product safety filter and was not saved." : params.error === "invalid" ? "Check the product fields and try again." : params.saved ? "Product saved." : params.deleted ? "Product deleted." : "";

  return <main className="admin-main"><div className="admin-heading"><div><span className="eyebrow">Admin</span><h1>Products</h1></div></div>{message && <p role="status" className={params.error ? "form-error" : "form-success"}>{message}</p>}<form className="catalog-toolbar" action="/admin/products"><input className="field" name="q" defaultValue={params.q} placeholder="Search products"/><button className="button" type="submit">Search</button></form><details className="admin-editor"><summary>Add product</summary><form action={saveProduct} className="admin-form"><ProductFields/><button className="button" type="submit">Create product</button></form></details><div className="admin-product-list">{products.map((product) => <details className="admin-editor" key={product.id}><summary>{product.name} <small>· {product.category.name} · {product.published ? "Published" : "Unpublished"}</small></summary><form action={saveProduct} className="admin-form"><input type="hidden" name="id" value={product.id}/><ProductFields product={product}/><button className="button" type="submit">Save changes</button></form><form action={deleteProduct} className="delete-form"><input type="hidden" name="id" value={product.id}/><button className="delete-button" type="submit">Delete product</button></form></details>)}</div></main>;
}

function ProductFields({ product }: { product?: { name: string; category: { name: string }; generic: string | null; strength: string | null; packSize: string | null; description: string; imageUrl: string | null; rx: boolean; patentRestricted: boolean; published: boolean } }) {
  return <><label>Product name<input className="field" name="name" defaultValue={product?.name} required minLength={2}/></label><label>Category<input className="field" name="category" defaultValue={product?.category.name} required minLength={2}/></label><label>Generic name<input className="field" name="generic" defaultValue={product?.generic ?? ""}/></label><label>Strength<input className="field" name="strength" defaultValue={product?.strength ?? ""}/></label><label>Pack size<input className="field" name="packSize" defaultValue={product?.packSize ?? ""}/></label><label>Description<textarea className="field" name="description" defaultValue={product?.description} required minLength={5} rows={4}/></label><label>Image URL<input className="field" name="imageUrl" type="url" defaultValue={product?.imageUrl ?? ""}/></label><div className="checkbox-row"><label><input type="checkbox" name="rx" defaultChecked={product?.rx ?? true}/> Prescription (Rx)</label><label><input type="checkbox" name="patentRestricted" defaultChecked={product?.patentRestricted}/> Patent restricted</label><label><input type="checkbox" name="published" defaultChecked={product?.published ?? false}/> Published</label></div></>;
}

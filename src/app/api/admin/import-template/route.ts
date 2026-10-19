export async function GET() {
  const csv = [
    "name,category,packSize,strength,generic,description,imageUrl",
    '"Example product A","Tablets","Replace with verified pack size","Replace with verified strength","Replace with generic","Replace with client-approved description",""',
    '"Example product B","Capsules","Replace with verified pack size","Replace with verified strength","Replace with generic","Replace with client-approved description",""',
  ].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=ashutosh-product-import-template.csv",
      "Cache-Control": "no-store",
    },
  });
}

import { LegalPlaceholder } from "@/components/LegalPlaceholder";

export const metadata = { title: "Returns information", description: "Draft returns information for professional customers, pending client and legal review.", alternates: { canonical: "/returns" } };

export default function ReturnsPage() {
  return <LegalPlaceholder title="Returns and order enquiries" purpose="Client-approved order and returns policy" />;
}

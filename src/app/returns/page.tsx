import { LegalPlaceholder } from "@/components/LegalPlaceholder";

export const metadata = { title: "Returns information", description: "Information about returns for separately agreed business transactions.", alternates: { canonical: "/returns" } };

export default function ReturnsPage() {
  return <LegalPlaceholder title="Returns and order enquiries" purpose="Returns information for business transactions" />;
}

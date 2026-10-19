import { LegalPlaceholder } from "@/components/LegalPlaceholder";

export const metadata = { title: "Website terms", description: "Draft business terms for professional pharmaceutical trade enquiries. Client and legal review is required before publication.", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return <LegalPlaceholder title="Terms of use" purpose="Website and trade enquiry terms" />;
}

import { LegalPlaceholder } from "@/components/LegalPlaceholder";

export const metadata = { title: "Privacy information", description: "Draft privacy information for visitors submitting professional trade enquiries. Client and legal review is required.", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return <LegalPlaceholder title="Privacy policy" purpose="How enquiry information is handled" />;
}

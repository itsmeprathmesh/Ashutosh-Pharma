import { LegalPlaceholder } from "@/components/LegalPlaceholder";

export const metadata = { title: "Privacy information", description: "How Ashutosh Pharma handles information submitted through trade enquiry forms.", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return <LegalPlaceholder title="Privacy policy" purpose="How enquiry information is handled" />;
}

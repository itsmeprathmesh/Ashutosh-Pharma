type LegalPlaceholderProps = { title: string; purpose: string };

export function LegalPlaceholder({ title, purpose }: LegalPlaceholderProps) {
  return (
    <main id="main-content">
      <section className="page-hero"><div className="container"><span className="eyebrow">Information</span><h1>{title}</h1><p>TODO: This draft is a placeholder and must be reviewed and completed by the client’s legal adviser before publication.</p></div></section>
      <section className="content-section"><div className="container prose-block"><h2>{purpose}</h2><p>This page is not legal advice and does not describe a final company policy. The final text should explain the company’s actual practices, applicable terms, and contact details in language reviewed for the markets in which the website operates.</p><p>TODO: Add verified business details, effective date, contact information, and client-approved policy language.</p></div></section>
    </main>
  );
}

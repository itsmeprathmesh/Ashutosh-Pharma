import type { Metadata } from "next";
import { EnquiryForm } from "@/components/EnquiryForm";

export const metadata: Metadata = {
  title: "Consultas comerciais no Brasil",
  description: "Entre em contato com a Ashutosh Pharma para uma consulta comercial de produtos farmacêuticos no Brasil.",
  alternates: { canonical: "/pt-br/export/brazil", languages: { "en-US": "/export/brazil", "pt-BR": "/pt-br/export/brazil" } },
};

export default function BrazilPortuguesePage() {
  return <main id="main-content"><section className="page-hero"><div className="container"><span className="eyebrow">Consultas comerciais <span aria-hidden="true">/</span> Brasil</span><h1>Converse com nossa equipe<br/><em>sobre sua necessidade.</em></h1><p>Atendemos consultas comerciais de importadores e compradores institucionais. Disponibilidade, documentação e requisitos de importação são avaliados caso a caso.</p></div></section><section className="content-section"><div className="container country-layout"><div className="prose-block country-copy"><span className="eyebrow">Antes de enviar</span><h2>Informe o produto e o destino.</h2><p>Inclua o nome do produto, a quantidade desejada, o país de destino e seus dados comerciais. Nossa equipe entrará em contato para conversar sobre a consulta.</p><p>O importador deve confirmar as autorizações e os requisitos locais com profissionais qualificados e autoridades competentes. O envio de uma consulta não confirma disponibilidade nem constitui um pedido.</p></div><section className="enquiry-panel"><span className="eyebrow">Compradores profissionais</span><h2>Solicitar uma cotação</h2><EnquiryForm/></section></div></section></main>;
}

import type { Metadata } from "next";
import { EnquiryForm } from "@/components/EnquiryForm";

export const metadata: Metadata = {
  title: "Consultas comerciais no Brasil",
  description: "Página preliminar para consultas de importadores licenciados no Brasil. Requer revisão regulatória antes da publicação.",
  alternates: {
    canonical: "/pt-br/export/brazil",
    languages: { "en-US": "/export/brazil", "pt-BR": "/pt-br/export/brazil" },
  },
};

export default function BrazilPortuguesePage() {
  return <main><section className="page-hero"><div className="container"><span className="eyebrow">Página preliminar · Brasil</span><h1>Consultas comerciais para importadores licenciados</h1><p>TODO: revisar esta página em português com um profissional qualificado e confirmar todas as informações sobre requisitos, documentos e fornecimento antes da publicação.</p></div></section><section className="content-section"><div className="container country-layout"><div className="prose-block"><h2>Informações sobre o destino</h2><p>TODO: adicionar conteúdo original e específico para o Brasil após revisão do cliente e de um profissional regulatório. Não afirmar aprovações, registros, certificações ou prazos sem documentação confirmada.</p><p>As exigências devem ser verificadas com a autoridade competente e com assessoria local antes de qualquer pedido.</p></div><section className="enquiry-panel"><h2>Solicitar uma cotação comercial</h2><p>Para importadores e compradores institucionais licenciados.</p><EnquiryForm /></section></div></section></main>;
}

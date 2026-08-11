import { getSiteUrl } from "@/config/env";
import { siteConfig } from "@/config/site";
import { marketingFaqs } from "@/content/marketing-faq";

/**
 * Truthful Organization + WebSite + FAQPage JSON-LD.
 * No AggregateRating, review counts, offers, or invented NAP.
 */
export function SiteJsonLd() {
  const base = getSiteUrl().replace(/\/$/, "");

  const graph = [
    {
      "@type": "Organization",
      "@id": `${base}/#organization`,
      name: siteConfig.name,
      url: base,
      logo: `${base}/brand/maidlinx-logo.png`,
      email: "support@maidlinx.com",
      description: siteConfig.description,
      areaServed: [
        { "@type": "AdministrativeArea", name: "Toronto / Greater Toronto Area" },
        { "@type": "AdministrativeArea", name: "South Florida" },
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${base}/#website`,
      url: base,
      name: siteConfig.name,
      description: siteConfig.description,
      publisher: { "@id": `${base}/#organization` },
      inLanguage: "en-US",
    },
    {
      "@type": "FAQPage",
      "@id": `${base}/#faq`,
      mainEntity: marketingFaqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ];

  const payload = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}

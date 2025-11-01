import Script from 'next/script'

export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Palani Pathayathirai",
    "description": "Devotional tracking platform for Palani temple pilgrimage journeys and spiritual activities",
    "url": "https://palani-pathayathirai.com",
    "applicationCategory": "ProductivityApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Palani Team",
      "logo": {
        "@type": "ImageObject",
        "url": "https://palani-pathayathirai.com/logo.png"
      }
    },
    "about": {
      "@type": "Thing",
      "name": "Devotional Tracking",
      "description": "Spiritual journey tracking and temple management system"
    }
  }

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
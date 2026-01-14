import type { Metadata } from 'next';

export const siteConfig = {
  name: "Palani Padayathirai",
  description: "Complete pilgrimage management platform for Lord Murugan devotees. Track your sacred journey, participate in annadhanam, connect with fellow pilgrims, and experience the blessed path to enlightenment.",
  url: "https://palani-Padayathirai.com",
  ogImage: "/og-image.png",
  logo: "/logonobg .png",
  favicon: "/favicon.ico",
  keywords: [
    "palani Padayathirai",
    "lord murugan",
    "pilgrimage tracking",
    "devotional app",
    "temple management",
    "annadhanam",
    "pathayathirai",
    "palani malai",
    "murugan devotees",
    "spiritual journey",
    "temple services",
    "devotee tracking",
    "pilgrimage management",
    "tamil temples",
    "hindu pilgrimage",
    "sacred journey",
    "temple activities",
    "devotional platform",
    "spiritual community"
  ],
  authors: [
    {
      name: "Palani Padayathirai Development Team",
      url: "https://palani-Padayathirai.com/team",
    },
  ],
  creator: "Palani Padayathirai Team",
  publisher: "Palani Padayathirai Organization",
  contact: {
    email: "support@palani-Padayathirai.com",
    phone: "+91-XXXX-XXXXXX",
    address: "Palani Malai, Palani, Tamil Nadu 624601, India"
  },
  social: {
    twitter: "@PalaniPathayathirai",
    facebook: "https://facebook.com/palaniPadayathirai",
    instagram: "https://instagram.com/palaniPadayathirai",
    youtube: "https://youtube.com/@palaniPadayathirai"
  },
  geo: {
    latitude: "10.4530",
    longitude: "77.5200",
    region: "IN-TN",
    placename: "Palani, Tamil Nadu, India"
  }
};

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  keywords?: string[];
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  authors?: string[];
  section?: string;
  tags?: string[];
}

export function generateSEO({
  title,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  url = siteConfig.url,
  keywords = [],
  type = 'website',
  publishedTime,
  authors,
  section,
  tags,
}: SEOProps = {}): Metadata {
  const seoTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name;
  const seoDescription = description || siteConfig.description;
  const seoImage = image.startsWith('/') ? `${siteConfig.url}${image}` : image;
  const seoUrl = url.startsWith('/') ? `${siteConfig.url}${url}` : url;
  const allKeywords = [...siteConfig.keywords, ...keywords];

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: allKeywords,
    authors: siteConfig.authors,
    creator: siteConfig.creator,
    publisher: siteConfig.publisher,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: url,
    },
    openGraph: {
      type,
      locale: 'en_IN',
      url: seoUrl,
      siteName: siteConfig.name,
      title: seoTitle,
      description: seoDescription,
      images: [
        {
          url: seoImage,
          width: 1200,
          height: 630,
          alt: seoTitle,
          type: 'image/png',
        },
      ],
      ...(type === 'article' && {
        publishedTime,
        authors: authors || [siteConfig.creator],
        section,
        tags,
      }),
    },
    twitter: {
      card: 'summary_large_image',
      site: siteConfig.social.twitter,
      creator: siteConfig.social.twitter,
      title: seoTitle,
      description: seoDescription,
      images: [seoImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: [
        { url: '/favicon.ico' },
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      ],
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
      shortcut: '/favicon.ico',
    },
    manifest: '/manifest.json',
  };
}

// Page-specific SEO configurations
export const pagesSEO = {
  home: generateSEO({
    title: "Sacred Journey to Lord Murugan",
    description: "Welcome to Palani Padayathirai - Your divine companion for the sacred pilgrimage to Palani Malai. Join thousands of devotees in their blessed journey.",
    keywords: ["welcome", "home", "sacred journey", "divine pilgrimage"],
  }),
  
  admin: generateSEO({
    title: "Admin Dashboard",
    description: "Administrative panel for managing Palani Padayathirai platform. Manage devotees, track pilgrimages, oversee temple activities and services.",
    keywords: ["admin", "dashboard", "management", "control panel"],
    url: "/admin",
  }),
  
  login: generateSEO({
    title: "Admin Login",
    description: "Secure login portal for Palani Padayathirai administrators. Access the management dashboard to oversee devotional services.",
    keywords: ["login", "authentication", "admin access", "secure portal"],
    url: "/admin/login",
  }),
  
  tracking: generateSEO({
    title: "Live Pilgrim Tracking",
    description: "Real-time tracking of devotees on their sacred journey to Palani Malai. Monitor pilgrimage progress and ensure safety.",
    keywords: ["tracking", "live location", "pilgrim safety", "journey monitoring"],
    url: "/admin/tracking",
  }),
  
  users: generateSEO({
    title: "Devotee Management",
    description: "Manage registered devotees, their profiles, pilgrimage history, and spiritual journey progress in the Palani Padayathirai platform.",
    keywords: ["devotee management", "user profiles", "pilgrimage history"],
    url: "/admin/users",
  }),
  
  temples: generateSEO({
    title: "Temple Management",
    description: "Comprehensive management of temples, their services, facilities, and activities along the Palani Padayathirai route.",
    keywords: ["temple management", "religious facilities", "temple services"],
    url: "/admin/temples",
  }),
  
  annadhanam: generateSEO({
    title: "Annadhanam Services",
    description: "Manage free food distribution services (Annadhanam) for pilgrims. Coordinate meal preparation, distribution points, and volunteer activities.",
    keywords: ["annadhanam", "free food", "meal distribution", "pilgrim services"],
    url: "/admin/annadhanam",
  }),
};

// Generate structured data for religious organization
export function generateReligiousOrganizationLD() {
  return {
    "@context": "https://schema.org",
    "@type": "ReligiousOrganization",
    "name": siteConfig.name,
    "alternateName": "Palani Pathayathirai",
    "description": siteConfig.description,
    "url": siteConfig.url,
    "logo": `${siteConfig.url}${siteConfig.logo}`,
    "image": `${siteConfig.url}${siteConfig.ogImage}`,
    "sameAs": [
      siteConfig.social.facebook,
      siteConfig.social.instagram,
      siteConfig.social.youtube
    ],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Palani Malai",
      "addressLocality": "Palani",
      "addressRegion": "Tamil Nadu",
      "postalCode": "624601",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": siteConfig.geo.latitude,
      "longitude": siteConfig.geo.longitude
    },
    "telephone": siteConfig.contact.phone,
    "email": siteConfig.contact.email
  };
}

// Generate breadcrumb structured data
export function generateBreadcrumbLD(items: Array<{name: string, item: string}>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.item.startsWith('/') ? `${siteConfig.url}${item.item}` : item.item
    }))
  };
}
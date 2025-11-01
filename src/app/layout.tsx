import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StructuredData from "@/components/StructuredData";
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './mantine.css';
import { getBaseUrl } from '@/lib/url-utils';

// Get the base URL for metadata
const baseUrl = getBaseUrl();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6366F1' },
    { media: '(prefers-color-scheme: dark)', color: '#8B5CF6' },
  ],
}

export const metadata: Metadata = {
  title: {
    default: "Palani Pathaiyathirai - Divine Journey Tracking & Management System",
    template: "%s | Palani Pathaiyathirai - Sacred Pilgrimage Platform"
  },
  description: "Experience the divine journey with Palani Pathaiyathirai - Complete pilgrimage management system for devotees of Lord Murugan. Track your sacred journey, connect with fellow devotees, manage temple visits, annadhanam services, and spiritual activities. Join thousands of devotees in their blessed Pathayathirai to Palani Malai.",
  keywords: [
    "palani pathaiyathirai", "lord murugan", "pilgrimage tracking", "devotional app", 
    "temple management", "annadhanam", "pathayathirai", "palani malai", "murugan devotees",
    "spiritual journey", "temple services", "devotee tracking", "pilgrimage management",
    "tamil temples", "hindu pilgrimage", "sacred journey", "temple activities",
    "devotional platform", "spiritual community", "temple administration"
  ],
  authors: [{ name: "Palani Pathaiyathirai Development Team" }],
  creator: "Palani Pathaiyathirai Team",
  publisher: "Palani Pathaiyathirai Organization",
  category: "Religion & Spirituality",
  classification: "Devotional Management Platform",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // Open Graph tags
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: baseUrl,
    siteName: 'Palani Pathaiyathirai - Divine Journey Platform',
    title: 'Palani Pathaiyathirai - Sacred Pilgrimage Management & Devotee Tracking System',
    description: 'Join the divine Pathaiyathirai to Palani Malai! Complete pilgrimage management platform for Lord Murugan devotees. Track your sacred journey, participate in annadhanam, connect with fellow pilgrims, and experience the blessed path to enlightenment.',
    images: [
      {
        url: '/opengraph-image.png',
        width: 928,
        height: 1120,
        alt: 'Palani Pathaiyathirai - Sacred Journey to Lord Murugan Temple',
        type: 'image/png',
      }
    ],
    countryName: 'India',
    emails: ['nandha03tamil@gmail.com'],
    phoneNumbers: ['+91-8754949307'],
  },
  // Twitter/X tags
  twitter: {
    card: 'summary_large_image',
    site: '@PalaniPathayathirai',
    creator: '@PalaniDevTeam',
    title: 'Palani Pathaiyathirai - Sacred Pilgrimage Management System',
    description: 'Experience the divine journey to Palani Malai! Complete devotional platform for Lord Murugan pilgrims. Track your sacred path, join annadhanam services, and connect with fellow devotees. #PalaniPathaiyathirai #LordMurugan #SacredJourney',
    images: ['/opengraph-image.png'],
  },
  // Additional meta tags
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: '/',
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
  appleWebApp: {
    capable: true,
    title: "Palani Pathayathirai",
    statusBarStyle: "default",
  },

  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <StructuredData />
        {/* Additional SEO Meta Tags */}
        <meta name="application-name" content="Palani Pathaiyathirai" />
        <meta name="apple-mobile-web-app-title" content="Palani Pathaiyathirai" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#6366F1" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Geo Meta Tags */}
        <meta name="geo.region" content="IN-TN" />
        <meta name="geo.placename" content="Palani, Tamil Nadu, India" />
        <meta name="geo.position" content="10.4530;77.5200" />
        <meta name="ICBM" content="10.4530, 77.5200" />
        
        {/* Religious/Cultural Meta Tags */}
        <meta name="subject" content="Hindu Pilgrimage and Devotional Services" />
        <meta name="topic" content="Lord Murugan Devotional Platform" />
        <meta name="summary" content="Complete pilgrimage management system for Palani Pathaiyathirai devotees" />
        
        {/* Additional Open Graph Tags */}
        <meta property="og:street-address" content="Palani Malai" />
        <meta property="og:locality" content="Palani" />
        <meta property="og:region" content="Tamil Nadu" />
        <meta property="og:postal-code" content="624601" />
        <meta property="og:country-name" content="India" />
        
        {/* Ensure OG image is properly loaded */}
        <meta property="og:image:secure_url" content={`${baseUrl}/opengraph-image.png`} />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="928" />
        <meta property="og:image:height" content="1120" />
        <meta property="og:image:alt" content="Palani Pathaiyathirai - Sacred Journey to Lord Murugan Temple" />
        
        {/* Schema.org JSON-LD for Religious Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ReligiousOrganization",
              "name": "Palani Pathaiyathirai",
              "alternateName": "Palani Pathayathirai",
              "description": "Sacred pilgrimage management platform for Lord Murugan devotees",
              "url": baseUrl,
              "logo": `${baseUrl}/logonobg.png`,
              "image": `${baseUrl}/opengraph-image.png`,
              "sameAs": [
                "https://facebook.com/palanipathaiyathirai",
                "https://instagram.com/palanipathaiyathirai",
                "https://twitter.com/PalaniPathayathirai"
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
                "latitude": "10.4530",
                "longitude": "77.5200"
              },
              "telephone": "+91-XXXX-XXXXXX",
              "email": "support@palani-pathaiyathirai.com"
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        cz-shortcut-listen="true"
      >
        <MantineProvider>
          <Notifications position="top-right" zIndex={9999} />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}

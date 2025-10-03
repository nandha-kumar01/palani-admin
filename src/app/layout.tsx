import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StructuredData from "@/components/StructuredData";

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
    default: "Palani Pathayathirai - Admin Panel",
    template: "%s | Palani Pathayathirai"
  },
  description: "Admin panel for managing Palani Pathayathirai devotional tracking app. Manage devotees, track pilgrimage journeys, and oversee temple activities.",
  keywords: ["palani", "pathayathirai", "admin", "devotional", "tracking", "temple", "pilgrimage", "murugan", "devotees"],
  authors: [{ name: "Palani Team" }],
  creator: "Palani Team",
  publisher: "Palani Team",
  category: "Productivity",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // Open Graph tags
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://palani-pathayathirai.com',
    siteName: 'Palani Pathayathirai',
    title: 'Palani Pathayathirai - Admin Panel',
    description: 'Admin panel for managing Palani Pathayathirai devotional tracking app. Manage devotees, track pilgrimage journeys, and oversee temple activities.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Palani Pathayathirai - Devotional Tracking Platform',
        type: 'image/png',
      },
      {
        url: '/logo.png',
        width: 800,
        height: 600,
        alt: 'Palani Pathayathirai Logo',
        type: 'image/png',
      }
    ],
  },
  // Twitter/X tags
  twitter: {
    card: 'summary_large_image',
    site: '@palani_official',
    creator: '@palani_team',
    title: 'Palani Pathayathirai - Admin Panel',
    description: 'Admin panel for managing Palani Pathayathirai devotional tracking app. Manage devotees, track pilgrimage journeys, and oversee temple activities.',
    images: ['/og-image.png'],
  },
  // Additional meta tags
  metadataBase: new URL('https://palani-pathayathirai.com'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: false, // Admin panel should not be indexed
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
  appleWebApp: {
    capable: true,
    title: "Palani Admin",
    statusBarStyle: "default",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/logo.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/logo.png', sizes: '180x180', type: 'image/png' },
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
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        cz-shortcut-listen="true"
      >
        {children}
      </body>
    </html>
  );
}

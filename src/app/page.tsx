import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Palani Padayathirai - Sacred Journey to Lord Murugan',
  description: 'Welcome to Palani Padayathirai - Your divine companion for the sacred pilgrimage to Palani Malai. Join thousands of devotees in their blessed journey to Lord Murugan. Track your pilgrimage, participate in annadhanam, and experience spiritual transformation.',
  keywords: [
    'palani Padayathirai welcome', 'lord murugan pilgrimage', 'palani malai journey',
    'devotional platform', 'sacred pilgrimage tracker', 'murugan devotees community',
    'pathayathirai registration', 'pilgrimage management', 'temple services'
  ],
  openGraph: {
    title: 'Welcome to Palani Padayathirai - Sacred Journey Begins Here',
    description: 'Start your divine journey to Palani Malai with our comprehensive pilgrimage platform. Connect with fellow devotees, track your sacred path, and experience the blessings of Lord Murugan.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Palani Padayathirai Welcome - Begin Your Sacred Journey'
      }
    ],
  },
  twitter: {
    title: 'Palani Padayathirai - Your Sacred Journey Starts Here',
    description: 'Welcome to the divine platform for Lord Murugan devotees. Begin your blessed Padayathirai to Palani Malai today! #PalaniPadayathirai #LordMurugan',
  },
};

export default function Page() {
  redirect('/admin/login');
}

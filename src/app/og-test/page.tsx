import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OG Image Test - Palani Pathayathirai',
  description: 'Testing the Open Graph image generation',
  openGraph: {
    title: 'OG Image Test - Palani Pathayathirai',
    description: 'Testing the Open Graph image generation',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Palani Pathayathirai OG Image Test',
      },
    ],
  },
};

export default function OGTestPage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>OG Image Test Page</h1>
      <p>This page is for testing the Open Graph image.</p>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>OG Image Preview:</h2>
        <img 
          src="/opengraph-image.png" 
          alt="OG Image Preview" 
          style={{ 
            maxWidth: '600px', 
            height: 'auto', 
            border: '1px solid #ccc',
            borderRadius: '8px'
          }} 
        />
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <h3>Test Links:</h3>
        <ul>
          <li><a href="/opengraph-image.png" target="_blank">Direct OG Image Link</a></li>
          <li><a href="https://www.opengraph.xyz/" target="_blank">Test with OpenGraph.xyz</a></li>
          <li><a href="https://developers.facebook.com/tools/debug/" target="_blank">Facebook Sharing Debugger</a></li>
          <li><a href="https://cards-dev.twitter.com/validator" target="_blank">Twitter Card Validator</a></li>
        </ul>
      </div>
    </div>
  );
}
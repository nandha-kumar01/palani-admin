import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
export const alt = 'Palani Pathayathirai - Sacred Pilgrimage Management Platform'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  try {
    // For edge runtime, we need to fetch the image from the public directory
    const logoUrl = process.env.NODE_ENV === 'production' 
      ? 'https://palani-pathayathirai.com/logobg.png'
      : 'http://localhost:3000/logobg.png';
    
    const logoResponse = await fetch(logoUrl);
    const logoArrayBuffer = await logoResponse.arrayBuffer();
    
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
          }}
        >
          <img
            // eslint-disable-next-line @next/next/no-img-element
            src={`data:image/png;base64,${Buffer.from(logoArrayBuffer).toString('base64')}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
            alt="Palani Pathayathirai Logo"
          />
        </div>
      ),
      {
        ...size,
      }
    )
  } catch (error) {
    console.error('Error loading logo for OG image:', error);
    
    // Fallback with just text if logo fails to load
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #FF6B35 0%, #FFA726 100%)',
            color: 'white',
            fontFamily: 'system-ui',
          }}
        >
          <div style={{ fontSize: 72, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>
            Palani Pathayathirai
          </div>
          <div style={{ fontSize: 36, textAlign: 'center', opacity: 0.9 }}>
            Sacred Pilgrimage Platform
          </div>
        </div>
      ),
      { ...size }
    )
  }
}
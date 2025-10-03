import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
export const alt = 'Palani Pathayathirai - Devotional Tracking Platform'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'
 
export default async function Image() {
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
        }}
      >
        <div style={{ fontSize: 120, marginBottom: 30 }}>🛕</div>
        <div
          style={{
            fontSize: 60,
            fontWeight: 'bold',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          Palani Pathayathirai
        </div>
        <div
          style={{
            fontSize: 30,
            textAlign: 'center',
            opacity: 0.9,
          }}
        >
          Devotional Tracking Platform
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
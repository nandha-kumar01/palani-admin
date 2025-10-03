'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    // Redirect to admin login after mounting
    const timer = setTimeout(() => {
      router.push('/admin/login');
    }, 100);
    
    return () => clearTimeout(timer);
  }, [router]);
  
  // if (!mounted) {
  //   return (
  //     <>
  //       <div style={{
  //         minHeight: '100vh',
  //         display: 'flex',
  //         flexDirection: 'column',
  //         alignItems: 'center',
  //         justifyContent: 'center',
  //         background: 'linear-gradient(135deg, #FF6B35 0%, #FFA726 100%)',
  //         color: 'white',
  //         fontFamily: 'system-ui, sans-serif'
  //       }}>
  //         <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
  //           <h1 style={{ fontSize: '2rem', margin: '0 0 1rem 0' }}>🛕 Palani Pathayathirai</h1>
  //           <h2 style={{ fontSize: '1.2rem', fontWeight: 'normal', margin: '0 0 2rem 0' }}>Devotional Tracking Platform</h2>
  //         </div>
  //         <div className="spinner"></div>
  //         <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>Loading...</p>
  //       </div>
  //       <style dangerouslySetInnerHTML={{
  //         __html: `
  //           .spinner {
  //             width: 40px;
  //             height: 40px;
  //             border: 4px solid rgba(255,255,255,0.3);
  //             border-top: 4px solid white;
  //             border-radius: 50%;
  //             animation: spin 1s linear infinite;
  //           }
  //           @keyframes spin {
  //             0% { transform: rotate(0deg); }
  //             100% { transform: rotate(360deg); }
  //           }
  //         `
  //       }} />
  //     </>
  //   );
  // }

  return (
    <>
    </>
    // <ThemeRegistry>
    //   <Box
    //     sx={{
    //       minHeight: '100vh',
    //       display: 'flex',
    //       flexDirection: 'column',
    //       alignItems: 'center',
    //       justifyContent: 'center',
    //       background: 'linear-gradient(135deg, #FF6B35 0%, #FFA726 100%)',
    //       color: 'white',
    //     }}
    //   >
    //     <Typography variant="h2" component="h1" gutterBottom sx={{ textAlign: 'center' }}>
    //       🛕 Palani Pathayathirai
    //     </Typography>
    //     <Typography variant="h6" sx={{ mb: 4, textAlign: 'center' }}>
    //       Devotional Tracking Platform
    //     </Typography>
    //     <CircularProgress color="inherit" />
    //     <Typography variant="body2" sx={{ mt: 2 }}>
    //       Redirecting to Admin Panel...
    //     </Typography>
    //   </Box>
    // </ThemeRegistry>
  );
}

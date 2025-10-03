'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
  Button,
  LinearProgress,
  Grid,
  Stack,
  Skeleton,
} from '@mui/material';
import {
  People,
  AccountBalance,
  Restaurant,
  Home,
  MusicNote,
  PhotoLibrary,
  TrendingUp,
  LocationOn,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTemples: number;
  totalAnnadhanam: number;
  totalMadangal: number;
  totalSongs: number;
  totalPhotos: number;
  usersOnPathayathirai: number;
}

// Skeleton Components
const StatCardSkeleton = () => (
  <Card 
    sx={{ 
      height: '100%',
      background: 'white',
      borderRadius: 2,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    }}
  >
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="40%" height={40} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="70%" height={16} />
        </Box>
        <Skeleton variant="circular" width={56} height={56} />
      </Box>
    </CardContent>
  </Card>
);

const BannerSkeleton = () => (
  <Card 
    sx={{ 
      mb: 4, 
      background: 'white',
      border: '1px solid rgba(0,0,0,0.1)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }}
  >
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center" sx={{ flex: 1 }}>
          <Skeleton variant="circular" width={30} height={30} sx={{ mr: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="40%" height={28} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="60%" height={20} />
          </Box>
        </Box>
        <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} />
      </Box>
    </CardContent>
  </Card>
);

const QuickActionSkeleton = () => (
  <Box 
    sx={{
      background: 'white',
      borderRadius: 2,
      p: 3,
      textAlign: 'center',
      border: '1px solid rgba(0,0,0,0.1)',
    }}
  >
    <Skeleton variant="circular" width={50} height={50} sx={{ mx: 'auto', mb: 2 }} />
    <Skeleton variant="text" width="70%" height={24} sx={{ mx: 'auto', mb: 1 }} />
    <Skeleton variant="text" width="90%" height={16} sx={{ mx: 'auto' }} />
  </Box>
);

const QuickActionsSkeleton = () => (
  <Card 
    sx={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: 3,
      overflow: 'hidden',
      position: 'relative',
    }}
  >
    <CardContent sx={{ position: 'relative', zIndex: 1, p: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 4
      }}>
        <Box>
          <Skeleton variant="text" width={200} height={32} sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.2)' }} />
          <Skeleton variant="text" width={300} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
        </Box>
        <Skeleton variant="circular" width={60} height={60} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
      </Box>
      
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, 
        gap: 3
      }}>
        {[1, 2, 3, 4].map((item) => (
          <QuickActionSkeleton key={item} />
        ))}
      </Box>
    </CardContent>
  </Card>
);

const DashboardSkeleton = () => (
  <AdminLayout>
    <Box>
      {/* Live Status Banner Skeleton */}
      <BannerSkeleton />

      {/* Stats Grid Skeleton */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
        {[1, 2, 3, 4].map((item) => (
          <StatCardSkeleton key={item} />
        ))}
      </Box>

      {/* Content Stats Skeleton */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
        {[1, 2, 3].map((item) => (
          <StatCardSkeleton key={`content-${item}`} />
        ))}
      </Box>

      {/* Quick Actions Skeleton */}
      <QuickActionsSkeleton />
    </Box>
  </AdminLayout>
);

const StatCard = ({ title, value, icon, color, subtitle }: any) => (
  <Card 
    sx={{ 
      height: '100%',
      background: 'white', // White background
      border: `1px solid ${color}30`,
      borderRadius: 2,
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      '&:hover': {
        transform: 'translateY(-8px) scale(1.02)',
        boxShadow: '0 20px 40px rgba(33, 150, 243, 0.3), 0 10px 20px rgba(33, 150, 243, 0.15), 0 5px 10px rgba(33, 150, 243, 0.1), 0 2px 4px rgba(33, 150, 243, 0.05)',
        border: '2px solid rgba(33, 150, 243, 0.6)',
      },
    }}
  >
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: color,
            borderRadius: 2,
            p: 1.5,
            color: 'white',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'scale(1)',
            '.MuiCard-root:hover &': {
              transform: 'scale(1.1) rotateY(15deg)',
              boxShadow: '0 8px 25px rgba(33, 150, 243, 0.5)',
            }
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      } else {
        console.error('Failed to fetch dashboard stats:', data.error);
        // Fallback to mock data
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          totalTemples: 0,
          totalAnnadhanam: 0,
          totalMadangal: 0,
          totalSongs: 0,
          totalPhotos: 0,
          usersOnPathayathirai: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Fallback to mock data
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        totalTemples: 0,
        totalAnnadhanam: 0,
        totalMadangal: 0,
        totalSongs: 0,
        totalPhotos: 0,
        usersOnPathayathirai: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <AdminLayout>
      <Box>

        {/* Live Status Banner */}
        <Card 
          sx={{ 
            mb: 4, 
            background: 'white',
            color: '#333',
            border: '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center">
                <LocationOn sx={{ mr: 2, fontSize: 30, color: '#FF6B35' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
                    Live Pathayathirai Tracking
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    {stats?.usersOnPathayathirai} devotees currently on their spiritual journey
                  </Typography>
                </Box>
              </Box>
              <Button 
                variant="contained" 
                sx={{ 
                  backgroundColor: '#2196F3',
                  color: 'white',
                  '&:hover': { backgroundColor: '#1976D2' }
                }}
              >
                View Live Map
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
          <StatCard
            title="Total Users"
            value={stats?.totalUsers.toLocaleString()}
            subtitle={`${stats?.activeUsers} active today`}
            icon={<People />}
            color="#2196F3"
          />
          
          <StatCard
            title="Temples"
            value={stats?.totalTemples}
            subtitle="Sacred places registered"
            icon={<AccountBalance />}
            color="#FF6B35"
          />
          
          <StatCard
            title="Annadhanam Spots"
            value={stats?.totalAnnadhanam}
            subtitle="Food service locations"
            icon={<Restaurant />}
            color="#4CAF50"
          />
          
          <StatCard
            title="Madangal (Stay)"
            value={stats?.totalMadangal}
            subtitle="Accommodation places"
            icon={<Home />}
            color="#9C27B0"
          />
        </Box>

        {/* Content Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
          <StatCard
            title="Devotional Songs"
            value={stats?.totalSongs}
            subtitle="Audio files uploaded"
            icon={<MusicNote />}
            color="#FF9800"
          />
          
          <StatCard
            title="Gallery Photos"
            value={stats?.totalPhotos}
            subtitle="Images in gallery"
            icon={<PhotoLibrary />}
            color="#E91E63"
          />
          
          <StatCard
            title="Active Journeys"
            value={stats?.usersOnPathayathirai}
            subtitle="Users currently tracking"
            icon={<TrendingUp />}
            color="#00BCD4"
          />
        </Box>

        {/* Quick Actions */}
        <Card 
          sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
              pointerEvents: 'none',
            }
          }}
        >
          <CardContent sx={{ position: 'relative', zIndex: 1, p: 4 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 4
            }}>
              <Box>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: 'white',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    mb: 1
                  }}
                >
                  Quick Actions
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.8)',
                    fontWeight: 500
                  }}
                >
                  Manage your platform with these shortcuts
                </Typography>
              </Box>
              <Box sx={{
                width: 60,
                height: 60,
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)',
              }}>
                <TrendingUp sx={{ color: 'white', fontSize: 30 }} />
              </Box>
            </Box>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, 
              gap: 3
            }}>
              <Box 
                onClick={() => router.push('/admin/temples')}
                sx={{
                background: 'white',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                border: '1px solid rgba(255,107,53,0.2)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  background: 'linear-gradient(45deg, #FF6B35, #FFA726)',
                  color: 'white',
                  boxShadow: '0 20px 40px rgba(255,107,53,0.3)',
                  '& .MuiTypography-root': {
                    color: 'white',
                  }
                }
              }}>
                <Box sx={{
                  width: 50,
                  height: 50,
                  background: 'linear-gradient(45deg, #FF6B35, #FFA726)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  boxShadow: '0 8px 20px rgba(255,107,53,0.4)',
                }}>
                  <AccountBalance sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Typography variant="h6" sx={{ color: '#333', fontWeight: 600, mb: 1 }}>
                  Add Temple
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Register new temples
                </Typography>
              </Box>

              <Box 
                onClick={() => router.push('/admin/annadhanam')}
                sx={{
                background: 'white',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                border: '1px solid rgba(76,175,80,0.2)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  background: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
                  color: 'white',
                  boxShadow: '0 20px 40px rgba(76,175,80,0.3)',
                  '& .MuiTypography-root': {
                    color: 'white',
                  }
                }
              }}>
                <Box sx={{
                  width: 50,
                  height: 50,
                  background: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  boxShadow: '0 8px 20px rgba(76,175,80,0.4)',
                }}>
                  <Restaurant sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Typography variant="h6" sx={{ color: '#333', fontWeight: 600, mb: 1 }}>
                  Add Annadhanam
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Food service spots
                </Typography>
              </Box>

              <Box 
                onClick={() => router.push('/admin/madangal')}
                sx={{
                background: 'white',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                border: '1px solid rgba(156,39,176,0.2)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  background: 'linear-gradient(45deg, #9C27B0, #E91E63)',
                  color: 'white',
                  boxShadow: '0 20px 40px rgba(156,39,176,0.3)',
                  '& .MuiTypography-root': {
                    color: 'white',
                  }
                }
              }}>
                <Box sx={{
                  width: 50,
                  height: 50,
                  background: 'linear-gradient(45deg, #9C27B0, #E91E63)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  boxShadow: '0 8px 20px rgba(156,39,176,0.4)',
                }}>
                  <Home sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Typography variant="h6" sx={{ color: '#333', fontWeight: 600, mb: 1 }}>
                  Add Madangal
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Accommodation places
                </Typography>
              </Box>

              <Box 
                onClick={() => router.push('/admin/songs')}
                sx={{
                background: 'white',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                border: '1px solid rgba(255,152,0,0.2)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  background: 'linear-gradient(45deg, #FF9800, #FFC107)',
                  color: 'white',
                  boxShadow: '0 20px 40px rgba(255,152,0,0.3)',
                  '& .MuiTypography-root': {
                    color: 'white',
                  }
                }
              }}>
                <Box sx={{
                  width: 50,
                  height: 50,
                  background: 'linear-gradient(45deg, #FF9800, #FFC107)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  boxShadow: '0 8px 20px rgba(255,152,0,0.4)',
                }}>
                  <MusicNote sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Typography variant="h6" sx={{ color: '#333', fontWeight: 600, mb: 1 }}>
                  Upload Song
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Devotional audio files
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </AdminLayout>
  );
}

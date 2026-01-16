'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
  import CancelIcon from '@mui/icons-material/Cancel';
import StartIcon from '@mui/icons-material/Start';
import MyLocationIcon from '@mui/icons-material/MyLocation';

  import {
  LocationOn,
  Refresh,
  MyLocation,
  Navigation,
  Group as GroupIcon,
  Person,
  DirectionsWalk,
  OnlinePrediction,
  Wifi,
  WifiOff,
  AccessTime,
  Route,
  ExitToApp,
} from '@mui/icons-material';
import AdminLayout from '@/components/admin/AdminLayout';
import NotificationManager from '@/components/NotificationManager';
import { calculateDistance, formatDistance, getRelativePosition } from '@/lib/locationUtils';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Player from 'react-lottie-player';
import loadingAnimation from '../../../../Loading.json';
import People from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
// Dynamically import LocationMap to avoid SSR issues with Leaflet
const LocationMap = dynamic(() => import('@/components/LocationMap'), {
  ssr: false,
  loading: () => (
    <Box 
      sx={{ 
        height: 500, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'grey.100',
        borderRadius: 1 
      }}
    >
      <CircularProgress />
      <Typography sx={{ ml: 2 }}>Loading map...</Typography>
    </Box>
  )
});

interface Group {
  _id: string;
  name: string;
  memberCount: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  isTracking: boolean;
}

export default function TrackingPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);
  const [error, setError] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [trackingMode, setTrackingMode] = useState<'group' | 'individual' | 'all'>('group');
  const [adminLocation, setAdminLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [currentUser, setCurrentUser] = useState<{id: string; name: string} | null>(null);
const [showFilters, setShowFilters] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

const [lastUpdated, setLastUpdated] = useState<string>('');

useEffect(() => {
  setLastUpdated(new Date().toLocaleString());
}, []);


  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token) {
      router.push('/admin/login');
      return;
    }

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser({ id: user._id || user.id, name: user.name });
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingAnimation(false);
    }, 4000); // 3 seconds

    return () => clearTimeout(timer);
  }, []);

  // Memoize the tracking options to prevent unnecessary re-renders
  const trackingOptions = useMemo(() => ({
    mode: trackingMode === 'individual'
      ? 'user'
      : trackingMode === 'group'
      ? 'group'
      : 'all' as 'all' | 'user' | 'group',
    targetId: trackingMode === 'individual' ? selectedUserId : trackingMode === 'group' ? selectedGroupId : undefined,
    adminLocation: adminLocation || undefined,
  }), [trackingMode, selectedUserId, selectedGroupId, adminLocation]);

const getCurrentLocation = useCallback(() => {
  if (!navigator.geolocation) {
    setError('Geolocation is not supported by this browser');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      setAdminLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setError('');
    },
    (error) => {
      let message = 'Unable to fetch location';

      if (error?.code === 1) message = 'Location permission denied';
      else if (error?.code === 2) message = 'Location unavailable';
      else if (error?.code === 3) message = 'Location request timed out';

      console.error('Geolocation Error:', error);
      setError(message);
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    }
  );
}, []);


  const fetchGroups = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        router.push('/admin/login');
        return;
      }

      const response = await fetch('/api/groups', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok) {
        setGroups(data.groups);
        if (data.groups.length > 0) {
          setSelectedGroupId(data.groups[0]._id);
        }
      } else {
        setError(data.error || 'Failed to fetch groups');
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/admin/login');
        }
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      setError('Failed to fetch groups');
    }
  }, [router]);

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        router.push('/admin/login');
        return;
      }

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok) {
        const trackingUsers = data.users.filter((user: any) => 
          user.isTracking
        );
        setUsers(trackingUsers);
        if (trackingUsers.length > 0) {
          setSelectedUserId(trackingUsers[0]._id);
        }
      } else {
        setError(data.error || 'Failed to fetch users');
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/admin/login');
        }
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError('Failed to fetch users');
    }
  }, [router]);

  // Use Firebase real-time tracking
  const {
    locations,
    loading: trackingLoading,
    error: trackingError,
    connected,
    getLocationsArray,
    getStats,
    startTracking,
    stopTracking,
    isTracking,
  } = useLocationTracking(trackingOptions);

  useEffect(() => {
    if (currentUser) {
      fetchGroups();
      fetchUsers();
      getCurrentLocation();
    }
  }, [currentUser, fetchGroups, fetchUsers, getCurrentLocation]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/admin/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'default';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_started': return 'Not Started';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const trackingStats = getStats();
  const locationsList = getLocationsArray();

  if (!currentUser) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  const isStartDisabled =
  isTracking ||
  trackingLoading ||
  (trackingMode !== 'all' && !selectedGroupId && !selectedUserId);

const isStopDisabled =
  !isTracking || trackingLoading;


  const handleStartTracking = async () => {
  if (actionInProgress || isTracking) return;

  try {
    setActionInProgress(true);
    setError('');

    await startTracking(); // wait till firebase/socket ready
  } catch (err) {
    console.error('Start tracking failed:', err);
    setError('Failed to start tracking. Please try again.');
  } finally {
    setActionInProgress(false);
  }
};

const handleStopTracking = async () => {
  if (actionInProgress || !isTracking) return;

  try {
    setActionInProgress(true);
    setError('');

    await stopTracking(); // IMPORTANT: wait till unsubscribe
  } catch (err) {
    console.error('Stop tracking failed:', err);
    setError('Failed to stop tracking. Please try again.');
  } finally {
    setActionInProgress(false);
  }
};



  return (
    <AdminLayout>
      <Box >
        {/* Loading Animation Overlay */}
        {showLoadingAnimation && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999,
              transition: 'all 0.3s ease-in-out',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'smoothBounce 2s infinite ease-in-out',
              }}
            >
              <Player
                animationData={loadingAnimation}
                play
                loop
                speed={1}
                style={{
                  width: '250px',
                  height: '250px',
                  filter: 'drop-shadow(0 4px 8px rgba(102, 126, 234, 0.3))',
                  display: 'block',
                  margin: '0 auto',
                }}
              />
            </Box>
            <Typography
              variant="h6"
              sx={{
                color: '#667eea',
                fontWeight: 600,
                textAlign: 'center',
                animation: 'smoothFadeInOut 3s infinite ease-in-out',
                textShadow: '0 2px 4px rgba(102, 126, 234, 0.2)',
              }}
            >
              Loading Tracking...
            </Typography>
            <style jsx>{`
              @keyframes smoothFadeInOut {
                0%, 100% { 
                  opacity: 0.5; 
                  transform: translateY(0px);
                }
                50% { 
                  opacity: 1; 
                  transform: translateY(-2px);
                }
              }
              
              @keyframes smoothBounce {
                0%, 100% { 
                  transform: translateY(0px) scale(1);
                }
                50% { 
                  transform: translateY(-5px) scale(1.02);
                }
              }
            `}</style>
          </Box>
        )}
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
<Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#7353ae' }}>
              Live Location Tracking
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h6" color="text.secondary">
              Welcome, {currentUser.name}
            </Typography>
           <Chip
  icon={
    connected ? (
      <Wifi sx={{ fontSize: 18 }} />
    ) : (
      <WifiOff sx={{ fontSize: 18 }} />
    )
  }
  label={connected ? 'Connected' : 'Disconnected'}
  sx={{
    px: 1.5,
    height: 36,
    fontWeight: 600,
    fontSize: '0.9rem',
    borderRadius: '999px',
    letterSpacing: '0.3px',

    // Dynamic colors
    color: connected ? '#065f46' : '#7f1d1d',
    background: connected
      ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)'
      : 'linear-gradient(135deg, #fef2f2, #fee2e2)',
    border: `1.5px solid ${
      connected ? '#34d399' : '#f87171'
    }`,

    // Icon color
    '& .MuiChip-icon': {
      color: connected ? '#10b981' : '#ef4444',
    },

    // Hover effect
    '&:hover': {
      background: connected
        ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)'
        : 'linear-gradient(135deg, #fee2e2, #fecaca)',
      boxShadow: connected
        ? '0 4px 12px rgba(16,185,129,0.35)'
        : '0 4px 12px rgba(239,68,68,0.35)',
    },

    transition: 'all 0.25s ease',
  }}
/>


            <Button
  variant="outlined"
  startIcon={<MyLocation />}
  onClick={getCurrentLocation}
  sx={{
    color: '#ffffff',                // 👈 text white
    borderColor: '#ffffff',          // 👈 border white
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontWeight: 600,
    '& .MuiButton-startIcon': {
      color: '#ffffff',              // 👈 icon white
    },
    '&:hover': {
      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
      color: '#ffffff',
      borderColor: '#ffffff',
    },
  }}
>
  Update My Location
</Button>

 <Button
  onClick={handleLogout}
  startIcon={<ExitToApp />}
  title="Logout"
  sx={{
    minWidth: 'auto',
    height: 35,
    px: 1.5,
    borderRadius: '7px',

    color: '#ef4444',
    backgroundColor: '#fef2f2',
    border: '1.5px solid #fecaca',
    fontWeight: 600,
    fontSize: '0.85rem',
    textTransform: 'none',

    '& .MuiButton-startIcon': {
      marginRight: '6px',
      color: '#ef4444',
    },

    '& svg': {
      fontSize: 20,
    },

    '&:hover': {
      backgroundColor: '#fee2e2',
      color: '#dc2626',
      borderColor: '#fca5a5',
      boxShadow: '0 6px 16px rgba(239, 68, 68, 0.35)',
      transform: 'translateY(-1px) scale(1.03)',
    },

    '&:active': {
      transform: 'scale(0.96)',
    },

    transition: 'all 0.25s ease',
  }}
>
  Logout
</Button>


          </Stack>
        </Box>

        {(error || trackingError) && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => {setError(''); }}>
            {error || trackingError}
          </Alert>
        )}

 {/* Real-time Stats */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' }, 
              gap: 2, 
              mb: 3
            }}>
              <Box>
  <Card
 sx={{
    background: 'linear-gradient(135deg, #764ba215 0%, #8B5CF625 100%)',
    border: '1px solid #764ba230',
    cursor: 'pointer',
    borderRadius: '14px',
    transition: 'all 0.3s ease',

    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 0 25px #2196F3',
      border: '1px solid #764ba250',
    },
  }}
>
  <CardContent>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* LEFT CONTENT */}
      <Box>
        <Typography
          variant="h4"
          sx={{
            color: '#6366f1',
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {trackingStats.total}
        </Typography>

        <Typography
          sx={{
            fontSize: '0.85rem',
            color: '#6b7280',
            mt: 0.5,
          }}
        >
          Total Users
        </Typography>
      </Box>

      {/* RIGHT ICON */}
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',

        

        }}
      >
        <Person
          sx={{
            fontSize: 38,
            color: '#4f46e5',
          }}
        />
      </Box>
    </Box>
  </CardContent>
</Card>


              </Box>
              <Box>
              <Card
  sx={{
    background: 'linear-gradient(135deg, #764ba215 0%, #8B5CF625 100%)',
    border: '1px solid #764ba230',
    cursor: 'pointer',
    borderRadius: '14px',
    transition: 'all 0.3s ease',

    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 0 25px #2196F3',
      border: '1px solid #764ba250',
    },
  }}
>
  <CardContent>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* LEFT CONTENT */}
      <Box>
        <Typography
          variant="h4"
          sx={{ color: '#764ba2', fontWeight: 'bold' }}
        >
          {trackingStats.online}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Online Now
        </Typography>
      </Box>

      {/* RIGHT ICON */}
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Wifi
          sx={{
            fontSize: 38,
            color: '#764ba2',
          }}
        />
      </Box>
    </Box>
  </CardContent>
</Card>

              </Box>
             <Box>
  <Card
    sx={{
    background: 'linear-gradient(135deg, #764ba215 0%, #8B5CF625 100%)',
    border: '1px solid #764ba230',
    cursor: 'pointer',
    borderRadius: '14px',
    transition: 'all 0.3s ease',

    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 0 25px #2196F3',
      border: '1px solid #764ba250',
    },
  }}
  >
    <CardContent>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* LEFT CONTENT */}
        <Box>
          <Typography
            variant="h4"
            sx={{ color: '#8B5CF6', fontWeight: 'bold' }}
          >
            {trackingStats.tracking}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Actively Tracking
          </Typography>
        </Box>

        {/* RIGHT ICON */}
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LocationOn
            sx={{
              fontSize: 38,
              color: '#8B5CF6',
            }}
          />
        </Box>
      </Box>
    </CardContent>
  </Card>
</Box>

            <Box>
  <Card
    sx={{
    background: 'linear-gradient(135deg, #764ba215 0%, #8B5CF625 100%)',
    border: '1px solid #764ba230',
    cursor: 'pointer',
    borderRadius: '14px',
    transition: 'all 0.3s ease',

    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 0 25px #2196F3',
      border: '1px solid #764ba250',
    },
  }}
  >
    <CardContent>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* LEFT CONTENT */}
        <Box>
          <Typography
            variant="h4"
            sx={{ color: '#667eea', fontWeight: 'bold' }}
          >
            {formatDistance(trackingStats.averageDistance)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Avg Distance
          </Typography>
        </Box>

        {/* RIGHT ICON */}
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Route
            sx={{
              fontSize: 38,
              color: '#667eea',
            }}
          />
        </Box>
      </Box>
    </CardContent>
  </Card>
</Box>

              
            </Box>

        {/* Notification Manager */}
        <Box sx={{ 
         
          mb: 3 
        }}>
          <Box sx={{ 
            flex: { xs: '1 1 100%', md: '0 0 33.333%' }
          }}>
            <NotificationManager
              userId={currentUser.id}
              userName={currentUser.name}
              isAdmin={true}
            />
          </Box>
          <Box sx={{ 
            flex: { xs: '1 1 100%', md: '1 1 66.667%' }
          }}>
           
          </Box>
          
        </Box>

        
{/* Tracking Mode Selection */}
<Card sx={{ mb: 3 }}>
  <CardContent>
    <Stack spacing={3}>

   <Typography
  variant="h6"
  component="span"            // 🔑 important
  sx={{
    display: 'inline-flex',   // text width-ku mattum background
    alignItems: 'center',
    color: '#7353ae',
    fontWeight: 700,
    mb: 2,
    ml: -3.5,
    px: 2,
    py: 0.8,
    borderRadius: 1.5,
    backgroundColor: '#f3e8ff',
    width: 'fit-content',     // extra safety
  }}
>
  Filter Location
</Typography>


      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
        }}
      >

        
        {/* Tracking Mode */}
        <FormControl
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'white',
                          transition: 'all 0.2s ease',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                            borderWidth: 2,
                          },
                        },
                      }}
                    >
          <InputLabel>Tracking Mode</InputLabel>
          <Select
            value={trackingMode}
            label="Tracking Mode"
            onChange={(e) =>
              setTrackingMode(e.target.value as 'group' | 'individual' | 'all')
            }
          >
            <MenuItem value="all">
              <Box display="flex" alignItems="center">
                <Wifi sx={{ mr: 1 }} /> All Users (Live)
              </Box>
            </MenuItem>
            <MenuItem value="group">
              <Box display="flex" alignItems="center">
                <GroupIcon sx={{ mr: 1 }} /> Group Tracking
              </Box>
            </MenuItem>
            <MenuItem value="individual">
              <Box display="flex" alignItems="center">
                <Person sx={{ mr: 1 }} /> Individual Tracking
              </Box>
            </MenuItem>
          </Select>
        </FormControl>

        {/* Second Field */}
        {trackingMode === 'group' && (
          <FormControl fullWidth>
            <InputLabel>Select Group</InputLabel>
            <Select
              value={selectedGroupId}
              label="Select Group"
              onChange={(e) => setSelectedGroupId(e.target.value)}
            >
              {groups.map((group) => (
                <MenuItem key={group._id} value={group._id}>
                  {group.name} ({group.memberCount})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {trackingMode === 'individual' && (
           <FormControl
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'white',
                          transition: 'all 0.2s ease',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                            borderWidth: 2,
                          },
                        },
                      }}
                    >
            <InputLabel>Select User</InputLabel>
            <Select
              value={selectedUserId}
              label="Select User"
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              {users.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* BUTTONS */}
   {/* BUTTONS */}
<Box display="flex" justifyContent="flex-end" alignItems="center" gap={2}>
  
 <Button
  variant="contained"
  disabled={
    isTracking ||
    trackingLoading ||
    actionInProgress ||
    (trackingMode !== 'all' && !selectedGroupId && !selectedUserId)
  }
  onClick={handleStartTracking}
  startIcon={<StartIcon />}
  sx={{
    minWidth: 140,
    height: 40,
    fontWeight: 600,
    textTransform: 'none',

    // Enabled
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#ffffff',

    '&:hover': {
      background: 'linear-gradient(135deg, #5a6fd8, #6a4190)',
    },

    // Disabled
    '&.Mui-disabled': {
      background: '#e5e7eb',
      color: '#9ca3af',
    },
  }}
>
  {actionInProgress ? 'Starting...' : 'Start Tracking'}
</Button>


<Button
  variant="contained"
  disabled={
    !isTracking ||
    trackingLoading ||
    actionInProgress
  }
  onClick={handleStopTracking}
  startIcon={<CancelIcon />}
  sx={{
    minWidth: 140,
    height: 40,
    fontWeight: 600,
    textTransform: 'none',

    // Enabled (danger)
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    color: '#ffffff',

    '&:hover': {
      background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
    },

    // Disabled state
    '&.Mui-disabled': {
      background: '#fee2e2',
      color: '#fca5a5',
    },
  }}
>
  {actionInProgress ? 'Stopping...' : 'Stop Tracking'}
</Button>


</Box>


    </Stack>
  </CardContent>
</Card>


        {/* Admin Location */}
        {adminLocation && (
          <Card sx={{mb:3}} >
            <CardContent>
            
              <Box display="flex" alignItems="center" gap={2}>
               
             

<Box
  sx={{
    width: '100%',
    px: { xs: 2, md: 4 },
    py: 3,
    backgroundColor: '#ffffff',
  }}
>
  {/* TOP HEADING */}
  <Typography
  variant="h6"
  sx={{
    display: 'inline-block',   // 🔑 key
    color: '#7353ae',
    fontWeight: 700,
    mb: 0.5,
    ml: -3.5,
    px: 2,                     // left & right padding
    py: 0.8,                   // top & bottom padding
    borderRadius: 1.5,
    backgroundColor: '#f3e8ff', // soft purple background
  }}
>
  Your Current Location
</Typography>


  {/* MAIN ROW */}
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 3,
      flexWrap: 'wrap',
    }}
  >
    {/* LEFT – Avatar + Text */}
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Avatar
        sx={{
          width: 44,
          height: 44,
          background:
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <MyLocation />
      </Avatar>

      <Box>
      <Typography
        variant='h6'
          sx={{
            letterSpacing: 0.6,
             color: '#7353ae',
          fontWeight: 700,
            mb: 0.3,
          }}
        >
          Admin Console
        </Typography>
        <Typography
          sx={{
            fontSize: '1rem',
            color: 'black', fontWeight: 300 
          }}
        >
          Live tracking details
        </Typography>
      </Box>
    </Box>

    {/* RIGHT – Location Info (UNCHANGED STYLE) */}
    <Box
      sx={{
        display: 'flex',
        gap: { xs: 2, md: 4 },
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      {/* Latitude */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          borderRadius: 1.5,
         border: '1.5px solid #5047e5',
          backgroundColor: '#f0fdf4',
          minWidth: 140,
        }}
      >
        <Typography
        variant='h6'
          sx={{
            textTransform: 'uppercase',
            letterSpacing: 0.6,
             color: '#7353ae',
          fontWeight: 700,
            mb: 0.3,
          }}
        >
          Latitude
        </Typography>
        <Typography sx={{ fontSize: '1rem',color:"black", fontWeight: 300 }}>
          {adminLocation.latitude.toFixed(6)}
        </Typography>
      </Box>

      {/* Longitude */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          borderRadius: 1.5,
         border: '1.5px solid #5047e5',
          backgroundColor: '#f0fdf4',
          minWidth: 140,
        }}
      >
        <Typography
        variant='h6'
          sx={{
            textTransform: 'uppercase',
            letterSpacing: 0.6,
             color: '#7353ae',
          fontWeight: 700,
            mb: 0.3,
          }}
        >
          Longitude
        </Typography>
        <Typography sx={{ fontSize: '1rem',color:"black", fontWeight: 300 }}>
          {adminLocation.longitude.toFixed(6)}
        </Typography>
      </Box>

      {/* Last Updated */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          borderRadius: 1.5,
          border: '1.5px solid #5047e5',
          backgroundColor: '#f0fdf4',
          minWidth: 180,
        }}
      >
        <Typography
        variant='h6'
          sx={{
            textTransform: 'uppercase',
            letterSpacing: 0.6,
             color: '#7353ae',
          fontWeight: 700,
            mb: 0.3,
          }}
        >
          Last Updated
        </Typography>
        <Typography
          sx={{
            fontSize: '0.95rem',
            fontWeight: 300,
            color: 'black',
          }}
        >
          {new Date().toLocaleString()}
        </Typography>
      </Box>
    </Box>
  </Box>
</Box>




              </Box>
            </CardContent>
          </Card>
        )}

        {/* Live Tracking Results */}
        {connected && (
          <>
            {/* Map View */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
   <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography
  variant="h6"
  sx={{
    display: 'inline-block',   // 🔑 key
    color: '#7353ae',
    fontWeight: 700,
    mb: 0.5,
    px: 2,                     // left & right padding
    py: 0.8,                   // top & bottom padding
    borderRadius: 1.5,
    backgroundColor: '#f3e8ff', // soft purple background
  }}
>
                    Live Location Map
                  </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center">
  {/* Real-time Updates */}
  <Chip
    label="Real-time Updates"
    icon={<Wifi />}
    sx={{
      height: 36,
      px: 1.6,
      fontSize: '0.85rem',
      fontWeight: 600,
      borderRadius: 2,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',

      '& .MuiChip-icon': {
        color: 'white',
        fontSize: 18,
        ml: 0.6,
        mr: 0.8,   // ✅ icon ↔ text gap
      },

      '& .MuiChip-label': {
        px: 0,
      },
    }}
  />

  {/* Users */}
  <Chip
    label={`${locationsList.length} Users`}
    sx={{
      height: 36,
      px: 1.6,
      fontSize: '0.85rem',
      fontWeight: 600,
      borderRadius: 2,
      background: 'linear-gradient(135deg, #8B5CF6 0%, #667eea 100%)',
      color: 'white',

      '& .MuiChip-label': {
        px: 0,
      },
    }}
  />
</Stack>

                </Box>
                
                <LocationMap 
                  locations={locationsList}
                  adminLocation={adminLocation}
                  height={500}
                />
              </CardContent>
            </Card>

            {/* List View */}
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                   <Typography
  variant="h6"
  sx={{
    display: 'inline-block',   // 🔑 key
    color: '#7353ae',
    fontWeight: 700,
    mb: 0.5,
    px: 2,                     // left & right padding
    py: 0.8,                   // top & bottom padding
    borderRadius: 1.5,
    backgroundColor: '#f3e8ff', // soft purple background
  }}
>
                    Live Locations ({locationsList.length} {locationsList.length === 1 ? 'person' : 'people'})
                  </Typography>
                  <Stack direction="row" spacing={1.5} alignItems="center">

                    <Chip
    label="Live Updates"
    icon={<Wifi />}
    sx={{
      height: 36,
      px: 1.5,
      fontSize: '0.85rem',
      fontWeight: 600,
      borderRadius: 2,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',

      '& .MuiChip-icon': {
        color: 'white',
        fontSize: 18,
        ml: 0.5,
        mr: 0.8,   // ✅ ICON ↔ TEXT GAP
      },

      '& .MuiChip-label': {
        px: 0,
      },
    }}
  />

                    <Chip
    label={`${trackingStats.online} Online`}
    icon={<AccessTime />}
    sx={{
      height: 36,
      px: 1.5,
      fontSize: '0.85rem',
      fontWeight: 600,
      borderRadius: 2,
      background: 'linear-gradient(135deg, #8B5CF6 0%, #667eea 100%)',
      color: 'white',

      '& .MuiChip-icon': {
        color: 'white',
        fontSize: 18,
        ml: 0.5,
        mr: 0.8,   // ✅ ICON ↔ TEXT GAP
      },

      '& .MuiChip-label': {
        px: 0,
      },
    }}
  />
                  </Stack>
                </Box>

                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, 
                  gap: 2 
                }}>
                  {locationsList.map((location) => (
                    <Box key={location.userId}>
                      <Paper sx={{ p: 2, height: '100%', position: 'relative' }}>
                        {/* Online indicator */}
                        <Badge
                          color={location.isOnline ? 'success' : 'error'}
                          variant="dot"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                          }}
                        />
                        
                        <Box display="flex" alignItems="center" mb={2}>
                          <Avatar sx={{ mr: 2 }}>
                            {location.userName.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box flex={1}>
                            <Typography variant="subtitle2" fontWeight="medium">
                              {location.userName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {location.userEmail}
                            </Typography>
                          </Box>
                          <Chip
                            size="small"
                            label={getStatusLabel(location.pathayathiraiStatus)}
                            color={getStatusColor(location.pathayathiraiStatus) as any}
                          />
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Stack spacing={1}>
                          {location.distanceFromAdmin && (
                            <Box display="flex" alignItems="center">
                              <Navigation sx={{ mr: 1, fontSize: '1rem' }} />
                              <Typography variant="body2">
                                <strong>Distance from you:</strong> {formatDistance(location.distanceFromAdmin)}
                              </Typography>
                            </Box>
                          )}

                          <Box display="flex" alignItems="center">
                            <DirectionsWalk sx={{ mr: 1, fontSize: '1rem' }} />
                            <Typography variant="body2">
                              <strong>Total Distance:</strong> {formatDistance(location.totalDistance)}
                            </Typography>
                          </Box>

                          <Box display="flex" alignItems="center">
                            <LocationOn sx={{ mr: 1, fontSize: '1rem' }} />
                            <Typography variant="body2">
                              <strong>Status:</strong> {location.isOnline ? 'Online' : 'Offline'}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Last seen: {location.lastSeen.toLocaleString()}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Coordinates: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                            </Typography>
                          </Box>
                        </Stack>

                        <Box mt={2} display="flex" gap={1}>
                          <Chip
                            size="small"
                            label={location.isTracking ? 'Tracking Active' : 'Not Tracking'}
                            color={location.isTracking ? 'success' : 'default'}
                            icon={<LocationOn />}
                          />
                          <Chip
                            size="small"
                            label={location.isOnline ? 'Online' : 'Offline'}
                            color={location.isOnline ? 'success' : 'error'}
                            icon={location.isOnline ? <Wifi /> : <WifiOff />}
                          />
                        </Box>
                      </Paper>
                    </Box>
                  ))}
                </Box>

                {locationsList.length === 0 && !trackingLoading && (
                  <Box textAlign="center" py={4}>
                    <Typography variant="body1" color="text.secondary">
                      No live location data available.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Make sure users have location tracking enabled and are sharing their location in real-time.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Loading State */}
        {trackingLoading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Connecting to live tracking...
            </Typography>
          </Box>
        )}

        {/* Disconnected State */}
        {!connected && !trackingLoading && (
          <Card>
            <CardContent>
              <Box textAlign="center" py={4}>
                <WifiOff sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Not Connected to Live Tracking
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Click "Start Live Tracking" button above to begin real-time location monitoring
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Wifi />}
                  onClick={startTracking}
                  disabled={trackingLoading || (trackingMode !== 'all' && !selectedGroupId && !selectedUserId)}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    },
                  }}
                >
                  Start Live Tracking
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </AdminLayout>
  );
}

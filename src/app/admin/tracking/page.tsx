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
import {
  LocationOn,
  Refresh,
  MyLocation,
  Navigation,
  Group as GroupIcon,
  Person,
  DirectionsWalk,
  Wifi,
  WifiOff,
  AccessTime,
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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setAdminLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          // Handle GeolocationPositionError properly
          let errorMessage = 'Unknown geolocation error';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
            default:
              errorMessage = error.message || 'Failed to get location';
              break;
          }
          
          console.error('Error getting admin location:', {
            code: error.code,
            message: errorMessage,
            originalError: error
          });
          
          // Set error state to show user-friendly message
          setError(`Failed to get your location: ${errorMessage}`);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      const errorMessage = 'Geolocation is not supported by this browser';
      console.error('Error getting admin location:', errorMessage);
      setError(errorMessage);
    }
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
            <Typography variant="body2" color="text.secondary">
              Welcome, {currentUser.name}
            </Typography>
            <Chip
              icon={connected ? <Wifi /> : <WifiOff />}
              label={connected ? 'Connected' : 'Disconnected'}
              color={connected ? 'success' : 'error'}
              variant="outlined"
            />
            <Button
              variant="outlined"
              startIcon={<MyLocation />}
              onClick={getCurrentLocation}
            >
              Update My Location
            </Button>
            <IconButton onClick={handleLogout} title="Logout">
              <ExitToApp />
            </IconButton>
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
                <Card sx={{
                  background: 'linear-gradient(135deg, #667eea15 0%, #764ba225 100%)',
                  border: '1px solid #667eea30',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px #667eea25',
                    border: '1px solid #667eea50',
                  },
                  transition: 'all 0.3s ease',
                }}>
                  <CardContent>
                    <Typography variant="h4" sx={{ color: '#667eea' }} fontWeight="bold">
                      {trackingStats.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Users
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
              <Box>
                <Card sx={{
                  background: 'linear-gradient(135deg, #764ba215 0%, #8B5CF625 100%)',
                  border: '1px solid #764ba230',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px #764ba225',
                    border: '1px solid #764ba250',
                  },
                  transition: 'all 0.3s ease',
                }}>
                  <CardContent>
                    <Typography variant="h4" sx={{ color: '#764ba2' }} fontWeight="bold">
                      {trackingStats.online}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Online Now
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
              <Box>
                <Card sx={{
                  background: 'linear-gradient(135deg, #8B5CF615 0%, #667eea25 100%)',
                  border: '1px solid #8B5CF630',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px #8B5CF625',
                    border: '1px solid #8B5CF650',
                  },
                  transition: 'all 0.3s ease',
                }}>
                  <CardContent>
                    <Typography variant="h4" sx={{ color: '#8B5CF6' }} fontWeight="bold">
                      {trackingStats.tracking}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Actively Tracking
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
              <Box>
                <Card sx={{
                  background: 'linear-gradient(135deg, #667eea15 0%, #764ba225 100%)',
                  border: '1px solid #667eea30',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px #667eea25',
                    border: '1px solid #667eea50',
                  },
                  transition: 'all 0.3s ease',
                }}>
                  <CardContent>
                    <Typography variant="h4" sx={{ color: '#667eea' }} fontWeight="bold">
                      {formatDistance(trackingStats.averageDistance)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Distance
                    </Typography>
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

      {/* TOP FIELDS */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
        }}
      >
        {/* Tracking Mode */}
        <FormControl fullWidth>
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
          <FormControl fullWidth>
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
      <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
        <Button
          variant="contained"
          disabled={isStartDisabled}
          onClick={startTracking}
          sx={{
            minWidth: 200,
            height: 52,
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            },
          }}
        >
          Start Tracking
        </Button>

        <Button
          variant="outlined"
          color="error"
          disabled={isStopDisabled}
          onClick={stopTracking}
          sx={{
            minWidth: 200,
            height: 52,
            borderWidth: 2,
          }}
        >
          Stop Tracking
        </Button>
      </Box>

    </Stack>
  </CardContent>
</Card>


        {/* Admin Location */}
        {adminLocation && (
          <Card sx={{ 
            mb: 3,
            background: 'linear-gradient(135deg, #667eea10 0%, #764ba215 100%)',
            border: '1px solid #667eea20',
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#667eea', fontWeight: 600 }}>
                Your Current Location (Admin)
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                  mr: 2 
                }}>
                  <MyLocation />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    Admin Console
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Lat: {adminLocation.latitude.toFixed(6)}, 
                    Lng: {adminLocation.longitude.toFixed(6)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Last updated: {new Date().toLocaleString()}
                  </Typography>
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
                  <Typography variant="h6">
                    Live Location Map
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip 
                      size="small" 
                      label="Real-time Updates" 
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                      }}
                      icon={<Wifi sx={{ color: 'white !important' }} />}
                    />
                    <Chip 
                      size="small" 
                      label={`${locationsList.length} Users`} 
                      sx={{
                        background: 'linear-gradient(135deg, #8B5CF6 0%, #667eea 100%)',
                        color: 'white',
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
                  <Typography variant="h6">
                    Live Locations ({locationsList.length} {locationsList.length === 1 ? 'person' : 'people'})
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip 
                      size="small" 
                      label="Live Updates" 
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                      }}
                      icon={<Wifi sx={{ color: 'white !important' }} />}
                    />
                    <Chip 
                      size="small" 
                      label={`${trackingStats.online} Online`} 
                      sx={{
                        background: 'linear-gradient(135deg, #8B5CF6 0%, #667eea 100%)',
                        color: 'white',
                      }}
                      icon={<AccessTime sx={{ color: 'white !important' }} />}
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

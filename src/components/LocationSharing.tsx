'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  Stack,
  LinearProgress,
  Avatar,
  Divider,
} from '@mui/material';
import {
  LocationOn,
  LocationOff,
  Wifi,
  WifiOff,
  MyLocation,
  Speed,
  Navigation,
} from '@mui/icons-material';
import { useLocationUpdater } from '@/hooks/useLocationTracking';

interface LocationSharingProps {
  userId: string;
  userName: string;
  userEmail: string;
  groupId?: string;
  onLocationUpdate?: (location: { latitude: number; longitude: number }) => void;
}

export default function LocationSharing({ 
  userId, 
  userName, 
  userEmail, 
  groupId,
  onLocationUpdate 
}: LocationSharingProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
  } | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { updateLocation, stopLocationUpdates, isUpdating, error: updateError } = useLocationUpdater();

  // Check for geolocation support
  const isGeolocationSupported = 'geolocation' in navigator;

  // Start location tracking
  const startTracking = useCallback(async () => {
    if (!isGeolocationSupported) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000, // 1 minute
    };

    const handleSuccess = async (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy, speed, heading } = position.coords;
      
      const locationData = {
        latitude,
        longitude,
        accuracy: accuracy || undefined,
        speed: speed || undefined,
        heading: heading || undefined,
      };

      setCurrentLocation(locationData);
      setLastUpdate(new Date());
      setError(null);

      // Update Firebase with location
      try {
        await updateLocation({
          userId,
          groupId,
          latitude,
          longitude,
          timestamp: Date.now(),
          accuracy: accuracy || undefined,
          speed: speed || undefined,
          heading: heading || undefined,
          userName,
          userEmail,
          isTracking: true,
          pathayathiraiStatus: 'in_progress',
          totalDistance: 0, // This should be calculated based on previous locations
        });

        // Notify parent component
        if (onLocationUpdate) {
          onLocationUpdate({ latitude, longitude });
        }
      } catch (err) {

      }
    };

    const handleError = (error: GeolocationPositionError) => {
      let errorMessage = 'Failed to get location';
      
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
      }
      
      setError(errorMessage);
      setIsTracking(false);
    };

    try {
      // Get initial position
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);
      
      // Start watching position
      const id = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
      setWatchId(id);
      setIsTracking(true);
      setError(null);
    } catch (err) {
      setError('Failed to start location tracking');
      setIsTracking(false);
    }
  }, [userId, userName, userEmail, groupId, isGeolocationSupported, updateLocation, onLocationUpdate]);

  // Stop location tracking
  const stopTracking = useCallback(async () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    
    setIsTracking(false);
    setCurrentLocation(null);
    setLastUpdate(null);
    
    // Remove from Firebase
    try {
      await stopLocationUpdates(userId, groupId);
    } catch (err) {

    }
  }, [watchId, userId, groupId, stopLocationUpdates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Auto-retry on error
  useEffect(() => {
    if (error && isTracking) {
      const retryTimeout = setTimeout(() => {
        setError(null);
        startTracking();
      }, 30000); // Retry after 30 seconds

      return () => clearTimeout(retryTimeout);
    }
  }, [error, isTracking, startTracking]);

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">
              Live Location Sharing
            </Typography>
            <Chip
              icon={isTracking ? <Wifi /> : <WifiOff />}
              label={isTracking ? 'Sharing' : 'Not Sharing'}
              color={isTracking ? 'success' : 'default'}
              variant="outlined"
            />
          </Box>

          {/* Error Display */}
          {(error || updateError) && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error || updateError}
            </Alert>
          )}

          {/* Geolocation Support Check */}
          {!isGeolocationSupported && (
            <Alert severity="warning">
              Your browser doesn't support geolocation. Please use a modern browser to enable location sharing.
            </Alert>
          )}

          {/* Control Buttons */}
          <Stack direction="row" spacing={2}>
            {!isTracking ? (
              <Button
                variant="contained"
                startIcon={<LocationOn />}
                onClick={startTracking}
                disabled={!isGeolocationSupported || isUpdating}
                fullWidth
                sx={{
                  background: 'linear-gradient(45deg, #4CAF50, #66BB6A)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #388E3C, #4CAF50)',
                  },
                }}
              >
                Start Sharing Location
              </Button>
            ) : (
              <Button
                variant="outlined"
                startIcon={<LocationOff />}
                onClick={stopTracking}
                disabled={isUpdating}
                fullWidth
                color="error"
              >
                Stop Sharing
              </Button>
            )}
          </Stack>

          {/* Loading Indicator */}
          {isUpdating && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Updating location...
              </Typography>
              <LinearProgress />
            </Box>
          )}

          {/* Current Location Info */}
          {currentLocation && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                  Current Location
                </Typography>
                
                <Stack spacing={1}>
                  <Box display="flex" alignItems="center">
                    <MyLocation sx={{ mr: 1, fontSize: '1rem' }} />
                    <Typography variant="body2">
                      <strong>Coordinates:</strong> {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                    </Typography>
                  </Box>

                  {currentLocation.accuracy && (
                    <Box display="flex" alignItems="center">
                      <LocationOn sx={{ mr: 1, fontSize: '1rem' }} />
                      <Typography variant="body2">
                        <strong>Accuracy:</strong> ±{currentLocation.accuracy.toFixed(0)}m
                      </Typography>
                    </Box>
                  )}

                  {currentLocation.speed && currentLocation.speed > 0 && (
                    <Box display="flex" alignItems="center">
                      <Speed sx={{ mr: 1, fontSize: '1rem' }} />
                      <Typography variant="body2">
                        <strong>Speed:</strong> {(currentLocation.speed * 3.6).toFixed(1)} km/h
                      </Typography>
                    </Box>
                  )}

                  {currentLocation.heading && (
                    <Box display="flex" alignItems="center">
                      <Navigation sx={{ mr: 1, fontSize: '1rem' }} />
                      <Typography variant="body2">
                        <strong>Heading:</strong> {currentLocation.heading.toFixed(0)}°
                      </Typography>
                    </Box>
                  )}

                  {lastUpdate && (
                    <Typography variant="caption" color="text.secondary">
                      Last updated: {lastUpdate.toLocaleString()}
                    </Typography>
                  )}
                </Stack>
              </Box>
            </>
          )}

          {/* User Info */}
          <Box display="flex" alignItems="center">
            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
              {userName.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight="medium">
                {userName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {userEmail}
              </Typography>
            </Box>
          </Box>

          {/* Instructions */}
          {!isTracking && isGeolocationSupported && (
            <Alert severity="info">
              Click "Start Sharing Location" to enable real-time location tracking. 
              Your location will be shared with group members and visible to administrators.
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

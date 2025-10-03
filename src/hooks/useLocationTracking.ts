import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToUserLocation,
  subscribeToGroupLocations,
  subscribeToAllLocations,
  updateUserLocation,
  removeUserLocation,
  calculateDistance,
  UserLocationUpdate,
} from '@/lib/firebase';

interface UseLocationTrackingOptions {
  mode: 'user' | 'group' | 'all';
  targetId?: string; // userId for user mode, groupId for group mode
  adminLocation?: {
    latitude: number;
    longitude: number;
  };
}

interface LocationTrackingState {
  locations: Record<string, UserLocationUpdate>;
  loading: boolean;
  error: string | null;
  connected: boolean;
}

export const useLocationTracking = (options: UseLocationTrackingOptions) => {
  const [state, setState] = useState<LocationTrackingState>({
    locations: {},
    loading: true,
    error: null,
    connected: false,
  });

  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);
  const [groupMembers, setGroupMembers] = useState<string[]>([]);

  // Fetch group members when group mode is selected
  useEffect(() => {
    if (options.mode === 'group' && options.targetId) {
      const fetchGroupMembers = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;

          const response = await fetch('/api/groups?includeMembers=true', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const { groups } = await response.json();
            const selectedGroup = groups.find((g: any) => g._id === options.targetId);
            
            if (selectedGroup && selectedGroup.members) {
              const memberIds = selectedGroup.members.map((member: any) => member._id);
              setGroupMembers(memberIds);

            } else {
              setGroupMembers([]);
            }
          }
        } catch (error) {

          setGroupMembers([]);
        }
      };

      fetchGroupMembers();
    } else {
      setGroupMembers([]);
    }
  }, [options.mode, options.targetId]);

  // Calculate distances from admin location
  const calculateDistances = useCallback((locations: Record<string, UserLocationUpdate>) => {
    if (!options.adminLocation) return locations;

    const updatedLocations: Record<string, UserLocationUpdate> = {};
    
    Object.entries(locations).forEach(([userId, location]) => {
      const distance = calculateDistance(
        options.adminLocation!.latitude,
        options.adminLocation!.longitude,
        location.latitude,
        location.longitude
      );

      updatedLocations[userId] = {
        ...location,
        distanceFromAdmin: distance,
      };
    });

    return updatedLocations;
  }, [options.adminLocation?.latitude, options.adminLocation?.longitude]);

  // Start tracking based on mode
  const startTracking = useCallback(() => {
    // Cleanup previous subscription
    if (unsubscribe) {
      unsubscribe();
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    let newUnsubscribe: (() => void) | null = null;

    try {
      switch (options.mode) {
        case 'user':
          if (!options.targetId) {
            setState(prev => ({ ...prev, error: 'User ID required for user tracking', loading: false }));
            return;
          }
          
          newUnsubscribe = subscribeToUserLocation(options.targetId, (locationData) => {
            setState(prev => ({
              ...prev,
              locations: locationData ? { [options.targetId!]: locationData } : {},
              loading: false,
              connected: true,
              error: null,
            }));
          });
          break;

        case 'group':
          if (!options.targetId) {
            setState(prev => ({ ...prev, error: 'Group ID required for group tracking', loading: false }));
            return;
          }
          
          newUnsubscribe = subscribeToGroupLocations(options.targetId, (locations) => {
            const locationsWithDistance = calculateDistances(locations);
            setState(prev => ({
              ...prev,
              locations: locationsWithDistance,
              loading: false,
              connected: true,
              error: null,
            }));
          });
          break;

        case 'all':
          newUnsubscribe = subscribeToAllLocations((locations) => {
            const locationsWithDistance = calculateDistances(locations);
            setState(prev => ({
              ...prev,
              locations: locationsWithDistance,
              loading: false,
              connected: true,
              error: null,
            }));
          });
          break;

        default:
          setState(prev => ({ ...prev, error: 'Invalid tracking mode', loading: false }));
          return;
      }

      setUnsubscribe(() => newUnsubscribe);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start tracking',
        loading: false,
        connected: false,
      }));
    }
  }, [options.mode, options.targetId, calculateDistances]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (unsubscribe) {
      unsubscribe();
      setUnsubscribe(null);
    }
    setState(prev => ({
      ...prev,
      connected: false,
      locations: {},
    }));
  }, [unsubscribe]);

  // Auto-start tracking when options change
  useEffect(() => {
    // Cleanup previous subscription before starting new one
    if (unsubscribe) {
      unsubscribe();
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    let newUnsubscribe: (() => void) | null = null;
    let connectionTimeout: NodeJS.Timeout;

    // Set a timeout to handle connection issues
    connectionTimeout = setTimeout(() => {
      setState(prev => ({
        ...prev,
        loading: false,
        connected: true,
        error: null,
      }));
    }, 3000); // 3 second timeout

    try {
      switch (options.mode) {
        case 'user':
          if (!options.targetId) {
            setState(prev => ({ ...prev, error: 'User ID required for user tracking', loading: false }));
            clearTimeout(connectionTimeout);
            return;
          }
          
          newUnsubscribe = subscribeToUserLocation(options.targetId, (locationData) => {
            clearTimeout(connectionTimeout);
            setState(prev => ({
              ...prev,
              locations: locationData ? { [options.targetId!]: locationData } : {},
              loading: false,
              connected: true,
              error: null,
            }));
          });
          break;

        case 'group':
          if (!options.targetId) {
            setState(prev => ({ ...prev, error: 'Group ID required for group tracking', loading: false }));
            clearTimeout(connectionTimeout);
            return;
          }
          
          // Subscribe to all locations but filter for group members
          newUnsubscribe = subscribeToAllLocations((allLocations) => {
            clearTimeout(connectionTimeout);
            
            // Filter locations to only include group members
            const filteredLocations: Record<string, UserLocationUpdate> = {};
            
            if (groupMembers.length > 0) {
              Object.entries(allLocations).forEach(([userId, locationData]) => {
                if (groupMembers.includes(userId)) {
                  filteredLocations[userId] = locationData;
                }
              });
            }
            

            const locationsWithDistance = calculateDistances(filteredLocations);
            setState(prev => ({
              ...prev,
              locations: locationsWithDistance,
              loading: false,
              connected: true,
              error: null,
            }));
          });
          break;

        case 'all':
          newUnsubscribe = subscribeToAllLocations((locations) => {
            clearTimeout(connectionTimeout);
            const locationsWithDistance = calculateDistances(locations);
            setState(prev => ({
              ...prev,
              locations: locationsWithDistance,
              loading: false,
              connected: true,
              error: null,
            }));
          });
          break;

        default:
          setState(prev => ({ ...prev, error: 'Invalid tracking mode', loading: false }));
          clearTimeout(connectionTimeout);
          return;
      }

      setUnsubscribe(() => newUnsubscribe);
    } catch (error) {
      clearTimeout(connectionTimeout);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start tracking',
        loading: false,
        connected: false,
      }));
    }
    
    // Cleanup on unmount or when dependencies change
    return () => {
      clearTimeout(connectionTimeout);
      if (newUnsubscribe) {
        newUnsubscribe();
      }
    };
  }, [options.mode, options.targetId, options.adminLocation?.latitude, options.adminLocation?.longitude, groupMembers]);

  // Get locations as array with additional computed data
  const getLocationsArray = useCallback(() => {

    
    return Object.entries(state.locations).map(([userId, location]) => ({
      ...location,
      userId,
      lastSeen: new Date(location.timestamp),
      isOnline: Date.now() - location.timestamp < 5 * 60 * 1000, // 5 minutes
    }));
  }, [state.locations]);

  // Get specific user location
  const getUserLocation = useCallback((userId: string) => {
    return state.locations[userId] || null;
  }, [state.locations]);

  // Get location statistics
  const getStats = useCallback(() => {
    const locations = getLocationsArray();
    const onlineUsers = locations.filter(loc => loc.isOnline);
    
    return {
      total: locations.length,
      online: onlineUsers.length,
      tracking: locations.filter(loc => loc.isTracking).length,
      averageDistance: locations.reduce((sum, loc) => sum + (loc.distanceFromAdmin || 0), 0) / locations.length || 0,
    };
  }, [getLocationsArray]);

  return {
    ...state,
    startTracking,
    stopTracking,
    getLocationsArray,
    getUserLocation,
    getStats,
    isTracking: !!unsubscribe,
  };
};

// Hook for updating current user's location
export const useLocationUpdater = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateLocation = useCallback(async (locationData: UserLocationUpdate) => {
    setIsUpdating(true);
    setError(null);
    
    try {
      await updateUserLocation(locationData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update location';
      setError(errorMessage);

    } finally {
      setIsUpdating(false);
    }
  }, []);

  const stopLocationUpdates = useCallback(async (userId: string, groupId?: string) => {
    setIsUpdating(true);
    setError(null);
    
    try {
      await removeUserLocation(userId, groupId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop location updates';
      setError(errorMessage);

    } finally {
      setIsUpdating(false);
    }
  }, []);

  return {
    updateLocation,
    stopLocationUpdates,
    isUpdating,
    error,
  };
};

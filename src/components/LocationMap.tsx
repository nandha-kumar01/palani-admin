'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { LatLngBounds } from 'leaflet';
import { Box, Typography, Chip, Avatar, Stack, IconButton, Tooltip } from '@mui/material';
import { MyLocation, Person, DirectionsWalk, AccessTime, Navigation } from '@mui/icons-material';
import { formatDistance } from '@/lib/locationUtils';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different user types
const createCustomIcon = (color: string, isAdmin: boolean = false) => {
  const iconHtml = isAdmin 
    ? `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
         <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
           <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
         </svg>
       </div>`
    : `<div style="background-color: ${color}; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
         <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
           <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
         </svg>
       </div>`;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-div-icon',
    iconSize: [isAdmin ? 30 : 25, isAdmin ? 30 : 25],
    iconAnchor: [isAdmin ? 15 : 12.5, isAdmin ? 15 : 12.5],
  });
};

interface LocationData {
  userId: string;
  userName: string;
  userEmail: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  isTracking: boolean;
  totalDistance: number;
  pathayathiraiStatus: string;
  distanceFromAdmin?: number;
  isOnline: boolean;
  lastSeen: Date;
}

interface LocationMapProps {
  locations: LocationData[];
  adminLocation: { latitude: number; longitude: number } | null;
  height?: number;
}

// Component to fit map bounds to all markers
const FitBounds: React.FC<{ locations: LocationData[], adminLocation: { latitude: number; longitude: number } | null }> = ({ locations, adminLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 0 && !adminLocation) return;

    const bounds = new LatLngBounds([]);
    
    // Add all user locations to bounds
    locations.forEach(location => {
      bounds.extend([location.latitude, location.longitude]);
    });

    // Add admin location to bounds
    if (adminLocation) {
      bounds.extend([adminLocation.latitude, adminLocation.longitude]);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [locations, adminLocation, map]);

  return null;
};

const LocationMap: React.FC<LocationMapProps> = ({ locations, adminLocation, height = 400 }) => {
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    setMapLoaded(true);
  }, []);

  if (!mapLoaded) {
    return (
      <Box 
        sx={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'grey.100',
          borderRadius: 1 
        }}
      >
        <Typography>Loading map...</Typography>
      </Box>
    );
  }

  // Default center (Tamil Nadu, India)
  const defaultCenter: [number, number] = [11.1271, 78.6569];
  
  // Use admin location as center if available, otherwise use first user location or default
  const mapCenter: [number, number] = adminLocation 
    ? [adminLocation.latitude, adminLocation.longitude]
    : locations.length > 0 
    ? [locations[0].latitude, locations[0].longitude]
    : defaultCenter;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return '#757575';
      case 'in_progress': return '#1976d2';
      case 'completed': return '#388e3c';
      default: return '#757575';
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

  return (
    <Box sx={{ height, position: 'relative', borderRadius: 1, overflow: 'hidden' }}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBounds locations={locations} adminLocation={adminLocation} />

        {/* Admin Location Marker */}
        {adminLocation && (
          <Marker
            position={[adminLocation.latitude, adminLocation.longitude]}
            icon={createCustomIcon('#e91e63', true)}
          >
            <Popup>
              <Box sx={{ p: 1, minWidth: 200 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 1, width: 32, height: 32 }}>
                    <MyLocation fontSize="small" />
                  </Avatar>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Admin Location
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  You are here
                </Typography>
                <Typography variant="caption" display="block">
                  Lat: {adminLocation.latitude.toFixed(6)}
                </Typography>
                <Typography variant="caption" display="block">
                  Lng: {adminLocation.longitude.toFixed(6)}
                </Typography>
              </Box>
            </Popup>
          </Marker>
        )}

        {/* User Location Markers */}
        {locations.map((location) => (
          <Marker
            key={location.userId}
            position={[location.latitude, location.longitude]}
            icon={createCustomIcon(
              location.isOnline ? getStatusColor(location.pathayathiraiStatus) : '#9e9e9e'
            )}
          >
            <Popup>
              <Box sx={{ p: 1, minWidth: 250 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Avatar sx={{ mr: 1, width: 32, height: 32 }}>
                    {location.userName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="medium">
                      {location.userName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {location.userEmail}
                    </Typography>
                  </Box>
                </Box>

                <Stack spacing={1} mb={2}>
                  <Chip
                    size="small"
                    label={getStatusLabel(location.pathayathiraiStatus)}
                    sx={{ 
                      bgcolor: getStatusColor(location.pathayathiraiStatus),
                      color: 'white' 
                    }}
                  />
                  <Chip
                    size="small"
                    label={location.isOnline ? 'Online' : 'Offline'}
                    color={location.isOnline ? 'success' : 'error'}
                    variant="outlined"
                  />
                </Stack>

                <Stack spacing={1}>
                  {location.distanceFromAdmin && (
                    <Box display="flex" alignItems="center">
                      <Navigation sx={{ mr: 1, fontSize: '0.875rem' }} />
                      <Typography variant="body2">
                        <strong>Distance from you:</strong> {formatDistance(location.distanceFromAdmin)}
                      </Typography>
                    </Box>
                  )}

                  <Box display="flex" alignItems="center">
                    <DirectionsWalk sx={{ mr: 1, fontSize: '0.875rem' }} />
                    <Typography variant="body2">
                      <strong>Total Distance:</strong> {formatDistance(location.totalDistance)}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center">
                    <AccessTime sx={{ mr: 1, fontSize: '0.875rem' }} />
                    <Typography variant="body2">
                      <strong>Last seen:</strong> {location.lastSeen.toLocaleTimeString()}
                    </Typography>
                  </Box>
                </Stack>

                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  Coordinates: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </Typography>
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          bgcolor: 'rgba(255, 255, 255, 0.9)',
          p: 1,
          borderRadius: 1,
          boxShadow: 1,
          fontSize: '0.75rem',
        }}
      >
        <Typography variant="caption" fontWeight="bold" display="block" mb={0.5}>
          Legend
        </Typography>
        <Box display="flex" alignItems="center" mb={0.5}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#e91e63', marginRight: 4 }} />
          <Typography variant="caption">Admin (You)</Typography>
        </Box>
        <Box display="flex" alignItems="center" mb={0.5}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#1976d2', marginRight: 4 }} />
          <Typography variant="caption">In Progress</Typography>
        </Box>
        <Box display="flex" alignItems="center" mb={0.5}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#388e3c', marginRight: 4 }} />
          <Typography variant="caption">Completed</Typography>
        </Box>
        <Box display="flex" alignItems="center">
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#9e9e9e', marginRight: 4 }} />
          <Typography variant="caption">Offline/Not Started</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default LocationMap;

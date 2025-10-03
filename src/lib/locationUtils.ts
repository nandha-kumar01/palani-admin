// Utility functions for distance calculations and location tracking

// Haversine formula to calculate distance between two coordinates
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Format distance for display
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance}km`;
}

// Calculate total distance traveled
export function calculateTotalDistance(locations: Array<{latitude: number, longitude: number}>): number {
  if (locations.length < 2) return 0;
  
  let total = 0;
  for (let i = 1; i < locations.length; i++) {
    total += calculateDistance(
      locations[i-1].latitude,
      locations[i-1].longitude,
      locations[i].latitude,
      locations[i].longitude
    );
  }
  
  return total;
}

// Check if user is within tracking radius (e.g., 50km) of group
export function isWithinTrackingRadius(
  userLat: number,
  userLon: number,
  groupMemberLat: number,
  groupMemberLon: number,
  radiusKm: number = 50
): boolean {
  const distance = calculateDistance(userLat, userLon, groupMemberLat, groupMemberLon);
  return distance <= radiusKm;
}

// Get relative position description
export function getRelativePosition(distance: number): string {
  if (distance < 0.1) return 'Very close';
  if (distance < 1) return 'Nearby';
  if (distance < 5) return 'Close';
  if (distance < 20) return 'Moderate distance';
  if (distance < 50) return 'Far';
  return 'Very far';
}

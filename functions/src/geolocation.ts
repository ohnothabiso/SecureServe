import * as admin from 'firebase-admin';

const db = admin.firestore();

interface User {
  uid: string;
  displayName: string;
  phone: string;
  email: string;
  role: 'admin' | 'user';
  verified: boolean;
  lastLocation?: { lat: number; lng: number };
  fcmTokens: string[];
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(point2.lat - point1.lat);
  const dLon = toRad(point2.lng - point1.lng);
  const lat1 = toRad(point1.lat);
  const lat2 = toRad(point2.lat);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Find users within a specified radius of a location
 * This is a simplified implementation for the MVP
 * In production, you'd want to use GeoFirestore or implement more efficient geospatial queries
 */
export async function findUsersInRadius(
  center: { lat: number; lng: number },
  radiusKm: number
): Promise<User[]> {
  try {
    // Get all users with location data
    const usersSnapshot = await db
      .collection('users')
      .where('lastLocation', '!=', null)
      .get();

    const usersInRadius: User[] = [];

    usersSnapshot.forEach(doc => {
      const user = doc.data() as User;
      
      if (user.lastLocation && user.fcmTokens && user.fcmTokens.length > 0) {
        const distance = calculateDistance(center, user.lastLocation);
        
        if (distance <= radiusKm) {
          usersInRadius.push({
            ...user,
            uid: doc.id
          });
        }
      }
    });

    console.log(`Found ${usersInRadius.length} users within ${radiusKm}km of (${center.lat}, ${center.lng})`);
    return usersInRadius;

  } catch (error) {
    console.error('Error finding users in radius:', error);
    return [];
  }
}

/**
 * Check if a location is within South Africa bounds
 * Basic validation for South African coordinates
 */
export function isInSouthAfrica(location: { lat: number; lng: number }): boolean {
  const { lat, lng } = location;
  
  // Approximate South Africa bounds
  const minLat = -35.0; // Southern tip
  const maxLat = -22.0; // Northern border
  const minLng = 16.0;  // Western border
  const maxLng = 33.0;  // Eastern border
  
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

/**
 * Get a bounding box for efficient geospatial queries
 * Returns approximate bounds that contain all points within the radius
 */
export function getBoundingBox(
  center: { lat: number; lng: number },
  radiusKm: number
): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  const latDelta = radiusKm / 111.0; // Rough conversion: 1 degree ≈ 111 km
  const lngDelta = radiusKm / (111.0 * Math.cos(toRad(center.lat)));

  return {
    minLat: center.lat - latDelta,
    maxLat: center.lat + latDelta,
    minLng: center.lng - lngDelta,
    maxLng: center.lng + lngDelta
  };
}

/**
 * Calculate the center point of multiple locations
 */
export function calculateCenter(locations: { lat: number; lng: number }[]): { lat: number; lng: number } {
  if (locations.length === 0) {
    throw new Error('Cannot calculate center of empty location array');
  }

  if (locations.length === 1) {
    return locations[0];
  }

  let totalLat = 0;
  let totalLng = 0;

  locations.forEach(location => {
    totalLat += location.lat;
    totalLng += location.lng;
  });

  return {
    lat: totalLat / locations.length,
    lng: totalLng / locations.length
  };
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(location: { lat: number; lng: number }): string {
  return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
}

/**
 * Get South African city names for common coordinates
 * This is a simplified lookup - in production you'd use reverse geocoding
 */
export function getCityName(location: { lat: number; lng: number }): string {
  const { lat, lng } = location;
  
  // Major South African cities (approximate coordinates)
  const cities = [
    { name: 'Johannesburg', lat: -26.2041, lng: 28.0473, tolerance: 0.5 },
    { name: 'Cape Town', lat: -33.9249, lng: 18.4241, tolerance: 0.5 },
    { name: 'Durban', lat: -29.8587, lng: 31.0218, tolerance: 0.3 },
    { name: 'Pretoria', lat: -25.7479, lng: 28.2293, tolerance: 0.3 },
    { name: 'Port Elizabeth', lat: -33.9608, lng: 25.6022, tolerance: 0.3 },
    { name: 'Bloemfontein', lat: -29.0852, lng: 26.1596, tolerance: 0.2 },
    { name: 'Polokwane', lat: -23.8962, lng: 29.4486, tolerance: 0.2 },
    { name: 'Nelspruit', lat: -25.4745, lng: 30.9703, tolerance: 0.2 },
    { name: 'Kimberley', lat: -28.7282, lng: 24.7499, tolerance: 0.2 },
    { name: 'Pietermaritzburg', lat: -29.6006, lng: 30.3796, tolerance: 0.2 }
  ];

  for (const city of cities) {
    const distance = calculateDistance(location, { lat: city.lat, lng: city.lng });
    if (distance <= city.tolerance) {
      return city.name;
    }
  }

  return 'Unknown Location';
}

/**
 * Validate GPS coordinates
 */
export function isValidCoordinates(location: { lat: number; lng: number }): boolean {
  const { lat, lng } = location;
  
  // Check if coordinates are valid numbers
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return false;
  }
  
  // Check if coordinates are within valid ranges
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return false;
  }
  
  // Check for NaN or Infinity
  if (!isFinite(lat) || !isFinite(lng)) {
    return false;
  }
  
  return true;
}
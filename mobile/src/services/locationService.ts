import * as Location from 'expo-location';
import { Alert } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'This app needs location access to show relevant alerts and allow you to report sightings.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

export const getCurrentLocation = async (): Promise<LocationData | null> => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return null;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 10000,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
};

export const watchLocation = (callback: (location: LocationData) => void) => {
  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 30000, // Update every 30 seconds
      distanceInterval: 100, // Update every 100 meters
    },
    (location) => {
      callback({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      });
    }
  );
};

// Haversine formula to calculate distance between two points
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const isWithinRadius = (
  userLat: number, 
  userLon: number, 
  alertLat: number, 
  alertLon: number, 
  radiusKm: number
): boolean => {
  const distance = calculateDistance(userLat, userLon, alertLat, alertLon);
  return distance <= radiusKm;
};
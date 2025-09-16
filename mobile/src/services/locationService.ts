import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { auth, firestore } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';

class LocationService {
  private currentLocation: Location.LocationObject | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      // Request foreground permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Foreground location permission denied');
        return false;
      }

      // Request background permissions for Android
      if (Platform.OS === 'android') {
        const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus.status !== 'granted') {
          console.log('Background location permission denied');
        }
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const hasPermission = await this.hasLocationPermission();
      if (!hasPermission) {
        console.log('Location permission not granted');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 60000, // 1 minute
        timeout: 10000, // 10 seconds
      });

      this.currentLocation = location;
      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async getLastKnownLocation(): Promise<Location.LocationObject | null> {
    try {
      const hasPermission = await this.hasLocationPermission();
      if (!hasPermission) {
        return null;
      }

      const location = await Location.getLastKnownPositionAsync({
        accuracy: Location.Accuracy.Low,
        maximumAge: 300000, // 5 minutes
      });

      return location;
    } catch (error) {
      console.error('Error getting last known location:', error);
      return null;
    }
  }

  async updateUserLocation(userId: string): Promise<void> {
    try {
      const location = await this.getCurrentLocation();
      
      if (!location) {
        // Try to get last known location as fallback
        const lastKnownLocation = await this.getLastKnownLocation();
        if (!lastKnownLocation) {
          console.log('No location available for user');
          return;
        }
        location = lastKnownLocation;
      }

      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        lastLocation: {
          lat: location.coords.latitude,
          lng: location.coords.longitude
        },
        lastLocationUpdated: new Date()
      });

      console.log('User location updated:', {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      });
    } catch (error) {
      console.error('Error updating user location:', error);
    }
  }

  async watchLocation(callback: (location: Location.LocationObject) => void): Promise<Location.LocationSubscription | null> {
    try {
      const hasPermission = await this.hasLocationPermission();
      if (!hasPermission) {
        return null;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 30000, // 30 seconds
          distanceInterval: 100, // 100 meters
        },
        callback
      );

      return subscription;
    } catch (error) {
      console.error('Error watching location:', error);
      return null;
    }
  }

  private async hasLocationPermission(): Promise<boolean> {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  }

  getCurrentLocationSync(): Location.LocationObject | null {
    return this.currentLocation;
  }

  // Calculate distance between two points using Haversine formula
  calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLon = this.toRad(point2.lng - point1.lng);
    const lat1 = this.toRad(point1.lat);
    const lat2 = this.toRad(point2.lat);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Format location for display
  formatLocation(location: { lat: number; lng: number }): string {
    return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
  }

  // Check if location is within South Africa bounds
  isInSouthAfrica(location: { lat: number; lng: number }): boolean {
    const { lat, lng } = location;
    
    // Approximate South Africa bounds
    const minLat = -35.0;
    const maxLat = -22.0;
    const minLng = 16.0;
    const maxLng = 33.0;
    
    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
  }
}

export const locationService = new LocationService();
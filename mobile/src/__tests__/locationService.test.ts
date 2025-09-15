import { locationService } from '../services/locationService';

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  requestBackgroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  getForegroundPermissionsAsync: jest.fn(),
}));

describe('LocationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      const jhb = { lat: -26.2041, lng: 28.0473 }; // Johannesburg
      const cpt = { lat: -33.9249, lng: 18.4241 }; // Cape Town
      
      const distance = locationService.calculateDistance(jhb, cpt);
      
      // Johannesburg to Cape Town is approximately 1397 km
      expect(distance).toBeGreaterThan(1300);
      expect(distance).toBeLessThan(1500);
    });

    it('should return zero distance for same points', () => {
      const point = { lat: -26.2041, lng: 28.0473 };
      
      const distance = locationService.calculateDistance(point, point);
      
      expect(distance).toBeCloseTo(0, 1);
    });

    it('should calculate short distances accurately', () => {
      const point1 = { lat: -26.2041, lng: 28.0473 }; // Johannesburg
      const point2 = { lat: -26.1076, lng: 28.0567 }; // Sandton
      
      const distance = locationService.calculateDistance(point1, point2);
      
      // Sandton is approximately 10km from Johannesburg
      expect(distance).toBeGreaterThan(8);
      expect(distance).toBeLessThan(15);
    });
  });

  describe('formatCoordinates', () => {
    it('should format coordinates correctly', () => {
      const location = { lat: -26.2041, lng: 28.0473 };
      
      const formatted = locationService.formatCoordinates(location);
      
      expect(formatted).toBe('-26.204100, 28.047300');
    });
  });

  describe('isInSouthAfrica', () => {
    it('should return true for South African coordinates', () => {
      const jhb = { lat: -26.2041, lng: 28.0473 }; // Johannesburg
      const cpt = { lat: -33.9249, lng: 18.4241 }; // Cape Town
      const dbn = { lat: -29.8587, lng: 31.0218 }; // Durban
      
      expect(locationService.isInSouthAfrica(jhb)).toBe(true);
      expect(locationService.isInSouthAfrica(cpt)).toBe(true);
      expect(locationService.isInSouthAfrica(dbn)).toBe(true);
    });

    it('should return false for non-South African coordinates', () => {
      const london = { lat: 51.5074, lng: -0.1278 }; // London
      const newYork = { lat: 40.7128, lng: -74.0060 }; // New York
      
      expect(locationService.isInSouthAfrica(london)).toBe(false);
      expect(locationService.isInSouthAfrica(newYork)).toBe(false);
    });
  });

  describe('getCurrentLocation', () => {
    it('should be a function', () => {
      expect(typeof locationService.getCurrentLocation).toBe('function');
    });

    it('should return null when permissions are denied', async () => {
      const { getCurrentPositionAsync } = require('expo-location');
      getCurrentPositionAsync.mockRejectedValue(new Error('Permission denied'));

      const result = await locationService.getCurrentLocation();
      
      expect(result).toBeNull();
    });
  });
});
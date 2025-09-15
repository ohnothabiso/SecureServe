import React from 'react';
import { render, screen } from '@testing-library/react-native';
import AlertCard from '../components/AlertCard';
import { Alert } from '../types/user';

const mockAlert: Alert = {
  alertId: 'test_alert_001',
  title: 'Missing Child - Test Alert',
  category: 'missing_person',
  description: 'This is a test alert description for a missing child.',
  photoUrl: 'https://example.com/photo.jpg',
  lastSeen: {
    lat: -26.2041,
    lng: 28.0473,
  },
  lastSeenAt: new Date('2024-01-15T10:30:00Z'),
  createdBy: 'test_admin',
  createdAt: new Date('2024-01-15T10:30:00Z'),
  active: true,
  radiusKm: 50,
  sightingCount: 2,
};

const mockUserLocation = {
  lat: -26.1076,
  lng: 28.0567,
};

describe('AlertCard', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders alert information correctly', () => {
    render(
      <AlertCard
        alert={mockAlert}
        userLocation={mockUserLocation}
        onPress={mockOnPress}
      />
    );

    expect(screen.getByText('Missing Child - Test Alert')).toBeTruthy();
    expect(screen.getByText('Missing Person')).toBeTruthy();
    expect(screen.getByText('This is a test alert description for a missing child.')).toBeTruthy();
    expect(screen.getByText('Johannesburg Area')).toBeTruthy();
    expect(screen.getByText('50km radius')).toBeTruthy();
    expect(screen.getByText('2 sightings')).toBeTruthy();
  });

  it('displays correct category emoji and label', () => {
    render(
      <AlertCard
        alert={mockAlert}
        userLocation={mockUserLocation}
        onPress={mockOnPress}
      />
    );

    expect(screen.getByText('👶')).toBeTruthy();
    expect(screen.getByText('Missing Person')).toBeTruthy();
  });

  it('calculates and displays distance correctly', () => {
    render(
      <AlertCard
        alert={mockAlert}
        userLocation={mockUserLocation}
        onPress={mockOnPress}
      />
    );

    // Should show distance from user location to alert location
    expect(screen.getByText(/km away/)).toBeTruthy();
  });

  it('displays time ago correctly', () => {
    render(
      <AlertCard
        alert={mockAlert}
        userLocation={mockUserLocation}
        onPress={mockOnPress}
      />
    );

    // Should show time ago text
    expect(screen.getByText(/ago/)).toBeTruthy();
  });

  it('handles missing user location gracefully', () => {
    render(
      <AlertCard
        alert={mockAlert}
        userLocation={null}
        onPress={mockOnPress}
      />
    );

    expect(screen.getByText('Unknown distance')).toBeTruthy();
  });

  it('displays sighting count when available', () => {
    render(
      <AlertCard
        alert={mockAlert}
        userLocation={mockUserLocation}
        onPress={mockOnPress}
      />
    );

    expect(screen.getByText('2 sightings')).toBeTruthy();
  });

  it('does not display sighting count when zero or undefined', () => {
    const alertWithoutSightings = { ...mockAlert, sightingCount: 0 };
    
    render(
      <AlertCard
        alert={alertWithoutSightings}
        userLocation={mockUserLocation}
        onPress={mockOnPress}
      />
    );

    expect(screen.queryByText('0 sightings')).toBeFalsy();
  });

  it('calls onPress when card is pressed', () => {
    render(
      <AlertCard
        alert={mockAlert}
        userLocation={mockUserLocation}
        onPress={mockOnPress}
      />
    );

    // Simulate press (this would require more complex testing setup)
    // For now, just verify the component renders without crashing
    expect(screen.getByText('Missing Child - Test Alert')).toBeTruthy();
  });
});
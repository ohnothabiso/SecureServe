import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Alert } from '../types/user';
import { locationService } from '../services/locationService';

interface AlertCardProps {
  alert: Alert;
  userLocation: { lat: number; lng: number } | null;
  onPress: () => void;
}

export default function AlertCard({ alert, userLocation, onPress }: AlertCardProps) {
  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'missing_person':
        return { emoji: '👶', label: 'Missing Person', color: '#e74c3c' };
      case 'stolen_vehicle':
        return { emoji: '🚗', label: 'Stolen Vehicle', color: '#f39c12' };
      case 'missing_elderly':
        return { emoji: '👴', label: 'Missing Elderly', color: '#9b59b6' };
      default:
        return { emoji: '🚨', label: 'Alert', color: '#e74c3c' };
    }
  };

  const getTimeAgo = (timestamp: Date): string => {
    const now = Date.now();
    const alertTime = timestamp.getTime();
    const diffMinutes = Math.floor((now - alertTime) / (1000 * 60));
    
    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffMinutes < 1440) { // 24 hours
      const hours = Math.floor(diffMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffMinutes / 1440);
      return `${days}d ago`;
    }
  };

  const getDistance = (): string => {
    if (!userLocation) {
      return 'Unknown distance';
    }
    
    const distance = locationService.calculateDistance(userLocation, alert.lastSeen);
    return `${distance.toFixed(1)}km away`;
  };

  const getLocationName = (location: { lat: number; lng: number }): string => {
    // This is a simplified version - in production you'd use reverse geocoding
    const { lat, lng } = location;
    
    if (lat >= -26.3 && lat <= -25.7 && lng >= 27.8 && lng <= 28.4) {
      return 'Johannesburg Area';
    } else if (lat >= -25.9 && lat <= -25.6 && lng >= 28.1 && lng <= 28.4) {
      return 'Pretoria Area';
    } else if (lat >= -34.0 && lat <= -33.7 && lng >= 18.3 && lng <= 18.7) {
      return 'Cape Town Area';
    } else if (lat >= -29.9 && lat <= -29.8 && lng >= 30.9 && lng <= 31.1) {
      return 'Durban Area';
    } else {
      return 'Unknown Location';
    }
  };

  const categoryInfo = getCategoryInfo(alert.category);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryEmoji}>{categoryInfo.emoji}</Text>
          <Text style={[styles.categoryLabel, { color: categoryInfo.color }]}>
            {categoryInfo.label}
          </Text>
        </View>
        <Text style={styles.timeAgo}>{getTimeAgo(alert.lastSeenAt)}</Text>
      </View>

      <Text style={styles.title}>{alert.title}</Text>
      
      <Text style={styles.description} numberOfLines={2}>
        {alert.description}
      </Text>

      <View style={styles.locationContainer}>
        <Text style={styles.locationIcon}>📍</Text>
        <Text style={styles.locationText}>
          {getLocationName(alert.lastSeen)}
        </Text>
        {userLocation && (
          <Text style={styles.distanceText}>
            • {getDistance()}
          </Text>
        )}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.statsContainer}>
          {alert.sightingCount !== undefined && alert.sightingCount > 0 && (
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>👁️</Text>
              <Text style={styles.statText}>{alert.sightingCount} sightings</Text>
            </View>
          )}
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>📡</Text>
            <Text style={styles.statText}>{alert.radiusKm}km radius</Text>
          </View>
        </View>
        
        <View style={styles.actionButton}>
          <Text style={styles.actionButtonText}>View Details</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  distanceText: {
    fontSize: 14,
    color: '#999',
    marginLeft: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  actionButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
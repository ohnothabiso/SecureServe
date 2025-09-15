import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { calculateDistance } from '../services/locationService';

interface AlertCardProps {
  alert: any;
  userLocation: {lat: number, lng: number} | null;
  onPress: () => void;
}

export default function AlertCard({ alert, userLocation, onPress }: AlertCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'missing_person':
        return '#ff9800';
      case 'stolen_vehicle':
        return '#f44336';
      case 'missing_elderly':
        return '#9c27b0';
      default:
        return '#2196f3';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'missing_person':
        return 'Missing Person';
      case 'stolen_vehicle':
        return 'Stolen Vehicle';
      case 'missing_elderly':
        return 'Missing Elderly';
      default:
        return 'Alert';
    }
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    }
  };

  const getDistance = () => {
    if (!userLocation || !alert.lastSeen) return null;
    
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      alert.lastSeen.lat,
      alert.lastSeen.lng
    );
    
    return `${distance.toFixed(1)} km away`;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        {/* Photo */}
        {alert.photoUrl && (
          <Image source={{ uri: alert.photoUrl }} style={styles.photo} />
        )}
        
        <View style={styles.textContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.categoryBadge}>
              <Text style={[styles.categoryText, { color: getCategoryColor(alert.category) }]}>
                {getCategoryLabel(alert.category)}
              </Text>
            </View>
            <Text style={styles.timeAgo}>{formatTimeAgo(alert.lastSeenAt)}</Text>
          </View>
          
          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {alert.title}
          </Text>
          
          {/* Description */}
          <Text style={styles.description} numberOfLines={3}>
            {alert.description}
          </Text>
          
          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.distance}>
              {getDistance() || 'Location unknown'}
            </Text>
            <Text style={styles.radius}>
              {alert.radiusKm || 50}km radius
            </Text>
          </View>
        </View>
      </View>
      
      {/* Arrow */}
      <View style={styles.arrow}>
        <Text style={styles.arrowText}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeAgo: {
    fontSize: 11,
    color: '#999',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distance: {
    fontSize: 12,
    color: '#d32f2f',
    fontWeight: '500',
  },
  radius: {
    fontSize: 11,
    color: '#999',
  },
  arrow: {
    padding: 16,
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 20,
    color: '#ccc',
  },
});
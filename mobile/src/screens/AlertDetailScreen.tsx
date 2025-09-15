import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { firestore } from '../../services/firebase';
import { Alert as AlertType, Sighting } from '../types/user';
import { locationService } from '../services/locationService';

interface AlertDetailScreenProps {
  navigation: any;
  route: {
    params: {
      alert: AlertType;
    };
  };
}

export default function AlertDetailScreen({ navigation, route }: AlertDetailScreenProps) {
  const { alert } = route.params;
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    // Set up real-time listener for sightings
    const unsubscribe = setupSightingsListener();
    return () => unsubscribe();
  }, [alert.alertId]);

  const setupSightingsListener = () => {
    const sightingsRef = collection(firestore, 'sightings');
    const q = query(
      sightingsRef,
      where('alertId', '==', alert.alertId),
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const sightingsData: Sighting[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        sightingsData.push({
          ...data,
          sightingId: doc.id,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as Sighting);
      });
      
      setSightings(sightingsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching sightings:', error);
      setLoading(false);
    });
  };

  const handleReportSighting = () => {
    navigation.navigate('ReportSighting', { alert });
  };

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
      return `${diffMinutes} minutes ago`;
    } else if (diffMinutes < 1440) { // 24 hours
      const hours = Math.floor(diffMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const getLocationName = (location: { lat: number; lng: number }): string => {
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryEmoji}>{categoryInfo.emoji}</Text>
          <Text style={[styles.categoryLabel, { color: categoryInfo.color }]}>
            {categoryInfo.label}
          </Text>
        </View>
        <Text style={styles.timeAgo}>{getTimeAgo(alert.lastSeenAt)}</Text>
      </View>

      <Text style={styles.title}>{alert.title}</Text>

      {alert.photoUrl && (
        <Image source={{ uri: alert.photoUrl }} style={styles.photo} />
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{alert.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Last Seen Location</Text>
        <View style={styles.locationInfo}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText}>
            {getLocationName(alert.lastSeen)}
          </Text>
        </View>
        <Text style={styles.coordinates}>
          {alert.lastSeen.lat.toFixed(6)}, {alert.lastSeen.lng.toFixed(6)}
        </Text>
        <Text style={styles.radiusInfo}>
          Alert radius: {alert.radiusKm}km
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Map & Sightings</Text>
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: alert.lastSeen.lat,
              longitude: alert.lastSeen.lng,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            onMapReady={() => setMapReady(true)}
          >
            {/* Alert location marker */}
            <Marker
              coordinate={{
                latitude: alert.lastSeen.lat,
                longitude: alert.lastSeen.lng,
              }}
              title="Last Seen Location"
              description={getLocationName(alert.lastSeen)}
              pinColor="#e74c3c"
            />

            {/* Sightings markers */}
            {sightings.map((sighting) => (
              <Marker
                key={sighting.sightingId}
                coordinate={{
                  latitude: sighting.location.lat,
                  longitude: sighting.location.lng,
                }}
                title="Sighting Reported"
                description={`Reported ${getTimeAgo(sighting.timestamp)}`}
                pinColor="#3498db"
              />
            ))}
          </MapView>
        </View>

        <View style={styles.sightingsInfo}>
          <View style={styles.sightingStat}>
            <Text style={styles.sightingStatNumber}>{sightings.length}</Text>
            <Text style={styles.sightingStatLabel}>Sightings Reported</Text>
          </View>
          {alert.lastSightingAt && (
            <View style={styles.sightingStat}>
              <Text style={styles.sightingStatLabel}>Last Sighting:</Text>
              <Text style={styles.sightingStatTime}>
                {getTimeAgo(alert.lastSightingAt)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.reportButton}
          onPress={handleReportSighting}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.reportButtonText}>Report Sighting</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={() => {
            Alert.alert(
              'Emergency Contact',
              'Call 10111 immediately for emergencies',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Call 10111', onPress: () => {/* In production, this would open the phone dialer */} }
              ]
            );
          }}
        >
          <Ionicons name="call" size={20} color="#fff" />
          <Text style={styles.emergencyButtonText}>Call 10111</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          If you see anything related to this alert, do NOT approach. Call 10111 immediately or use this app to report a sighting.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  photo: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  coordinates: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  radiusInfo: {
    fontSize: 14,
    color: '#666',
  },
  mapContainer: {
    height: 250,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  map: {
    flex: 1,
  },
  sightingsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sightingStat: {
    alignItems: 'center',
  },
  sightingStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
  },
  sightingStatLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  sightingStatTime: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  reportButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 8,
  },
  reportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emergencyButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 8,
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
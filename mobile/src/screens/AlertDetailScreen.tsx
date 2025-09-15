import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { getSightingsForAlert } from '../services/firebase';
import { calculateDistance } from '../services/locationService';

interface AlertDetailScreenProps {
  alert: any;
  user: any;
  onReportSighting: (alert: any) => void;
  onBack: () => void;
}

export default function AlertDetailScreen({ 
  alert, 
  user, 
  onReportSighting, 
  onBack 
}: AlertDetailScreenProps) {
  const [sightings, setSightings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = getSightingsForAlert(alert.id, (sightingsData) => {
      setSightings(sightingsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [alert.id]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-ZA');
  };

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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.categoryBadge}>
            <Text style={[styles.categoryText, { color: getCategoryColor(alert.category) }]}>
              {getCategoryLabel(alert.category)}
            </Text>
          </View>
        </View>

        {/* Photo */}
        {alert.photoUrl && (
          <Image source={{ uri: alert.photoUrl }} style={styles.photo} />
        )}

        {/* Alert Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{alert.title}</Text>
          <Text style={styles.description}>{alert.description}</Text>
          
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Last Seen:</Text>
              <Text style={styles.metaValue}>{formatDate(alert.lastSeenAt)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Created:</Text>
              <Text style={styles.metaValue}>{formatDate(alert.createdAt)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Radius:</Text>
              <Text style={styles.metaValue}>{alert.radiusKm || 50} km</Text>
            </View>
          </View>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <Text style={styles.mapTitle}>Last Seen Location</Text>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: alert.lastSeen.lat,
              longitude: alert.lastSeen.lng,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            {/* Alert location marker */}
            <Marker
              coordinate={{
                latitude: alert.lastSeen.lat,
                longitude: alert.lastSeen.lng,
              }}
              title="Last Seen"
              description={alert.title}
              pinColor="red"
            />
            
            {/* Sightings markers */}
            {sightings.map((sighting, index) => (
              <Marker
                key={sighting.id}
                coordinate={{
                  latitude: sighting.location.lat,
                  longitude: sighting.location.lng,
                }}
                title={`Sighting ${index + 1}`}
                description={formatDate(sighting.timestamp)}
                pinColor="blue"
              />
            ))}
          </MapView>
        </View>

        {/* Sightings List */}
        {sightings.length > 0 && (
          <View style={styles.sightingsContainer}>
            <Text style={styles.sightingsTitle}>
              Recent Sightings ({sightings.length})
            </Text>
            {sightings.map((sighting, index) => (
              <View key={sighting.id} style={styles.sightingItem}>
                <Text style={styles.sightingTime}>
                  {formatDate(sighting.timestamp)}
                </Text>
                <Text style={styles.sightingLocation}>
                  {sighting.location.lat.toFixed(4)}, {sighting.location.lng.toFixed(4)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Report Sighting Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => onReportSighting(alert)}
        >
          <Text style={styles.reportButtonText}>Report Sighting</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  categoryBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  photo: {
    width: width,
    height: 200,
    resizeMode: 'cover',
  },
  detailsContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  metaContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  metaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 14,
    color: '#333',
  },
  mapContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  map: {
    height: 200,
    borderRadius: 8,
  },
  sightingsContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  sightingsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sightingItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sightingTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  sightingLocation: {
    fontSize: 12,
    color: '#999',
  },
  bottomContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  reportButton: {
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  reportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
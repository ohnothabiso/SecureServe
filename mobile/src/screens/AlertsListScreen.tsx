import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { getActiveAlerts, getUserProfile } from '../services/firebase';
import { getCurrentLocation, isWithinRadius } from '../services/locationService';
import AlertCard from '../components/AlertCard';

interface AlertsListScreenProps {
  user: any;
  onAlertPress: (alert: any) => void;
}

export default function AlertsListScreen({ user, onAlertPress }: AlertsListScreenProps) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Get user location
    getCurrentLocation().then(location => {
      if (location) {
        setUserLocation({
          lat: location.latitude,
          lng: location.longitude
        });
      }
    });

    // Subscribe to alerts
    const unsubscribe = getActiveAlerts((alertsData) => {
      setAlerts(alertsData);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (userLocation && alerts.length > 0) {
      // Filter alerts by distance
      const nearbyAlerts = alerts.filter(alert => {
        if (!alert.lastSeen || !userLocation) return false;
        
        const distance = isWithinRadius(
          userLocation.lat,
          userLocation.lng,
          alert.lastSeen.lat,
          alert.lastSeen.lng,
          alert.radiusKm || 50
        );
        
        return distance;
      });
      
      setFilteredAlerts(nearbyAlerts);
    } else {
      setFilteredAlerts(alerts);
    }
  }, [alerts, userLocation]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh user location
      const location = await getCurrentLocation();
      if (location) {
        setUserLocation({
          lat: location.latitude,
          lng: location.longitude
        });
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderAlert = ({ item }: { item: any }) => (
    <AlertCard
      alert={item}
      userLocation={userLocation}
      onPress={() => onAlertPress(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Active Alerts</Text>
      <Text style={styles.emptyText}>
        {userLocation 
          ? "No alerts within your area at the moment."
          : "Enable location services to see relevant alerts."
        }
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Alerts</Text>
        <Text style={styles.subtitle}>
          {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''} near you
        </Text>
      </View>

      <FlatList
        data={filteredAlerts}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});
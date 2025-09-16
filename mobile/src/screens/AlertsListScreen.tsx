import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { firestore } from '../../services/firebase';
import { locationService } from '../../services/locationService';
import { Alert as AlertType } from '../types/user';
import AlertCard from '../components/AlertCard';

interface AlertsListScreenProps {
  navigation: any;
  route?: any;
}

export default function AlertsListScreen({ navigation, route }: AlertsListScreenProps) {
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user location on component mount and when screen is focused
  useFocusEffect(
    useCallback(() => {
      getCurrentLocation();
    }, [])
  );

  useEffect(() => {
    // Set up real-time listener for alerts
    const unsubscribe = setupAlertsListener();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Filter alerts based on user location
    if (userLocation) {
      filterAlertsByLocation();
    }
  }, [alerts, userLocation]);

  const setupAlertsListener = () => {
    const alertsRef = collection(firestore, 'alerts');
    const q = query(
      alertsRef,
      where('active', '==', true),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const alertsData: AlertType[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        alertsData.push({
          ...data,
          alertId: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastSeenAt: data.lastSeenAt?.toDate() || new Date(),
          lastSightingAt: data.lastSightingAt?.toDate(),
          lastUpdated: data.lastUpdated?.toDate(),
        } as AlertType);
      });
      
      setAlerts(alertsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching alerts:', error);
      setLoading(false);
    });
  };

  const getCurrentLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setUserLocation({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const filterAlertsByLocation = () => {
    if (!userLocation) {
      setFilteredAlerts(alerts);
      return;
    }

    const filtered = alerts.filter((alert) => {
      const distance = locationService.calculateDistance(
        userLocation,
        alert.lastSeen
      );
      return distance <= alert.radiusKm;
    });

    setFilteredAlerts(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getCurrentLocation();
    setRefreshing(false);
  };

  const handleAlertPress = (alert: AlertType) => {
    navigation.navigate('AlertDetail', { alert });
  };

  const renderAlertCard = ({ item }: { item: AlertType }) => (
    <AlertCard
      alert={item}
      userLocation={userLocation}
      onPress={() => handleAlertPress(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No Active Alerts</Text>
      <Text style={styles.emptyStateText}>
        There are currently no active alerts in your area.
      </Text>
      <Text style={styles.emptyStateSubtext}>
        Make sure location services are enabled to see relevant alerts.
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Active Alerts</Text>
      {userLocation ? (
        <Text style={styles.headerSubtitle}>
          Showing alerts within 50km of your location
        </Text>
      ) : (
        <Text style={styles.headerSubtitle}>
          Enable location to see relevant alerts
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={styles.loadingText}>Loading alerts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredAlerts}
        renderItem={renderAlertCard}
        keyExtractor={(item) => item.alertId}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#e74c3c']}
            tintColor="#e74c3c"
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});
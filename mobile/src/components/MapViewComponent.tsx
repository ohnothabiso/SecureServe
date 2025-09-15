import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface MapViewComponentProps {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
  markers?: Array<{
    latitude: number;
    longitude: number;
    title?: string;
    description?: string;
    pinColor?: string;
  }>;
  onPress?: (event: any) => void;
  style?: any;
}

export default function MapViewComponent({
  latitude,
  longitude,
  latitudeDelta = 0.01,
  longitudeDelta = 0.01,
  markers = [],
  onPress,
  style,
}: MapViewComponentProps) {
  return (
    <View style={[styles.container, style]}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta,
          longitudeDelta,
        }}
        onPress={onPress}
        showsUserLocation
        showsMyLocationButton
      >
        {/* Default marker for center location */}
        <Marker
          coordinate={{ latitude, longitude }}
          title="Location"
          pinColor="red"
        />
        
        {/* Additional markers */}
        {markers.map((marker, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title}
            description={marker.description}
            pinColor={marker.pinColor || 'blue'}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
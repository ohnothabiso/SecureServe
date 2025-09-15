import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import MapView, { Marker } from 'react-native-maps';
import { getCurrentLocation } from '../services/locationService';
import { createSighting, uploadImage } from '../services/firebase';

interface ReportSightingScreenProps {
  alert: any;
  user: any;
  onBack: () => void;
  onSightingReported: () => void;
}

export default function ReportSightingScreen({ 
  alert, 
  user, 
  onBack, 
  onSightingReported 
}: ReportSightingScreenProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get current location as default
    getCurrentLocation().then(loc => {
      if (loc) {
        setLocation({
          lat: loc.latitude,
          lng: loc.longitude
        });
      }
    });
  }, []);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Select Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLocation({ lat: latitude, lng: longitude });
  };

  const useMyLocation = async () => {
    const loc = await getCurrentLocation();
    if (loc) {
      setLocation({
        lat: loc.latitude,
        lng: loc.longitude
      });
    } else {
      Alert.alert('Error', 'Could not get your current location');
    }
  };

  const handleSubmit = async () => {
    if (!location) {
      Alert.alert('Error', 'Please select a location for the sighting');
      return;
    }

    setLoading(true);
    try {
      let photoUrl = null;
      
      // Upload photo if selected
      if (photoUri) {
        const response = await fetch(photoUri);
        const blob = await response.blob();
        
        // Compress image
        const compressedImage = await ImageManipulator.manipulateAsync(
          photoUri,
          [{ resize: { width: 800 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        const compressedResponse = await fetch(compressedImage.uri);
        const compressedBlob = await compressedResponse.blob();
        
        const fileName = `sightings/sighting_${Date.now()}.jpg`;
        photoUrl = await uploadImage(fileName, compressedBlob);
      }

      // Create sighting
      const sightingData = {
        sightingId: `sighting_${Date.now()}`,
        alertId: alert.id,
        reportedBy: user.uid,
        location,
        photoUrl,
      };

      await createSighting(sightingData);
      
      Alert.alert('Success', 'Sighting reported successfully! Thank you for your help.', [
        { text: 'OK', onPress: onSightingReported }
      ]);
      
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Report Sighting</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Alert Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Details</Text>
          <Text style={styles.alertTitle}>{alert.title}</Text>
          <Text style={styles.alertDescription}>{alert.description}</Text>
        </View>

        {/* Photo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photo (Optional)</Text>
          {photoUri ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photoUri }} style={styles.photo} />
              <TouchableOpacity style={styles.changePhotoButton} onPress={showImageOptions}>
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addPhotoButton} onPress={showImageOptions}>
              <Text style={styles.addPhotoText}>+ Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sighting Location</Text>
            <TouchableOpacity onPress={useMyLocation}>
              <Text style={styles.useLocationText}>Use My Location</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.instructionText}>
            Tap on the map to mark where you saw this person/vehicle, or use "Use My Location" for your current position.
          </Text>
          
          {location && (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: location.lat,
                longitude: location.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              onPress={handleMapPress}
            >
              <Marker
                coordinate={location}
                title="Sighting Location"
                pinColor="blue"
              />
              <Marker
                coordinate={{
                  latitude: alert.lastSeen.lat,
                  longitude: alert.lastSeen.lng,
                }}
                title="Original Alert Location"
                pinColor="red"
              />
            </MapView>
          )}
          
          {location && (
            <Text style={styles.locationText}>
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </Text>
          )}
        </View>

        {/* Important Notice */}
        <View style={styles.noticeContainer}>
          <Text style={styles.noticeTitle}>Important Notice</Text>
          <Text style={styles.noticeText}>
            • Do NOT approach the person/vehicle if you see them{'\n'}
            • Call 10111 (SAPS) immediately{'\n'}
            • Stay safe and report only what you can observe safely{'\n'}
            • Your report will be shared with authorities
          </Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Reporting...' : 'Report Sighting'}
          </Text>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 8,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  alertDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  photoContainer: {
    alignItems: 'center',
  },
  photo: {
    width: width - 64,
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  addPhotoButton: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: 16,
    color: '#666',
  },
  changePhotoButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  changePhotoText: {
    fontSize: 14,
    color: '#666',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  map: {
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  useLocationText: {
    fontSize: 14,
    color: '#d32f2f',
    fontWeight: '500',
  },
  noticeContainer: {
    backgroundColor: '#fff3cd',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 18,
  },
  bottomContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  submitButton: {
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
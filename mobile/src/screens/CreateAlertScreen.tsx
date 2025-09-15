import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Ionicons } from '@expo/vector-icons';
import { firestore, storage } from '../../services/firebase';
import { locationService } from '../../services/locationService';
import { AlertCategory } from '../types/user';

interface CreateAlertScreenProps {
  navigation: any;
}

export default function CreateAlertScreen({ navigation }: CreateAlertScreenProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<AlertCategory['value']>('missing_person');
  const [radiusKm, setRadiusKm] = useState('50');
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  const categories: AlertCategory[] = [
    { value: 'missing_person', label: 'Missing Person', emoji: '👶' },
    { value: 'stolen_vehicle', label: 'Stolen Vehicle', emoji: '🚗' },
    { value: 'missing_elderly', label: 'Missing Elderly', emoji: '👴' },
  ];

  const handleTakePhoto = async () => {
    try {
      setPhotoLoading(true);
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleSelectPhoto = async () => {
    try {
      setPhotoLoading(true);
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Photo library permission is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert('Error', 'Failed to select photo');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      const currentLocation = await locationService.getCurrentLocation();
      if (currentLocation) {
        setLocation({
          lat: currentLocation.coords.latitude,
          lng: currentLocation.coords.longitude,
        });
        Alert.alert('Success', 'Current location set');
      } else {
        Alert.alert('Error', 'Unable to get current location');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const uploadPhoto = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const filename = `alerts/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Please set a location');
      return;
    }

    const radius = parseInt(radiusKm);
    if (isNaN(radius) || radius < 1 || radius > 200) {
      Alert.alert('Error', 'Please enter a valid radius (1-200 km)');
      return;
    }

    setLoading(true);
    try {
      let photoUrl = '';
      if (photo) {
        photoUrl = await uploadPhoto(photo);
      }

      const alertData = {
        alertId: `alert_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        title: title.trim(),
        category,
        description: description.trim(),
        photoUrl,
        lastSeen: location,
        lastSeenAt: serverTimestamp(),
        createdBy: 'current_user_uid', // This should be the actual user UID
        createdAt: serverTimestamp(),
        active: true,
        radiusKm: radius,
        sightingCount: 0,
      };

      await addDoc(collection(firestore, 'alerts'), alertData);

      Alert.alert(
        'Success',
        'Alert created successfully and notifications sent to users in the area',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating alert:', error);
      Alert.alert('Error', 'Failed to create alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getLocationName = (loc: { lat: number; lng: number }): string => {
    const { lat, lng } = loc;
    
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

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Information</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Alert Title (e.g., Missing child - Sipho Nkosi)"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Category</Text>
            <Picker
              selectedValue={category}
              onValueChange={setCategory}
              style={styles.picker}
            >
              {categories.map((cat) => (
                <Picker.Item
                  key={cat.value}
                  label={`${cat.emoji} ${cat.label}`}
                  value={cat.value}
                />
              ))}
            </Picker>
          </View>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Detailed description of the person, vehicle, or situation..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photo (Optional)</Text>
          
          <View style={styles.photoButtons}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={handleTakePhoto}
              disabled={photoLoading}
            >
              <Ionicons name="camera" size={20} color="#e74c3c" />
              <Text style={styles.photoButtonText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.photoButton}
              onPress={handleSelectPhoto}
              disabled={photoLoading}
            >
              <Ionicons name="images" size={20} color="#e74c3c" />
              <Text style={styles.photoButtonText}>Select Photo</Text>
            </TouchableOpacity>
          </View>

          {photoLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#e74c3c" />
              <Text style={styles.loadingText}>Processing photo...</Text>
            </View>
          )}

          {photo && (
            <View style={styles.photoPreview}>
              <Text style={styles.photoPreviewText}>Photo selected ✓</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last Seen Location</Text>
          
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleUseCurrentLocation}
          >
            <Ionicons name="location" size={20} color="#e74c3c" />
            <Text style={styles.locationButtonText}>Use My Current Location</Text>
          </TouchableOpacity>

          {location && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                📍 {getLocationName(location)}
              </Text>
              <Text style={styles.coordinates}>
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Radius</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Radius in kilometers (default: 50)"
            value={radiusKm}
            onChangeText={setRadiusKm}
            keyboardType="numeric"
            maxLength={3}
          />
          
          <Text style={styles.radiusHelp}>
            Users within this radius will receive notifications about this alert
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Create Alert & Send Notifications</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This alert will be sent to all users within the specified radius. Make sure all information is accurate.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  picker: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  photoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e74c3c',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  photoButtonText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
  },
  photoPreview: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  photoPreviewText: {
    color: '#27ae60',
    fontSize: 14,
    fontWeight: '500',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e74c3c',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  locationButtonText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  locationInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  radiusHelp: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  actions: {
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
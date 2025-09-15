import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { createAlert, uploadImage } from '../services/firebase';

interface CreateAlertScreenProps {
  user: any;
  onBack: () => void;
  onAlertCreated: () => void;
}

export default function CreateAlertScreen({ user, onBack, onAlertCreated }: CreateAlertScreenProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('missing_person');
  const [radiusKm, setRadiusKm] = useState('50');
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
    if (!title || !description || !location) {
      Alert.alert('Error', 'Please fill in all required fields');
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
        
        const fileName = `alerts/alert_${Date.now()}.jpg`;
        photoUrl = await uploadImage(fileName, compressedBlob);
      }

      // Create alert
      const alertData = {
        alertId: `alert_${Date.now()}`,
        title,
        description,
        category,
        photoUrl,
        lastSeen: location,
        radiusKm: parseInt(radiusKm) || 50,
        createdBy: user.uid,
      };

      await createAlert(alertData);
      
      Alert.alert('Success', 'Alert created successfully!', [
        { text: 'OK', onPress: onAlertCreated }
      ]);
      
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryOptions = () => [
    { value: 'missing_person', label: 'Missing Person' },
    { value: 'stolen_vehicle', label: 'Stolen Vehicle' },
    { value: 'missing_elderly', label: 'Missing Elderly' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Alert</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Photo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photo</Text>
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

        {/* Alert Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Details</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Alert title (e.g., Missing child — Sipho Nkosi)"
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description (age, clothing, last seen details, etc.)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {getCategoryOptions().map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.categoryButton,
                      category === option.value && styles.categoryButtonSelected
                    ]}
                    onPress={() => setCategory(option.value)}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      category === option.value && styles.categoryButtonTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Radius (km)</Text>
              <TextInput
                style={styles.input}
                placeholder="50"
                value={radiusKm}
                onChangeText={setRadiusKm}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Last Seen Location</Text>
            <TouchableOpacity onPress={useMyLocation}>
              <Text style={styles.useLocationText}>Use My Location</Text>
            </TouchableOpacity>
          </View>
          
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
                title="Last Seen Location"
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
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Creating Alert...' : 'Create Alert'}
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  categoryButtonSelected: {
    backgroundColor: '#d32f2f',
    borderColor: '#d32f2f',
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#666',
  },
  categoryButtonTextSelected: {
    color: 'white',
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
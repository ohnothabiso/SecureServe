import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { auth, firestore } from '../../services/firebase';
import { notificationService } from '../../services/notificationService';
import { User } from '../types/user';

interface SettingsScreenProps {
  navigation: any;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [user, setUser] = useState<User | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(firestore, 'users', auth.currentUser.uid));
        if (userDoc.exists) {
          const userData = userDoc.data() as User;
          setUser({ ...userData, uid: auth.currentUser.uid });
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              if (auth.currentUser) {
                await notificationService.unregisterToken(auth.currentUser.uid);
              }
              await signOut(auth);
            } catch (error) {
              console.error('Error signing out:', error);
            }
          },
        },
      ]
    );
  };

  const toggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    
    if (auth.currentUser) {
      try {
        if (value) {
          await notificationService.registerToken(auth.currentUser.uid);
        } else {
          await notificationService.unregisterToken(auth.currentUser.uid);
        }
      } catch (error) {
        console.error('Error toggling notifications:', error);
        setNotificationsEnabled(!value); // Revert on error
      }
    }
  };

  const toggleLocation = async (value: boolean) => {
    setLocationEnabled(value);
    
    if (auth.currentUser) {
      try {
        const userRef = doc(firestore, 'users', auth.currentUser.uid);
        if (value) {
          // Location will be updated by location service
          await updateDoc(userRef, {
            locationEnabled: true,
          });
        } else {
          await updateDoc(userRef, {
            locationEnabled: false,
            lastLocation: null,
          });
        }
      } catch (error) {
        console.error('Error toggling location:', error);
        setLocationEnabled(!value); // Revert on error
      }
    }
  };

  const openAbout = () => {
    Alert.alert(
      'About AmberSA',
      'AmberSA - Community Safety Network\n\nVersion 1.0.0\n\nAmberSA helps keep South African communities safe through geo-targeted alerts and real-time sighting reports.\n\nFor emergencies, always call 10111.',
      [{ text: 'OK' }]
    );
  };

  const openPrivacy = () => {
    Alert.alert(
      'Privacy Policy',
      'AmberSA collects minimal data to provide safety services:\n\n• Location data (only when enabled)\n• Alert and sighting reports\n• Push notification tokens\n\nYour data is used solely for community safety purposes and is not shared with third parties.',
      [{ text: 'OK' }]
    );
  };

  const openHelp = () => {
    Alert.alert(
      'Help & Support',
      'How to use AmberSA:\n\n1. Enable location and notifications\n2. View active alerts in your area\n3. Report sightings with photos and location\n4. Call 10111 for emergencies\n\nFor technical support, contact your local authorities.',
      [{ text: 'OK' }]
    );
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle: string,
    rightElement: React.ReactNode
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={24} color="#e74c3c" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.settingRight}>
        {rightElement}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        {user && (
          <Text style={styles.userInfo}>
            {user.displayName} • {user.role === 'admin' ? 'Admin' : 'User'}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        {renderSettingItem(
          'person-circle',
          'Profile',
          user?.displayName || 'Loading...',
          <Ionicons name="chevron-forward" size={20} color="#999" />
        )}
        
        {renderSettingItem(
          'call',
          'Phone',
          user?.phone || 'Not set',
          <Ionicons name="chevron-forward" size={20} color="#999" />
        )}
        
        {user?.role === 'admin' && (
          renderSettingItem(
            'shield-checkmark',
            'Admin Status',
            user.verified ? 'Verified Admin' : 'Pending Verification',
            <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
          )
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications & Location</Text>
        
        {renderSettingItem(
          'notifications',
          'Push Notifications',
          'Receive alerts for incidents near you',
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: '#ddd', true: '#e74c3c' }}
            thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
          />
        )}
        
        {renderSettingItem(
          'location',
          'Location Services',
          'Share location for relevant alerts',
          <Switch
            value={locationEnabled}
            onValueChange={toggleLocation}
            trackColor={{ false: '#ddd', true: '#e74c3c' }}
            thumbColor={locationEnabled ? '#fff' : '#f4f3f4'}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Help & Support</Text>
        
        <TouchableOpacity
          style={styles.settingItem}
          onPress={openHelp}
        >
          <View style={styles.settingIcon}>
            <Ionicons name="help-circle" size={24} color="#e74c3c" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Help & FAQ</Text>
            <Text style={styles.settingSubtitle}>How to use AmberSA</Text>
          </View>
          <View style={styles.settingRight}>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.settingItem}
          onPress={openPrivacy}
        >
          <View style={styles.settingIcon}>
            <Ionicons name="shield" size={24} color="#e74c3c" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Privacy Policy</Text>
            <Text style={styles.settingSubtitle}>How we protect your data</Text>
          </View>
          <View style={styles.settingRight}>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.settingItem}
          onPress={openAbout}
        >
          <View style={styles.settingIcon}>
            <Ionicons name="information-circle" size={24} color="#e74c3c" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>About AmberSA</Text>
            <Text style={styles.settingSubtitle}>Version 1.0.0</Text>
          </View>
          <View style={styles.settingRight}>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out" size={20} color="#e74c3c" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          For emergencies, always call 10111
        </Text>
        <Text style={styles.footerText}>
          AmberSA - Community Safety Network
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
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    width: 40,
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  settingRight: {
    marginLeft: 12,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e74c3c',
    borderRadius: 8,
    margin: 16,
  },
  signOutText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 4,
  },
});
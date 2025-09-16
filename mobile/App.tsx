import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import AlertsListScreen from './src/screens/AlertsListScreen';
import AlertDetailScreen from './src/screens/AlertDetailScreen';
import CreateAlertScreen from './src/screens/CreateAlertScreen';
import ReportSightingScreen from './src/screens/ReportSightingScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Import services
import { auth } from './src/services/firebase';
import { notificationService } from './src/services/notificationService';
import { locationService } from './src/services/locationService';

// Types
import { User } from './src/types/user';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Deep linking configuration
const linking = {
  prefixes: ['amberapp://', 'https://ambersa.app'],
  config: {
    screens: {
      Main: {
        screens: {
          Alerts: {
            screens: {
              AlertDetail: 'alert/:alertId',
            },
          },
        },
      },
    },
  },
};

// Main tab navigator for authenticated users
function MainTabs({ user }: { user: User }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Alerts') {
            iconName = focused ? 'alert-circle' : 'alert-circle-outline';
          } else if (route.name === 'CreateAlert') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#e74c3c',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#e74c3c',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Alerts" 
        component={AlertsStack}
        options={{ title: 'Active Alerts' }}
      />
      {user.role === 'admin' && user.verified && (
        <Tab.Screen 
          name="CreateAlert" 
          component={CreateAlertScreen}
          options={{ title: 'Create Alert' }}
        />
      )}
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

// Alerts stack navigator
function AlertsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="AlertsList" 
        component={AlertsListScreen}
        options={{ title: 'Active Alerts' }}
      />
      <Stack.Screen 
        name="AlertDetail" 
        component={AlertDetailScreen}
        options={{ title: 'Alert Details' }}
      />
      <Stack.Screen 
        name="ReportSighting" 
        component={ReportSightingScreen}
        options={{ title: 'Report Sighting' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize services
    const initializeApp = async () => {
      try {
        // Request permissions
        await notificationService.requestPermissions();
        await locationService.requestPermissions();

        // Set up notification listeners
        const notificationListener = Notifications.addNotificationReceivedListener(notification => {
          console.log('Notification received:', notification);
        });

        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
          console.log('Notification response:', response);
          
          // Handle deep link from notification
          const data = response.notification.request.content.data;
          if (data?.alertId) {
            // Navigate to alert detail
            // This will be handled by the linking configuration
          }
        });

        // Listen for deep links
        const linkingListener = Linking.addEventListener('url', handleDeepLink);

        // Listen for auth state changes
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
          if (firebaseUser) {
            // Get user document from Firestore
            const userDoc = await auth.firestore().collection('users').doc(firebaseUser.uid).get();
            if (userDoc.exists) {
              const userData = userDoc.data() as User;
              setUser({ ...userData, uid: firebaseUser.uid });
              
              // Register FCM token
              await notificationService.registerToken(firebaseUser.uid);
              
              // Update user location
              await locationService.updateUserLocation(firebaseUser.uid);
            }
          } else {
            setUser(null);
          }
          setLoading(false);
        });

        return () => {
          notificationListener.remove();
          responseListener.remove();
          linkingListener?.remove();
          unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing app:', error);
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleDeepLink = (url: string) => {
    console.log('Deep link received:', url);
    // Deep linking is handled automatically by React Navigation
  };

  if (loading) {
    return null; // You could show a loading screen here
  }

  return (
    <NavigationContainer linking={linking}>
      <StatusBar style="light" />
      {user ? (
        <MainTabs user={user} />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
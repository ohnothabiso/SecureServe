import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, getUserProfile } from './src/services/firebase';
import { setupNotificationListeners } from './src/services/notificationService';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import AlertsListScreen from './src/screens/AlertsListScreen';
import AlertDetailScreen from './src/screens/AlertDetailScreen';
import CreateAlertScreen from './src/screens/CreateAlertScreen';
import ReportSightingScreen from './src/screens/ReportSightingScreen';

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up notification listeners
    setupNotificationListeners();

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // Get user profile
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLoginSuccess = async (user: any) => {
    setUser(user);
    const profile = await getUserProfile(user.uid);
    setUserProfile(profile);
  };

  const handleLogout = () => {
    auth.signOut();
  };

  if (loading) {
    return null; // You could add a loading screen here
  }

  if (!user || !userProfile) {
    return (
      <>
        <StatusBar style="auto" />
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="AlertsList">
          {(props) => (
            <AlertsListScreen
              {...props}
              user={userProfile}
              onAlertPress={(alert) => props.navigation.navigate('AlertDetail', { alert })}
            />
          )}
        </Stack.Screen>
        
        <Stack.Screen name="AlertDetail">
          {(props) => (
            <AlertDetailScreen
              {...props}
              alert={props.route.params.alert}
              user={userProfile}
              onReportSighting={(alert) => props.navigation.navigate('ReportSighting', { alert })}
              onBack={() => props.navigation.goBack()}
            />
          )}
        </Stack.Screen>
        
        <Stack.Screen name="ReportSighting">
          {(props) => (
            <ReportSightingScreen
              {...props}
              alert={props.route.params.alert}
              user={userProfile}
              onBack={() => props.navigation.goBack()}
              onSightingReported={() => props.navigation.goBack()}
            />
          )}
        </Stack.Screen>
        
        {userProfile.role === 'admin' && userProfile.verified && (
          <Stack.Screen name="CreateAlert">
            {(props) => (
              <CreateAlertScreen
                {...props}
                user={userProfile}
                onBack={() => props.navigation.goBack()}
                onAlertCreated={() => props.navigation.goBack()}
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
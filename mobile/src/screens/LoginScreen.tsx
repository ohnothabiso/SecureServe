import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { signInWithEmail, createUserWithEmail, createUserProfile } from '../services/firebase';
import { registerForPushNotifications } from '../services/notificationService';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmail(email, password);
      const user = userCredential.user;
      
      // Register for push notifications
      await registerForPushNotifications(user.uid);
      
      onLoginSuccess(user);
    } catch (error: any) {
      Alert.alert('Login Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !displayName || !phone) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmail(email, password);
      const user = userCredential.user;
      
      // Create user profile
      await createUserProfile(user.uid, {
        displayName,
        email,
        phone,
        role: 'user',
        verified: false,
      });
      
      // Register for push notifications
      await registerForPushNotifications(user.uid);
      
      onLoginSuccess(user);
    } catch (error: any) {
      Alert.alert('Sign Up Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>AmberSA</Text>
          <Text style={styles.subtitle}>Community Alert System</Text>
        </View>

        <View style={styles.form}>
          {isSignUp && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number (+27831234567)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={isSignUp ? handleSignUp : handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Login')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={styles.switchText}>
              {isSignUp 
                ? 'Already have an account? Login' 
                : "Don't have an account? Sign Up"
              }
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            For hackathon demo, use these test accounts:
          </Text>
          <Text style={styles.demoText}>
            Admin: admin@ambersa.co.za / password123
          </Text>
          <Text style={styles.demoText}>
            User: user@ambersa.co.za / password123
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    alignItems: 'center',
  },
  switchText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
});
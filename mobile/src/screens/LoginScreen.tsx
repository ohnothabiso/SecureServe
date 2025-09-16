import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { signInWithEmailAndPassword, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../../services/firebase';
import { User } from '../types/user';

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('phone');

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Email login successful:', userCredential.user.uid);
      
      // User will be handled by auth state change in App.tsx
    } catch (error: any) {
      console.error('Email login error:', error);
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      // For demo purposes, we'll use a simple verification
      // In production, you'd use Firebase Phone Auth with reCAPTCHA
      if (phoneNumber === '+27831230001' && verificationCode === '123456') {
        // Simulate successful login for demo admin
        Alert.alert('Success', 'Login successful! Welcome Nokuthula Dlamini');
        setLoading(false);
        return;
      }
      
      if (phoneNumber === '+27831230002' && verificationCode === '123456') {
        // Simulate successful login for demo admin
        Alert.alert('Success', 'Login successful! Welcome Thabo Mokgadi');
        setLoading(false);
        return;
      }
      
      if (phoneNumber === '+27831230003' && verificationCode === '123456') {
        // Simulate successful login for demo user
        Alert.alert('Success', 'Login successful! Welcome Anele Mthethwa');
        setLoading(false);
        return;
      }

      // For other numbers, just simulate sending verification code
      if (!verificationSent) {
        Alert.alert(
          'Verification Code Sent',
          'For demo purposes, use code: 123456'
        );
        setVerificationSent(true);
      } else {
        Alert.alert('Error', 'Invalid verification code. Use: 123456');
      }
    } catch (error: any) {
      console.error('Phone login error:', error);
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const switchLoginMethod = () => {
    setLoginMethod(loginMethod === 'email' ? 'phone' : 'email');
    setVerificationSent(false);
    setVerificationCode('');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>AmberSA</Text>
          <Text style={styles.subtitle}>Community Safety Network</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.methodSelector}>
            <TouchableOpacity
              style={[
                styles.methodButton,
                loginMethod === 'phone' && styles.methodButtonActive
              ]}
              onPress={() => setLoginMethod('phone')}
            >
              <Text style={[
                styles.methodButtonText,
                loginMethod === 'phone' && styles.methodButtonTextActive
              ]}>
                Phone
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.methodButton,
                loginMethod === 'email' && styles.methodButtonActive
              ]}
              onPress={() => setLoginMethod('email')}
            >
              <Text style={[
                styles.methodButtonText,
                loginMethod === 'email' && styles.methodButtonTextActive
              ]}>
                Email
              </Text>
            </TouchableOpacity>
          </View>

          {loginMethod === 'phone' ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Phone Number (e.g., +27831230001)"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
              
              {verificationSent && (
                <TextInput
                  style={styles.input}
                  placeholder="Verification Code (123456 for demo)"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                />
              )}

              <TouchableOpacity
                style={styles.button}
                onPress={handlePhoneLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {verificationSent ? 'Verify & Login' : 'Send Verification Code'}
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={styles.demoInfo}>
                Demo Accounts:{'\n'}
                Admin: +27831230001 (code: 123456){'\n'}
                Admin: +27831230002 (code: 123456){'\n'}
                User: +27831230003 (code: 123456)
              </Text>
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoComplete="email"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />

              <TouchableOpacity
                style={styles.button}
                onPress={handleEmailLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Login with Email</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.switchButton}
            onPress={switchLoginMethod}
          >
            <Text style={styles.switchButtonText}>
              Use {loginMethod === 'email' ? 'Phone' : 'Email'} Instead
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using AmberSA, you agree to help keep your community safe.
          </Text>
          <Text style={styles.footerText}>
            Report sightings responsibly and call 10111 for emergencies.
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
    color: '#e74c3c',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  methodSelector: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 8,
    backgroundColor: '#f1f3f4',
    padding: 4,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  methodButtonActive: {
    backgroundColor: '#e74c3c',
  },
  methodButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  methodButtonTextActive: {
    color: '#fff',
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
  button: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchButtonText: {
    color: '#e74c3c',
    fontSize: 14,
  },
  demoInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 16,
  },
});
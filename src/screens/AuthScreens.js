import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const COLORS = {
  mint: '#6FD8BF',
  teal: '#3F9B84',
  lightGray: '#EDEDED',
  white: '#ffffff',
  bg: '#f8fafc',
  textDark: '#1a2c5e',
  borderLight: '#e5e7eb',
  yellow: '#F2CF1F',
  dark: '#2F2E31',
  darkLight: '#32373b',
};

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🚗</Text>
        <Text style={styles.title}>CarRental</Text>
        <Text style={styles.subtitle}>Find your perfect ride</Text>
      </View>
      
      <View style={[styles.buttonContainer, styles.centerButtons]}>
        <View style={styles.buttonColumn}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('UserLogin')}
          >
            <Text style={styles.primaryButtonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, styles.topSpacing]}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.adminButton, styles.topSpacingSmall]}
            onPress={() => navigation.navigate('AdminLogin')}
          >
            <Text style={styles.adminButtonText}>Admin Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const UserLoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    const result = await login(email, password, false);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.formContainer, styles.loginCard]}>
          <Text style={styles.formTitle}>Welcome Back</Text>
          <Text style={styles.formSubtitle}>Sign in to your account</Text>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={(text) => { setEmail(text); setError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={(text) => { setPassword(text); setError(''); }}
            secureTextEntry
          />
          
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text></Text>
          </TouchableOpacity>
          
          <View style={styles.demoCredentials}>
            <Text style={styles.demoTitle}>Demo Credentials:</Text>
            <Text style={styles.demoText}>Owner: owner@test.com / password</Text>
            <Text style={styles.demoText}>Renter: renter@test.com / password</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const AdminLoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    const result = await login(email, password, true);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>👨‍💼 ADMIN</Text>
          </View>
          <Text style={styles.formTitle}>Admin Portal</Text>
          <Text style={styles.formSubtitle}>Secure administrator access</Text>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <TextInput
            style={styles.input}
            placeholder="Admin Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={(text) => { setEmail(text); setError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={(text) => { setPassword(text); setError(''); }}
            secureTextEntry
          />
          
          <TouchableOpacity
            style={[styles.primaryButton, styles.adminPrimaryButton]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Admin Sign In</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.linkText}>← Back to main screen</Text>
          </TouchableOpacity>
          
          <View style={styles.demoCredentials}>
            <Text style={styles.demoTitle}>Demo Admin Credentials:</Text>
            <Text style={styles.demoText}>admin@test.com / admin123</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('renter');
  const [error, setError] = useState('');
  const { register, isLoading } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    const result = await register(name, email, password, role);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.registerContainer}
    >
      <ScrollView contentContainerStyle={styles.registerScrollContainer}>
        <View style={styles.registerFormContainer}>
          <Text style={styles.registerFormTitle}>Create Account</Text>
          <Text style={styles.registerFormSubtitle}>Join CarRental today</Text>
          
          {error ? <Text style={styles.registerErrorText}>{error}</Text> : null}
          
          <TextInput
            style={styles.registerInput}
            placeholder="Full Name"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={(text) => { setName(text); setError(''); }}
          />
          
          <TextInput
            style={styles.registerInput}
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={(text) => { setEmail(text); setError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.registerInput}
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={(text) => { setPassword(text); setError(''); }}
            secureTextEntry
          />
          
          <TextInput
            style={styles.registerInput}
            placeholder="Confirm Password"
            placeholderTextColor="#9ca3af"
            value={confirmPassword}
            onChangeText={(text) => { setConfirmPassword(text); setError(''); }}
            secureTextEntry
          />
          
          <Text style={styles.registerRoleLabel}>I want to:</Text>
          <View style={styles.registerRoleContainer}>
            <TouchableOpacity
              style={[styles.registerRoleButton, role === 'renter' && styles.registerRoleButtonActive]}
              onPress={() => setRole('renter')}
            >
              <Text style={styles.registerRoleIcon}>🚗</Text>
              <Text style={[styles.registerRoleText, role === 'renter' && styles.registerRoleTextActive]}>Rent a Car</Text>
              <Text style={styles.registerRoleDescription}>Browse and rent vehicles</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.registerRoleButton, role === 'owner' && styles.registerRoleButtonActive]}
              onPress={() => setRole('owner')}
            >
              <Text style={styles.registerRoleIcon}>🔑</Text>
              <Text style={[styles.registerRoleText, role === 'owner' && styles.registerRoleTextActive]}>List My Car</Text>
              <Text style={styles.registerRoleDescription}>Earn money from your car</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.registerPrimaryButton}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerPrimaryButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.registerLinkButton}
            onPress={() => navigation.navigate('UserLogin')}
          >
            <Text style={styles.registerLinkText}>Already have an account? <Text style={styles.registerLinkTextBold}>Sign In</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};


export default AuthScreens;

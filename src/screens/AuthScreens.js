import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  logo: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 40,
  },
  buttonContainer: {
    paddingHorizontal: 30,
    paddingBottom: 60,
  },
  centerButtons: {
    alignItems: 'center',
  },
  buttonColumn: {
    width: '100%',
    maxWidth: 380,
  },
  topSpacing: {
    marginTop: 14,
  },
  topSpacingSmall: {
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: COLORS.teal,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: COLORS.mint,
  },
  secondaryButtonText: {
    color: COLORS.mint,
    fontSize: 18,
    fontWeight: '600',
  },
  adminButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  adminButtonText: {
    color: COLORS.teal,
    fontSize: 16,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 30,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  loginCard: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 380,
    padding: 22,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    color: COLORS.textDark,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 15,
  },
  linkText: {
    fontSize: 14,
  },
  linkTextBold: {
    color: COLORS.teal,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff6b6b',
    marginBottom: 15,
    fontSize: 14,
  },
  roleLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
    fontWeight: '500',
  },
  roleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  roleButtonActive: {
    borderColor: COLORS.mint,
    backgroundColor: 'rgba(111,216,191,0.08)',
  },
  roleIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  roleText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  roleTextActive: {
    color: '#fff',
  },
  roleDescription: {
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
  },
  adminBadge: {
    backgroundColor: COLORS.yellow,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 20,
  },
  adminBadgeText: {
    color: COLORS.textDark,
    fontWeight: '600',
    fontSize: 14,
  },
  adminPrimaryButton: {
    backgroundColor: COLORS.teal,
  },
  demoCredentials: {
    marginTop: 30,
    padding: 15,
    backgroundColor: COLORS.bg,
    borderRadius: 10,
  },
  demoTitle: {
    color: '#6b7280',
    fontSize: 12,
    marginBottom: 5,
    fontWeight: '600',
  },
  demoText: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 3
  },
  registerContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  registerScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  registerFormContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 30,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  registerFormTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  registerFormSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  registerInput: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    color: COLORS.textDark,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  registerRoleLabel: {
    color: COLORS.textDark,
    fontSize: 16,
    marginBottom: 14,
    fontWeight: '600',
  },
  registerRoleContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  registerRoleButton: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.borderLight,
  },
  registerRoleButtonActive: {
    backgroundColor: 'rgba(63,155,132,0.08)',
    borderColor: COLORS.teal,
  },
  registerRoleIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  registerRoleText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  registerRoleTextActive: {
    color: COLORS.teal,
  },
  registerRoleDescription: {
    color: '#6b7280',
    fontSize: 11,
    textAlign: 'center',
  },
  registerPrimaryButton: {
    backgroundColor: COLORS.teal,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 6,
  },
  registerPrimaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  registerErrorText: {
    color: '#ff6b6b',
    marginBottom: 16,
    fontSize: 14,
  },
  registerLinkButton: {
    alignItems: 'center',
    marginTop: 14,
  },
  registerLinkText: {
    fontSize: 14,
    color: '#6b7280',
  },
  registerLinkTextBold: {
    color: COLORS.teal,
    fontWeight: '600',
  }
});

export { WelcomeScreen, UserLoginScreen, AdminLoginScreen, RegisterScreen };

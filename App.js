import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { VehicleProvider } from './src/context/VehicleContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <VehicleProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </VehicleProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

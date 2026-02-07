import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

import { WelcomeScreen, UserLoginScreen, AdminLoginScreen, RegisterScreen } from '../screens/AuthScreens';
import RenterDashboard from '../screens/RenterDashboard';
import OwnerDashboard from '../screens/OwnerDashboard';
import AdminDashboard from '../screens/AdminDashboard';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['http://localhost:8081', 'http://localhost:19006'],
  config: {
    screens: {
      Welcome: '',
      UserLogin: 'login',
      AdminLogin: 'admin-login',
      Register: 'register',
      RenterDashboard: 'renter',
      OwnerDashboard: 'owner',
      AdminDashboard: 'admin',
    },
  },
};

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'fade',
    }}
  >
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="UserLogin" component={UserLoginScreen} />
    <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const RenterStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="RenterDashboard" component={RenterDashboard} />
  </Stack.Navigator>
);

const OwnerStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="OwnerDashboard" component={OwnerDashboard} />
  </Stack.Navigator>
);

const AdminStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { user, isAuthenticated } = useAuth();

  const getNavigator = () => {
    if (!isAuthenticated) {
      return <AuthStack />;
    }

    switch (user?.role) {
      case 'admin':
        return <AdminStack />;
      case 'owner':
        return <OwnerStack />;
      case 'renter':
      default:
        return <RenterStack />;
    }
  };

  return (
    <NavigationContainer linking={linking}>
      {getNavigator()}
    </NavigationContainer>
  );
};

export default AppNavigator;

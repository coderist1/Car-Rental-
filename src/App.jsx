import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks';

import {
  Login,
  Register,
  AdminRegister,
  Dashboard,
  RenterDashboard,
  AdminDashboard,
  Profile,
  ChangePassword,
  Bookings,
  EmailLog,
} from './pages';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on role
    if (user?.role === 'owner') return <Navigate to="/dashboard" replace />;
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/renter" replace />;
  }
  
  return children;
};

// Public Route (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    if (user?.role === 'owner') return <Navigate to="/dashboard" replace />;
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/renter" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/admin-register" element={<PublicRoute><AdminRegister /></PublicRoute>} />
      
      {/* Owner Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Renter Routes */}
      <Route 
        path="/renter" 
        element={
          <ProtectedRoute allowedRoles={['renter']}>
            <RenterDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Shared Protected Routes */}
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/change-password" 
        element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/bookings" 
        element={
          <ProtectedRoute>
            <Bookings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/email-log" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <EmailLog />
          </ProtectedRoute>
        } 
      />
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;

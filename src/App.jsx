import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { VehicleProvider } from './context/VehicleContext';
import { LogReportProvider } from './context/LogReportContext';
import { DamageReportProvider } from './context/DamageReportContext';
import { FeedbackProvider } from './context/FeedbackContext';
import {
  SplashPage,
  LandingPage,
  Login,
  Register,
  AdminRegister,
  ForgotPassword, // Requirement: Ensure all new components are imported
  Dashboard,
  RenterDashboard,
  AdminDashboard,
  Profile,
  ChangePassword,
  Bookings,
  EmailLog,
} from './pages';

// Authentication is intentionally disabled in the deployed web app.
const ProtectedRoute = ({ children }) => children;

const PublicRoute = ({ children }) => children;

function App() {
  return (
    <BrowserRouter
      basename={import.meta.env.BASE_URL}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AuthProvider>
        <VehicleProvider>
          <LogReportProvider>
            <DamageReportProvider>
            <FeedbackProvider>
            {/* Lab Requirement: Semantic Routing & SPA Fallback Support */}
            <Routes>
              {/* Landing Page */}
              <Route path="/LandingPage" element={<LandingPage />} />

              {/* Public Routes - Lab Requirement: User flow optimization */}
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/admin-register" element={<PublicRoute><AdminRegister /></PublicRoute>} />
              {/* NEW: Forgot Password Route */}
              <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
              {/* Owner Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Renter Routes */}
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

            {/* Lab Requirement Part 5: Handle 404s and Blank Pages 
                Ensures that any unknown URL redirects back to the entry point. */}
            <Route path="/" element={<SplashPage />} />
            <Route path="/LandingPage" element={<LandingPage />} />
             <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
            </FeedbackProvider>
            </DamageReportProvider>
          </LogReportProvider>
        </VehicleProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

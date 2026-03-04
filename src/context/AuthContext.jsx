import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'carRentalUsers';
const PROFILE_KEY = 'userProfile';
const AUTH_TOKEN_KEY = 'authToken';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedProfile = localStorage.getItem(PROFILE_KEY);
    const authToken = localStorage.getItem(AUTH_TOKEN_KEY);
    
    if (storedProfile && authToken) {
      try {
        const profile = JSON.parse(storedProfile);
        setUser(profile);
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Error parsing stored profile:', e);
        logout();
      }
    }
    
    // Ensure default admin exists
    ensureDefaultAdmin();
    setLoading(false);
  }, []);

  const ensureDefaultAdmin = () => {
    let users = [];
    try {
      users = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      users = [];
    }
    
    if (!users.some(u => u.role === 'admin')) {
      const id = Date.now();
      users.push({
        id,
        firstName: 'Admin',
        lastName: 'User',
        fullName: 'Admin User',
        email: 'admin@rentacar.com',
        password: 'admin123',
        role: 'admin',
        active: true,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    }
  };

  const getRegisteredUsers = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  };

  const saveUserProfile = (userData) => {
    const profile = {
      id: userData.id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      middleName: userData.middleName,
      fullName: userData.fullName || `${userData.firstName} ${userData.lastName}`.trim(),
      email: userData.email,
      role: userData.role,
      sex: userData.sex,
      dateOfBirth: userData.dateOfBirth
    };
    
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    localStorage.setItem(AUTH_TOKEN_KEY, String(userData.id));
    setUser(profile);
    setIsAuthenticated(true);
    
    window.dispatchEvent(new CustomEvent('profileUpdated', { detail: profile }));
    return profile;
  };

  const login = (email, password) => {
    const registeredUsers = getRegisteredUsers();
    const matchedUser = registeredUsers.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (matchedUser) {
      return { success: true, user: saveUserProfile(matchedUser) };
    }

    // Demo accounts
    const demoAccounts = [
      {
        email: 'owner@test.com',
        password: 'password',
        userData: {
          id: 'demo-owner-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'owner@test.com',
          role: 'owner',
          fullName: 'John Doe'
        }
      },
      {
        email: 'renter@test.com',
        password: 'password',
        userData: {
          id: 'demo-renter-1',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'renter@test.com',
          role: 'renter',
          fullName: 'Jane Smith'
        }
      },
      {
        email: 'admin@test.com',
        password: 'admin123',
        userData: {
          id: 'demo-admin-1',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@test.com',
          role: 'admin',
          fullName: 'Admin User'
        }
      }
    ];

    const demoAccount = demoAccounts.find(
      acc => acc.email.toLowerCase() === email.toLowerCase() && acc.password === password
    );

    if (demoAccount) {
      return { success: true, user: saveUserProfile(demoAccount.userData) };
    }

    return { success: false, error: 'Invalid email or password' };
  };

  const register = (userData) => {
    const users = getRegisteredUsers();
    
    // Check if email already exists
    if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      return { success: false, error: 'Email already registered' };
    }

    const newUser = {
      id: Date.now(),
      ...userData,
      fullName: `${userData.firstName} ${userData.lastName}`.trim(),
      active: true,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    
    return { success: true, user: saveUserProfile(newUser) };
  };

  const registerAdmin = (userData, adminKey) => {
    if (adminKey !== 'ADMIN2026') {
      return { success: false, error: 'Invalid admin key' };
    }

    return register({ ...userData, role: 'admin' });
  };

  const logout = () => {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = (updates) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const users = getRegisteredUsers();
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    }

    const updatedProfile = { ...user, ...updates };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile));
    setUser(updatedProfile);
    
    window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updatedProfile }));
    return { success: true, user: updatedProfile };
  };

  const changePassword = (currentPassword, newPassword) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const users = getRegisteredUsers();
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex === -1) {
      return { success: false, error: 'User not found' };
    }

    if (users[userIndex].password !== currentPassword) {
      return { success: false, error: 'Current password is incorrect' };
    }

    users[userIndex].password = newPassword;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    
    return { success: true };
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    registerAdmin,
    logout,
    updateProfile,
    changePassword,
    getRegisteredUsers
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Shared across tabs (user registry)
const STORAGE_KEY = 'carRentalUsers';
// Per-tab session (sessionStorage) so each tab keeps its own login
const PROFILE_KEY = 'userProfile';
const AUTH_TOKEN_KEY = 'authToken';
// Legacy keys to migrate from
const LEGACY_USER_KEY = 'user';

const DEMO_ACCOUNTS = [
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

// Parse JSON safely from a specific storage
const safeParseFrom = (storage, key) => {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const toProfile = (userData) => ({
  id: userData.id,
  firstName: userData.firstName,
  lastName: userData.lastName,
  middleName: userData.middleName,
  fullName: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
  email: userData.email,
  role: userData.role,
  sex: userData.sex,
  dateOfBirth: userData.dateOfBirth
});

// Synchronously read auth state from sessionStorage (per-tab) so the very
// first render already knows the correct user & role.
// Falls back to localStorage for legacy/migration, then cleans up.
function getInitialAuth() {
  try {
    // 1. Try sessionStorage first (per-tab, the correct source)
    const sessionProfile = safeParseFrom(sessionStorage, PROFILE_KEY);
    const sessionToken = sessionStorage.getItem(AUTH_TOKEN_KEY);

    if (sessionProfile?.role && sessionProfile?.email && sessionToken) {
      return { user: sessionProfile, isAuthenticated: true };
    }

    // 2. Migrate from localStorage / legacy key (one-time on first load after update)
    const lsProfile = safeParseFrom(localStorage, PROFILE_KEY);
    const lsToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const legacyUser = safeParseFrom(localStorage, LEGACY_USER_KEY);

    const seed = lsProfile || legacyUser;
    if (seed?.role && seed?.email) {
      const normalized = toProfile(seed);
      const token = String(normalized.id ?? lsToken);

      // Move into sessionStorage for this tab
      sessionStorage.setItem(PROFILE_KEY, JSON.stringify(normalized));
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);

      // Clean up localStorage session keys (registry stays)
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(LEGACY_USER_KEY);

      return { user: normalized, isAuthenticated: true };
    }

    // 3. Nothing found – clean slate
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
  } catch (e) {
    console.error('Error reading auth state:', e);
  }
  return { user: null, isAuthenticated: false };
}

export function AuthProvider({ children }) {
  const initialAuth = getInitialAuth();
  const [user, setUser] = useState(initialAuth.user);
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth.isAuthenticated);
  const [loading] = useState(false);

  // Ensure default admin exists on mount
  useEffect(() => {
    ensureDefaultAdmin();
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
    const profile = toProfile(userData);

    // Store session in sessionStorage (per-tab)
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    sessionStorage.setItem(AUTH_TOKEN_KEY, String(userData.id));

    // Clean up any leftover localStorage session keys
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);

    setUser(profile);
    setIsAuthenticated(true);

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

    const demoAccount = DEMO_ACCOUNTS.find(
      acc => acc.email.toLowerCase() === email.toLowerCase() && acc.password === password
    );

    if (demoAccount) {
      // Persist demo account into registered users so it survives reloads
      const users = getRegisteredUsers();
      if (!users.some(u => u.id === demoAccount.userData.id)) {
        users.push({ ...demoAccount.userData, password: demoAccount.password, active: true, createdAt: new Date().toISOString() });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
      }
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
    sessionStorage.removeItem(PROFILE_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
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
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile));
    setUser(updatedProfile);
    
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
      {children}
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

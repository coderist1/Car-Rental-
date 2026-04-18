import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, realtimeManager } from '../lib/api';

const AuthContext = createContext(null);

const PROFILE_KEY = 'userProfile';

function readSessionAuth() {
  try {
    const rawUser = sessionStorage.getItem(PROFILE_KEY);
    if (!rawUser) return { user: null };
    return { user: JSON.parse(rawUser) };
  } catch {
    return { user: null };
  }
}

function persistSession(user) {
  sessionStorage.setItem(PROFILE_KEY, JSON.stringify(user));
}

function clearSession() {
  sessionStorage.removeItem(PROFILE_KEY);
}

export function AuthProvider({ children }) {
  const initial = readSessionAuth();
  const [user, setUser] = useState(initial.user);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const isAuthenticated = Boolean(user);

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    const fetchUsers = async () => {
      if (user?.role !== 'admin') {
        setUsers([]);
        return;
      }

      try {
        const data = await apiRequest('/api/users/');
        if (active) setUsers(Array.isArray(data) ? data : []);
      } catch {
        if (active) setUsers([]);
      }
    };

    fetchUsers();
    return () => {
      active = false;
    };
  }, [user?.role]);

  // Subscribe to real-time user updates
  useEffect(() => {
    if (!user) return;

    realtimeManager.connect();

    const unsubscribeUserUpdate = realtimeManager.on('user_updated', ({ id, payload }) => {
      // Update current logged-in user
      if (user && user.id === Number(id)) {
        setUser(payload);
        persistSession(payload);
      }
      // Update users in admin list
      setUsers((prev) => prev.map((u) => (u.id === Number(id) ? payload : u)));
    });

    const unsubscribeUserCreated = realtimeManager.on('user_created', ({ payload }) => {
      if (user?.role === 'admin') {
        setUsers((prev) => (prev.find((u) => u.id === payload.id) ? prev : [...prev, payload]));
      }
    });

    const unsubscribeUserDeleted = realtimeManager.on('user_deleted', ({ id }) => {
      setUsers((prev) => prev.filter((u) => u.id !== Number(id)));
      if (user?.id === Number(id)) logout();
    });

    const unsubscribeProfileUpdate = realtimeManager.on('profile_updated', ({ payload }) => {
      if (user && user.id === payload.id) {
        setUser(payload);
        persistSession(payload);
      }
    });

    return () => {
      unsubscribeUserUpdate();
      unsubscribeUserCreated();
      unsubscribeUserDeleted();
      unsubscribeProfileUpdate();
    };
  }, [user]);

  const login = async (email, password) => {
    try {
      const loginData = await apiRequest('/api/login/', {
        method: 'POST',
        body: { username: email.trim().toLowerCase(), password },
      });

      const me = loginData.user || loginData;
      if (!me || !me.id) return { success: false, error: 'Login failed.' };

      setUser(me);
      persistSession(me);

      return { success: true, user: me };
    } catch (error) {
      return { success: false, error: error.message || 'Invalid email or password' };
    }
  };

  const register = async (userData) => {
    try {
      const email = userData.email.trim().toLowerCase();
      await apiRequest('/api/register/', {
        method: 'POST',
        body: {
          email,
          username: email,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          middleName: userData.middleName || '',
          sex: userData.sex || '',
          dateOfBirth: userData.dateOfBirth || null,
          role: userData.role || 'renter',
        },
      });

      return await login(email, userData.password);
    } catch (error) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const registerAdmin = async (userData, adminKey) => {
    if (adminKey !== 'ADMIN2026') {
      return { success: false, error: 'Invalid admin key' };
    }
    return register({ ...userData, role: 'admin' });
  };

  const logout = () => {
    clearSession();
    setUser(null);
    setUsers([]);
  };

  const updateProfile = async (updates) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const updated = await apiRequest('/api/me/', {
        method: 'PATCH',
        body: {
          firstName: updates.firstName,
          lastName: updates.lastName,
          middleName: updates.middleName,
          sex: updates.sex,
          dateOfBirth: updates.dateOfBirth,
        },
      });

      setUser(updated);
      persistSession(updated);
      return { success: true, user: updated };
    } catch (error) {
      return { success: false, error: error.message || 'Profile update failed' };
    }
  };

  const changePassword = () => ({
    success: false,
    error: 'Password change endpoint is not configured on the backend yet.',
  });

  const getRegisteredUsers = () => users;

  const updateUser = async (userId, updates) => {
    if (user?.role !== 'admin') return false;

    try {
      const updated = await apiRequest(`/api/users/${userId}/`, {
        method: 'PATCH',
        body: {
          active: updates.active,
          firstName: updates.firstName,
          lastName: updates.lastName,
          middleName: updates.middleName,
          sex: updates.sex,
          dateOfBirth: updates.dateOfBirth,
        },
      });
      setUsers((prev) => prev.map((item) => (item.id === userId ? updated : item)));
      return true;
    } catch {
      return false;
    }
  };

  const deleteUser = async (userId) => {
    if (user?.role !== 'admin') return;

    try {
      await apiRequest(`/api/users/${userId}/`, {
        method: 'DELETE',
      });
      setUsers((prev) => prev.filter((item) => item.id !== userId));
      if (user?.id === userId) logout();
    } catch {
      // no-op
    }
  };

  const value = useMemo(() => ({
    user,
    isAuthenticated,
    loading,
    login,
    register,
    registerAdmin,
    logout,
    updateProfile,
    changePassword,
    getRegisteredUsers,
    updateUser,
    deleteUser,
  }), [user, isAuthenticated, loading, users]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

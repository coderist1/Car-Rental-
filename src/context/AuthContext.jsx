import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, realtimeManager, setAuthToken, clearAuthToken, getAuthToken } from '../lib/api';

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
  clearAuthToken();
}

function persistAuthSession(loginData, user) {
  persistSession(user);
  if (loginData?.token) {
    setAuthToken(loginData.token);
  }
}

function isAuthRequiredError(error) {
  const message = String(error?.message || error || '');
  return message.includes('Authentication required') || message.includes('401');
}

export function AuthProvider({ children }) {
  const initial = readSessionAuth();
  const [user, setUser] = useState(initial.user);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const isAuthenticated = Boolean(user);

  useEffect(() => {
    setLoading(false);
    if (!initial.user) return;
    const token = getAuthToken();
    if (!token && initial.user?.id) {
      setAuthToken(String(initial.user.id));
    }
    realtimeManager.connect();

    (async () => {
      try {
        const fresh = await apiRequest('/api/me/');
        if (fresh?.id) {
          setUser(fresh);
          persistSession(fresh);
        }
      } catch {
        // keep cached session when offline
      }
    })();
  }, []);

  useEffect(() => {
    let active = true;

    const fetchUsers = async () => {
      if (user?.role !== 'admin') {
        return;
      }

      try {
        const data = await apiRequest('/api/users/');
        if (active) setUsers(Array.isArray(data) ? data : []);
      } catch {
        // Demo fallback: show at least the current admin user
        if (active) {
          if (user?.email === 'admin@gmail.com') {
            setUsers([user]);
          } else {
            setUsers([]);
          }
        }
      }
    };

    fetchUsers();
    return () => {
      active = false;
    };
  }, [user?.role, user]);

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
      persistAuthSession(loginData, me);

      return { success: true, user: me };
    } catch (error) {
      // Demo / offline fallback — allows admin@gmail.com / admin123 to work without backend
      const demoEmail = (email || '').trim().toLowerCase();
      const demoPass = password || '';
      if (demoEmail === 'admin@gmail.com' && demoPass === 'admin123') {
        const demoAdmin = {
          id: 999,
          email: 'admin@gmail.com',
          role: 'admin',
          firstName: 'System',
          lastName: 'Administrator',
          username: 'admin',
          isActive: true,
          avatar: null,
        };
        setUser(demoAdmin);
        persistSession(demoAdmin);
        return { success: true, user: demoAdmin };
      }
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

  const logout = async () => {
    try {
      await apiRequest('/api/logout/', { method: 'POST' });
    } catch {
      // ignore
    }
    clearSession();
    setUser(null);
    realtimeManager.disconnect();
  };

  const updateProfile = async (updates) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const nextUser = {
      ...user,
      ...updates,
      fullName: updates.fullName ?? `${updates.firstName || user.firstName || ''} ${updates.lastName || user.lastName || ''}`.trim(),
    };

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
      if (isAuthRequiredError(error)) {
        setUser(nextUser);
        persistSession(nextUser);
        return {
          success: true,
          user: nextUser,
          fallback: true,
        };
      }

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

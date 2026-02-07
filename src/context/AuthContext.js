import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock users database
const mockUsers = [
  { id: 'owner1', email: 'owner@test.com', password: 'password', name: 'John Smith', role: 'owner' },
  { id: 'owner2', email: 'sarah@test.com', password: 'password', name: 'Sarah Johnson', role: 'owner' },
  { id: 'owner3', email: 'mike@test.com', password: 'password', name: 'Mike Wilson', role: 'owner' },
  { id: 'renter1', email: 'renter@test.com', password: 'password', name: 'Alice Brown', role: 'renter' },
  { id: 'admin1', email: 'admin@test.com', password: 'admin123', name: 'Admin User', role: 'admin' },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState(mockUsers);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email, password, isAdmin = false) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const foundUser = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    
    if (foundUser) {
      if (isAdmin && foundUser.role !== 'admin') {
        setIsLoading(false);
        return { success: false, error: 'Invalid admin credentials' };
      }
      if (!isAdmin && foundUser.role === 'admin') {
        setIsLoading(false);
        return { success: false, error: 'Please use admin login' };
      }
      setUser(foundUser);
      setIsLoading(false);
      return { success: true };
    }
    
    setIsLoading(false);
    return { success: false, error: 'Invalid email or password' };
  };

  const register = async (name, email, password, role) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      setIsLoading(false);
      return { success: false, error: 'Email already registered' };
    }
    
    const newUser = {
      id: `${role}${users.length + 1}`,
      email,
      password,
      name,
      role,
    };
    
    setUsers([...users, newUser]);
    setUser(newUser);
    setIsLoading(false);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    users,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

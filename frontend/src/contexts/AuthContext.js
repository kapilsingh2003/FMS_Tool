import React, { createContext, useState, useContext, useEffect } from 'react';
import Cookies from 'js-cookie';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // User roles
  const USER_ROLES = {
    ADMIN: 'admin',
    REVIEWER: 'reviewer',
    VIEWER: 'viewer'
  };

  // Check for existing authentication on app load
  useEffect(() => {
    const storedUser = Cookies.get('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        Cookies.remove('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const result = await authAPI.login(username, password);

      if (result.success) {
        const userData = result.data.user;
        setUser(userData);
        Cookies.set('user', JSON.stringify(userData), { expires: 7 }); // 7 days
        return { success: true, user: userData };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signup = async (userData) => {
    try {
      const result = await authAPI.signup(userData);

      if (result.success) {
        const newUser = result.data.user;
        // For demo purposes, auto-login after signup
        setUser(newUser);
        Cookies.set('user', JSON.stringify(newUser), { expires: 7 });
        return { success: true, user: newUser };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    Cookies.remove('user');
  };

  const hasRole = (requiredRole) => {
    if (!user) return false;

    const roleHierarchy = {
      [USER_ROLES.VIEWER]: 1,
      [USER_ROLES.REVIEWER]: 2,
      [USER_ROLES.ADMIN]: 3
    };

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };

  const value = {
    user,
    login,
    signup,
    logout,
    hasRole,
    loading,
    USER_ROLES
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
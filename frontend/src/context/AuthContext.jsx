import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const AUTH_SERVICE_URL = 'http://localhost:5001/api/auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize and load user profile if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await axios.get(`${AUTH_SERVICE_URL}/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success) {
            setUser(res.data.data);
          } else {
            logout();
          }
        } catch (err) {
          console.error('Error loading user profile:', err);
          logout();
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${AUTH_SERVICE_URL}/login`, { email, password });
      if (res.data.success) {
        const { token: userToken, ...userData } = res.data.data;
        localStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(userData);
        setLoading(false);
        return userData;
      }
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Register handler
  const register = async (name, email, password, role) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${AUTH_SERVICE_URL}/register`, {
        name,
        email,
        password,
        role
      });
      if (res.data.success) {
        const { token: userToken, ...userData } = res.data.data;
        localStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(userData);
        setLoading(false);
        return userData;
      }
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setError(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        setError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // If buyer tries to access seller pages, redirect to buyer dashboard
    if (user.role === 'buyer') {
      return <Navigate to="/buyer-dashboard" replace />;
    }
    // If seller tries to access buyer pages, redirect to seller dashboard
    if (user.role === 'seller') {
      return <Navigate to="/seller-dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

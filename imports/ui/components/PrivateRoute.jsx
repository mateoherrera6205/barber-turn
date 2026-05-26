import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function PrivateRoute({ children, requiredRole }) {
  const { isLoggedIn, role, isLoading } = useAuth();
  if (isLoading) return <p>Cargando...</p>;
  if (!isLoggedIn) return <Navigate to="/login" />;
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === 'barbero' ? '/dashboard' : '/booking'} />;
  }
  return children;
}

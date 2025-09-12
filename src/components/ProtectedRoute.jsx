import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    // Eğer kullanıcı giriş yapmamışsa, login sayfasına yönlendir
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
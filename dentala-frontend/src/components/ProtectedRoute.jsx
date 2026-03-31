import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('auth_token');

  // If there is no token, redirect to the login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If there is a token, allow them to see the page (Outlet)
  return <Outlet />;
};

export default ProtectedRoute;
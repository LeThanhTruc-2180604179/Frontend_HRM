// src/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ userId, children }) => {
  if (!userId) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default ProtectedRoute;

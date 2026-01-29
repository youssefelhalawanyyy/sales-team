import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const ProtectedRoute = ({
  children,
  requiredRoles = [],
}) => {

  const { currentUser, userRole, loading } = useAuth();

  // STILL LOADING
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // NOT LOGGED IN
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // ROLE NOT READY (SAFETY)
  if (!userRole) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">
          Preparing your account...
        </p>
      </div>
    );
  }

  // ROLE CHECK
  if (
    requiredRoles.length > 0 &&
    !requiredRoles.includes(userRole)
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

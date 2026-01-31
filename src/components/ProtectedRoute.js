import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const LoadingScreen = React.memo(() => (
  <div className="flex items-center justify-center h-screen bg-white">
    <div className="text-center">
      <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" style={{ animationDuration: '0.8s' }}></div>
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  </div>
));

export const ProtectedRoute = React.memo(({
  children,
  requiredRoles = [],
}) => {

  const { currentUser, userRole, loading } = useAuth();

  // STILL LOADING
  if (loading) {
    return <LoadingScreen />;
  }

  // NOT LOGGED IN
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // ROLE NOT READY (SAFETY)
  if (!userRole) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <p className="text-sm text-gray-500">Preparing your account...</p>
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
});

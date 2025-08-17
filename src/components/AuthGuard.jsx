import React from 'react';
import { useAuthenticationStatus } from '@nhost/react';
import { AuthForm } from './AuthForm';

export function AuthGuard({ children }) {
  const { isLoading, isAuthenticated } = useAuthenticationStatus();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  return children;
}
'use client';

import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { fileService } from '@/lib/fileService';

/**
 * Hook to manage automatic file URL refreshing
 */
export function useFileUrlManager() {
  const { user, isAuthenticated } = useAuth();

  // Refresh expired URLs when the app loads or user changes
  useEffect(() => {
    if (!isAuthenticated || !user?.email) return;

    const refreshExpiredUrls = async () => {
      try {
        console.log('Checking for expired file URLs...');
        await fileService.refreshExpiredUrls(user.email!);
        console.log('Expired URL refresh completed');
      } catch (error) {
        console.warn('Failed to refresh expired URLs:', error);
      }
    };

    // Refresh immediately on load
    refreshExpiredUrls();

    // Set up periodic refresh every 5 minutes
    const interval = setInterval(refreshExpiredUrls, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user?.email]);

  // Clean up expired cache entries periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      fileService.clearExpiredCache();
    }, 10 * 60 * 1000); // Every 10 minutes

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    refreshExpiredUrls: async () => {
      if (user?.email) {
        await fileService.refreshExpiredUrls(user.email);
      }
    },
    clearCache: () => fileService.clearCache(),
  };
}

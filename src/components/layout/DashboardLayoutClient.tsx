'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from '@/utils/api';

import { DashboardHeader } from '@/features/dashboard/DashboardHeader';
import { ProjectProvider } from '@/contexts/ProjectContext';

export default function DashboardLayoutClient(props: { children: React.ReactNode }) {
  const t = useTranslations('DashboardLayout');
  const { getToken } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Automatically sync user on dashboard load
    syncUser();
  }, []);

  // Get authentication token with fallback mechanisms
  const getAuthToken = async () => {
    try {
      // Try to get the most appropriate token
      let token: string | null = null;
      
      try {
        // Try to get default token
        token = await getToken();
        if (token) return token;
      } catch (e) {
        console.log('Failed to get default token:', e);
      }
      
      try {
        // Try to get session token
        token = await getToken({ template: 'session' });
        if (token) return token;
      } catch (e) {
        console.log('Failed to get session token:', e);
      }
      
      if (!token) {
        throw new Error('Unable to get authentication token, please login first');
      }
      
      return token;
    } catch (error) {
      console.error('Failed to get authentication token:', error);
      throw error;
    }
  };

  // Sync user to the backend system
  const syncUser = async () => {
    try {
      const token = await getAuthToken();
      
      // Send sync request
      const response = await fetch(`${API_BASE_URL}/sync-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        // For 500 errors, we'll just log it but won't show errors to user
        // as the user might already be in the system
        if (response.status === 500) {
          console.warn('Server error during user sync in layout. Error code:', response.status);
          return null;
        }
        
        // For non-critical operation, just log the error
        console.error('User auto-sync failed:', response.status);
        return;
      }

      const userData = await response.json();
      console.log('User auto-sync successful!');
    } catch (error) {
      console.error('User auto-sync error:', error);
      // No toast for automatic sync to avoid user distraction
    }
  };

  return (
    <ProjectProvider>
      <div className="shadow-md">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-3 py-4">
          <DashboardHeader
            menu={[
              {
                href: '/dashboard',
                label: t('home'),
              },
              /* 注释掉Projects菜单，统一在RFQ中管理
              {
                href: '/dashboard/projects',
                label: 'Projects',
              },
              */
              {
                href: '/dashboard/rfq',
                label: 'RFQs',
              },
              {
                href: '/dashboard/suppliers',
                label: 'Suppliers',
              },
              {
                href: '/dashboard/organization-profile/organization-members',
                label: t('members'),
              },
              {
                href: '/dashboard/organization-profile',
                label: t('settings'),
              },
              // PRO: Link to the /dashboard/billing page
            ]}
          />
        </div>
      </div>

      <div className="min-h-[calc(100vh-72px)] bg-muted">
        <div className="mx-auto max-w-screen-xl px-3 pb-16 pt-6">
          {props.children}
        </div>
      </div>
    </ProjectProvider>
  );
} 
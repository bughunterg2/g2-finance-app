import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode, Notification } from '@/types';

interface UIState {
  theme: ThemeMode;
  sidebarCollapsed: boolean;
  isLoading: boolean;
  notifications: Notification[];
}

interface UIActions {
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLoading: (loading: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set, get) => ({
      // State
      theme: 'light',
      sidebarCollapsed: false,
      isLoading: false,
      notifications: [],

      // Actions
      setTheme: (theme: ThemeMode) => {
        set({ theme });
        // Update document theme attribute
        document.documentElement.setAttribute('data-theme', theme);
      },

      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
        document.documentElement.setAttribute('data-theme', newTheme);
      },

      toggleSidebar: () => {
        set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      setSidebarCollapsed: (collapsed: boolean) => {
        set({ sidebarCollapsed: collapsed });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => {
        const newNotification: Notification = {
          ...notification,
          id: `notification-${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
        };
        
        set(state => ({
          notifications: [...state.notifications, newNotification]
        }));

        // Auto remove notification after duration
        if (notification.duration !== 0) {
          setTimeout(() => {
            get().removeNotification(newNotification.id);
          }, notification.duration || 5000);
        }
      },

      removeNotification: (id: string) => {
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ 
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed
      }),
    }
  )
);

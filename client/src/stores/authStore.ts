import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginData, RegisterData } from '@/types';
import {
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  updateUserProfile,
  getCurrentUser,
  updateUserPassword,
  sendPasswordReset,
} from '@/firebase/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingIn: boolean; // Flag to prevent race condition with auth state listener
  error: string | null;
}

interface AuthActions {
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  setUser: (user: User | null, skipIfLoggingIn?: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isLoggingIn: false,
      error: null,

      // Actions
      login: async (data: LoginData) => {
        set({ isLoading: true, isLoggingIn: true, error: null });
        try {
          const user = await loginWithEmail(data);
          
          // Set user state immediately after successful login
          // Set isLoggingIn to false after a small delay to allow navigation to complete
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null
          });
          
          // Reset isLoggingIn flag after navigation should have completed
          setTimeout(() => {
            set({ isLoggingIn: false });
          }, 1000);
        } catch (error: any) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({ 
            error: errorMessage,
            isLoading: false,
            isLoggingIn: false,
            user: null,
            isAuthenticated: false
          });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, isLoggingIn: true, error: null });
        try {
          const user = await registerWithEmail(data);
          
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
          
          // Reset isLoggingIn flag after navigation should have completed
          setTimeout(() => {
            set({ isLoggingIn: false });
          }, 1000);
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
            isLoggingIn: false
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await logoutUser();
          
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            isLoggingIn: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Logout failed',
            isLoading: false,
            isLoggingIn: false
          });
          throw error;
        }
      },

      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true, error: null });
        try {
          const currentUser = get().user;
          if (!currentUser) {
            throw new Error('No user logged in');
          }

          await updateUserProfile(currentUser.uid, data);
          
          // Refresh user data from Firebase
          const updatedUser = await getCurrentUser();
          if (updatedUser) {
            set({ user: updatedUser, isLoading: false });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Profile update failed',
            isLoading: false 
          });
          throw error;
        }
      },

      updatePassword: async (currentPassword: string, newPassword: string) => {
        set({ isLoading: true, error: null });
        try {
          await updateUserPassword(currentPassword, newPassword);
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Password update failed',
            isLoading: false 
          });
          throw error;
        }
      },

      sendPasswordResetEmail: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await sendPasswordReset(email);
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to send password reset email',
            isLoading: false 
          });
          throw error;
        }
      },

      setUser: (user: User | null, skipIfLoggingIn: boolean = false) => {
        const state = get();
        // If login is in progress and we're trying to set user to null, skip it
        // This prevents auth state listener from clearing user during login process
        if (skipIfLoggingIn && state.isLoggingIn && !user) {
          return;
        }
        // If login is in progress and we already have a user, don't override it
        if (skipIfLoggingIn && state.isLoggingIn && state.user && user) {
          // Only update if it's a different user (shouldn't happen, but safety check)
          if (state.user.uid !== user.uid) {
            set({ user, isAuthenticated: !!user });
          }
          return;
        }
        set({ user, isAuthenticated: !!user });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

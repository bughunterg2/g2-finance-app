import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginData, RegisterData } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  setUser: (user: User | null) => void;
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
      error: null,

      // Actions
      login: async (data: LoginData) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Implement Firebase authentication
          console.log('Login attempt:', data);
          
          // Mock user data for now
          const isAdmin = /^admin/i.test(data.email);
          const mockUser: User = {
            uid: 'mock-uid',
            email: data.email,
            name: 'John Doe',
            role: isAdmin ? 'admin' : 'agent',
            division: 'Blok M',
            phoneNumber: '0812-3456-7890',
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
          };
          
          set({ 
            user: mockUser, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false 
          });
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Implement Firebase registration
          console.log('Register attempt:', data);
          
          // Mock user data for now
          const mockUser: User = {
            uid: 'mock-uid',
            email: data.email,
            name: data.name,
            role: data.role,
            division: data.division,
            phoneNumber: data.phoneNumber,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
          };
          
          set({ 
            user: mockUser, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false 
          });
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          // TODO: Implement Firebase logout
          console.log('Logout');
          
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Logout failed',
            isLoading: false 
          });
        }
      },

      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Implement Firebase profile update
          console.log('Update profile:', data);
          
          const currentUser = get().user;
          if (currentUser) {
            const updatedUser = { ...currentUser, ...data, updatedAt: new Date() };
            set({ user: updatedUser, isLoading: false });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Profile update failed',
            isLoading: false 
          });
        }
      },

      setUser: (user: User | null) => {
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

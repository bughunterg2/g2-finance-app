import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import AppRouter from './components/AppRouter';
import AppThemeProvider from '@/components/providers/AppThemeProvider';
import { useAuthStore } from '@/stores/authStore';
import { onAuthStateChange, getCurrentUser } from '@/firebase/auth';
import './styles/variables.css';
import './style.css';

// Initialize Firebase
import '@/firebase/config';

// Setup auth state listener
onAuthStateChange(async (firebaseUser) => {
  const { setUser, user: currentUser, isLoggingIn } = useAuthStore.getState();
  
  if (firebaseUser) {
    // Skip if user is already set and matches (avoid unnecessary updates during login)
    if (currentUser && currentUser.uid === firebaseUser.uid) {
      return;
    }
    
    // User is signed in
    try {
      const appUser = await getCurrentUser();
      if (appUser) {
        // Use skipIfLoggingIn flag to prevent race condition with manual login
        setUser(appUser, true);
      } else {
        // If we can't get app user, only clear state if not logging in
        // This prevents clearing user during login process
        if (!isLoggingIn) {
          setUser(null, true);
        }
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      // Only clear state if not logging in
      if (!isLoggingIn) {
        setUser(null, true);
      }
    }
  } else {
    // User is signed out - only update if we have a current user and not logging in
    // This prevents clearing user during login process
    if (currentUser && !isLoggingIn) {
      setUser(null, true);
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppThemeProvider>
      <AppRouter />
      <Toaster position="top-right" />
    </AppThemeProvider>
  </React.StrictMode>,
);

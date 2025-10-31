import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import AppRouter from './components/AppRouter';
import AppThemeProvider from '@/components/providers/AppThemeProvider';
import { useAuthStore } from '@/stores/authStore';
import { onAuthStateChange, getCurrentUser } from '@/firebase/auth';
import './styles/variables.css';
import './style.css';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isFirebaseConfigError = this.state.error?.message?.includes('Firebase') ||
        this.state.error?.message?.includes('environment variables');
      
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#f5f5f5'
        }}>
          <div style={{
            maxWidth: '600px',
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h1 style={{ color: '#d32f2f', marginBottom: '16px' }}>
              {isFirebaseConfigError ? '⚠️ Configuration Error' : '❌ Application Error'}
            </h1>
            <p style={{ color: '#666', marginBottom: '24px', lineHeight: '1.6' }}>
              {isFirebaseConfigError ? (
                <>
                  Firebase environment variables are missing. Please set the following variables in your Vercel project settings:
                  <br /><br />
                  <code style={{
                    display: 'block',
                    padding: '12px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    fontSize: '12px',
                    marginTop: '8px'
                  }}>
                    VITE_FIREBASE_API_KEY<br />
                    VITE_FIREBASE_AUTH_DOMAIN<br />
                    VITE_FIREBASE_PROJECT_ID<br />
                    VITE_FIREBASE_STORAGE_BUCKET<br />
                    VITE_FIREBASE_MESSAGING_SENDER_ID<br />
                    VITE_FIREBASE_APP_ID<br />
                    VITE_FIREBASE_MEASUREMENT_ID (optional)
                  </code>
                  <br />
                  <strong>To fix:</strong> Go to your Vercel project → Settings → Environment Variables → Add the variables above.
                </>
              ) : (
                `An unexpected error occurred: ${this.state.error?.message || 'Unknown error'}`
              )}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
    <ErrorBoundary>
      <AppThemeProvider>
        <AppRouter />
        <Toaster position="top-right" />
      </AppThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);

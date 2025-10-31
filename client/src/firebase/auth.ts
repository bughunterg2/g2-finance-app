import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import type { User as AuthUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { auth, db } from './config';
import type { User, LoginData, RegisterData } from '../types';

/**
 * Convert Firebase User to App User
 */
const mapFirebaseUserToAppUser = async (firebaseUser: AuthUser): Promise<User | null> => {
  try {
    // Get user data from Firestore
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.warn('User document not found in Firestore for UID:', firebaseUser.uid);
      console.warn('Email:', firebaseUser.email);
      throw new Error('User is not registered in the system. Please contact administrator.');
    }

    const userData = userDoc.data();
    const role = userData.role;
    if (role !== 'admin' && role !== 'agent') {
      throw new Error('Invalid user role. Please contact administrator.');
    }
    
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: userData.name || '',
      role,
      division: userData.division || '',
      phoneNumber: userData.phoneNumber || '',
      avatar: userData.avatar || firebaseUser.photoURL || '',
      createdAt: userData.createdAt?.toDate() || new Date(),
      updatedAt: userData.updatedAt?.toDate() || new Date(),
      isActive: userData.isActive !== false,
      lastLoginAt: userData.lastLoginAt?.toDate(),
    };
  } catch (error: any) {
    console.error('Error mapping Firebase user to app user:', error);
    console.error('Firebase User UID:', firebaseUser.uid);
    console.error('Firebase User Email:', firebaseUser.email);
    
    // If error is already a custom error message, rethrow it
    if (error.message && (error.message.includes('Failed') || error.message.includes('Permission'))) {
      throw error;
    }
    
    return null;
  }
};

/**
 * Login with email and password
 */
export const loginWithEmail = async (data: LoginData): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    const firebaseUser = userCredential.user;
    
    console.log('Firebase Auth successful for:', firebaseUser.email);
    console.log('User UID:', firebaseUser.uid);
    
    // Get user data from Firestore first
    let appUser: User | null;
    try {
      appUser = await mapFirebaseUserToAppUser(firebaseUser);
    } catch (mapError: any) {
      // If mapFirebaseUserToAppUser throws an error with a custom message, use it
      console.error('Error mapping user:', mapError);
      await firebaseSignOut(auth);
      throw mapError;
    }
    
    if (!appUser) {
      // Sign out the user if their data cannot be retrieved or created
      console.error('Failed to get or create user data for UID:', firebaseUser.uid);
      await firebaseSignOut(auth);
      throw new Error('Failed to load user data. Please contact administrator or try again.');
    }
    
    console.log('User data loaded successfully:', appUser.email, 'Role:', appUser.role);

    // Check if user is active
    if (appUser.isActive === false) {
      await firebaseSignOut(auth);
      throw new Error('This account has been disabled. Please contact administrator.');
    }
    
    // Update lastLoginAt in Firestore (only if user data is valid)
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLoginAt: serverTimestamp(),
      });
    } catch (updateError) {
      // Log error but don't fail login if update fails
      console.warn('Failed to update lastLoginAt:', updateError);
    }

    return appUser;
  } catch (error: any) {
    // Map Firebase errors to user-friendly messages
    let errorMessage = 'Login failed. Please try again.';
    
    // If error is already a string (from our custom errors), use it
    if (error.message && !error.code) {
      throw error;
    }
    
    // If error code doesn't exist, use the error message or default message
    if (!error.code) {
      errorMessage = error.message || errorMessage;
      throw new Error(errorMessage);
    }
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'Email not found. Please check your email address.';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password. Please check your password.';
        break;
      case 'auth/invalid-credential':
        // Firebase uses this error for incorrect email/password
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email format. Please enter a valid email address.';
        break;
      case 'auth/user-disabled':
        errorMessage = 'This account has been disabled. Please contact administrator.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many failed login attempts. Please try again later or reset your password.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your internet connection and try again.';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'Login method not allowed. Please contact administrator.';
        break;
      default:
        errorMessage = error.message || 'Login failed. Please check your email and password, then try again.';
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Register new user
 */
export const registerWithEmail = async (data: RegisterData): Promise<User> => {
  try {
    if (data.role !== 'admin' && data.role !== 'agent') {
      throw new Error('Invalid role. Allowed roles are admin or agent.');
    }
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    const firebaseUser = userCredential.user;

    // Update display name in Firebase Auth
    if (data.name) {
      await updateProfile(firebaseUser, {
        displayName: data.name,
      });
    }

    // Create user document in Firestore
    const userData = {
      uid: firebaseUser.uid,
      email: data.email,
      name: data.name,
      role: data.role,
      division: data.division,
      phoneNumber: data.phoneNumber || '',
      avatar: '',
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userData);

    // Return mapped user
    const appUser = await mapFirebaseUserToAppUser(firebaseUser);
    
    if (!appUser) {
      throw new Error('Failed to create user data');
    }

    return appUser;
  } catch (error: any) {
    // Map Firebase errors to user-friendly messages
    let errorMessage = 'Registration failed. Please try again.';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'Email is already registered. Please use a different email or sign in.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email format. Please enter a valid email address.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password is too weak. Please use at least 6 characters.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your internet connection and try again.';
        break;
      default:
        errorMessage = error.message || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Logout current user
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error(error.message || 'Logout failed');
  }
};

/**
 * Send password reset email
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    let errorMessage = 'Failed to send password reset email.';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'Email not found. Please check your email address.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email format. Please enter a valid email address.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your internet connection and try again.';
        break;
      default:
        errorMessage = error.message || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Get current user from Firebase Auth
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      return null;
    }
    return await mapFirebaseUserToAppUser(firebaseUser);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    callback(firebaseUser);
  });
};

/**
 * Update user profile
 */
export const updateUserProfile = async (uid: string, data: Partial<User>): Promise<void> => {
  try {
    const updateData: any = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    // Remove fields that shouldn't be updated directly
    delete updateData.uid;
    delete updateData.email;
    delete updateData.createdAt;

    // Update Firestore
    await updateDoc(doc(db, 'users', uid), updateData);

    // Update Firebase Auth display name if name changed
    if (data.name && auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: data.name,
      });
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update profile');
  }
};

/**
 * Update user password (requires re-authentication)
 */
export const updateUserPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  try {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !firebaseUser.email) {
      throw new Error('No user logged in');
    }

    // Validate new password
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Re-authenticate user with current password
    const credential = EmailAuthProvider.credential(
      firebaseUser.email,
      currentPassword
    );
    
    await reauthenticateWithCredential(firebaseUser, credential);

    // Update password
    await updatePassword(firebaseUser, newPassword);
  } catch (error: any) {
    let errorMessage = 'Failed to update password.';
    
    // Handle specific Firebase errors
    if (error.code) {
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'Current password is incorrect. Please try again.';
          break;
        case 'auth/weak-password':
          errorMessage = 'New password is too weak. Please use at least 6 characters.';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'Please log out and log in again before changing your password.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection and try again.';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
    } else {
      errorMessage = error.message || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Create user by admin (creates user in Firebase Auth and Firestore)
 */
export const createUserByAdmin = async (data: {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'agent';
  division: string;
  phoneNumber?: string;
}): Promise<User> => {
  try {
    // Validate role
    if (data.role !== 'admin' && data.role !== 'agent') {
      throw new Error('Invalid role. Allowed roles are admin or agent.');
    }

    // Validate password
    if (data.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    const firebaseUser = userCredential.user;

    // Update display name in Firebase Auth
    if (data.name) {
      await updateProfile(firebaseUser, {
        displayName: data.name,
      });
    }

    // Create user document in Firestore
    const userData = {
      uid: firebaseUser.uid,
      email: data.email,
      name: data.name,
      role: data.role,
      division: data.division,
      phoneNumber: data.phoneNumber || '',
      avatar: '',
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: null,
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userData);

    // Return mapped user
    const appUser = await mapFirebaseUserToAppUser(firebaseUser);
    
    if (!appUser) {
      throw new Error('Failed to create user data');
    }

    return appUser;
  } catch (error: any) {
    // Map Firebase errors to user-friendly messages
    let errorMessage = 'Failed to create user. Please try again.';
    
    if (error.code) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email is already registered. Please use a different email.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email format. Please enter a valid email address.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please use at least 6 characters.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection and try again.';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
    } else {
      errorMessage = error.message || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Fetch all users from Firestore (admin only)
 */
export const fetchAllUsers = async (): Promise<User[]> => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    console.log(`Fetching users from Firestore... Found ${snapshot.size} documents`);
    
    const users: User[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`Processing user document ${doc.id}:`, data);
      
      // Handle date conversion safely
      let createdAt: Date;
      let updatedAt: Date;
      let lastLoginAt: Date | undefined;
      
      try {
        createdAt = data.createdAt?.toDate() || new Date();
      } catch (e) {
        console.warn(`Error converting createdAt for user ${doc.id}:`, e);
        createdAt = new Date();
      }
      
      try {
        updatedAt = data.updatedAt?.toDate() || new Date();
      } catch (e) {
        console.warn(`Error converting updatedAt for user ${doc.id}:`, e);
        updatedAt = new Date();
      }
      
      try {
        lastLoginAt = data.lastLoginAt?.toDate();
      } catch (e) {
        console.warn(`Error converting lastLoginAt for user ${doc.id}:`, e);
        lastLoginAt = undefined;
      }
      
      const user: User = {
        uid: doc.id,
        email: data.email || '',
        name: data.name || '',
        role: data.role || 'agent',
        division: data.division || '',
        phoneNumber: data.phoneNumber || '',
        avatar: data.avatar || '',
        createdAt,
        updatedAt,
        isActive: data.isActive !== false,
        lastLoginAt,
      };
      
      console.log(`Created user object for ${doc.id}:`, user);
      users.push(user);
    });
    
    console.log(`Successfully fetched ${users.length} users from Firestore`);
    return users;
  } catch (error: any) {
    console.error('Error fetching users from Firestore:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw new Error(error.message || 'Failed to fetch users from Firestore');
  }
};

/**
 * Update user role in Firestore
 */
export const updateUserRole = async (uid: string, role: 'admin' | 'agent'): Promise<void> => {
  try {
    if (role !== 'admin' && role !== 'agent') {
      throw new Error('Invalid role. Allowed roles are admin or agent.');
    }
    
    await updateDoc(doc(db, 'users', uid), {
      role,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update user role');
  }
};

/**
 * Toggle user active status in Firestore
 */
export const toggleUserActive = async (uid: string, isActive: boolean): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      isActive,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to toggle user status');
  }
};

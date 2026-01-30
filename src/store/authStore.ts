import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'farmer' | 'government' | 'buyer';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string, role?: 'farmer' | 'government' | 'buyer') => Promise<void>;
  setUser: (user: User) => void;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      loading: true,
      setUser: (user: User) => set({ user, isAuthenticated: true, loading: false }),
      login: async (email: string, password: string, role: 'farmer' | 'government' | 'buyer' = 'farmer') => {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          const user: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            avatar: firebaseUser.photoURL || undefined,
            role: role
          };
          set({ user, isAuthenticated: true, loading: false });
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },
      signup: async (email: string, password: string, name: string) => {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          // Update display name
          await updateProfile(firebaseUser, {
            displayName: name,
          });
          const user: User = {
            id: firebaseUser.uid,
            name: name,
            email: firebaseUser.email || '',
            avatar: firebaseUser.photoURL || undefined,
            role: 'farmer' // Default to farmer for new signups
          };
          set({ user, isAuthenticated: true, loading: false });
        } catch (error) {
          console.error('Signup error:', error);
          throw error;
        }
      },
      logout: async () => {
        try {
          await signOut(auth);
          set({ user: null, isAuthenticated: false, loading: false });
        } catch (error) {
          console.error('Logout error:', error);
          throw error;
        }
      },
      initializeAuth: () => {
        onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
          if (firebaseUser) {
            // Check if we have a persisted role in local state, otherwise default
            const persistedState = get();
            const currentRole = persistedState.user?.role || 'farmer';

            const user: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              avatar: firebaseUser.photoURL || undefined,
              role: currentRole
            };
            set({ user, isAuthenticated: true, loading: false });
          } else {
            set({ user: null, isAuthenticated: false, loading: false });
          }
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

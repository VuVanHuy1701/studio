"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { AppUser, UserRole } from '@/app/lib/types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAsMockUser: (username: string) => Promise<void>;
  loginAsAdmin: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  knownUsers: { name: string; id: string }[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- CREDENTIALS CONFIGURATION ---
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin@123'
};

const MOCK_USERS = [
  { name: 'Alice', id: 'mock-alice' },
  { name: 'Bob', id: 'mock-bob' },
  { name: 'Charlie', id: 'mock-charlie' },
  { name: 'Dana', id: 'mock-dana' },
];
// ---------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          role: 'user'
        });
      } else {
        const savedSession = localStorage.getItem('task_compass_session');
        if (savedSession) {
          setUser(JSON.parse(savedSession));
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const loginAsMockUser = async (username: string) => {
    const mockUser: AppUser = {
      uid: `mock-${username.toLowerCase()}`,
      email: `${username.toLowerCase()}@example.com`,
      displayName: username,
      photoURL: null,
      role: 'user'
    };
    setUser(mockUser);
    localStorage.setItem('task_compass_session', JSON.stringify(mockUser));
  };

  const loginAsAdmin = async (username: string, password: string): Promise<boolean> => {
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      const adminUser: AppUser = {
        uid: 'admin-id',
        email: 'admin@taskcompass.com',
        displayName: 'Administrator',
        photoURL: null,
        role: 'admin'
      };
      setUser(adminUser);
      localStorage.setItem('task_compass_session', JSON.stringify(adminUser));
      return true;
    }
    return false;
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('task_compass_session');
      setUser(null);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      loginWithGoogle, 
      loginAsMockUser, 
      loginAsAdmin, 
      logout,
      knownUsers: MOCK_USERS 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

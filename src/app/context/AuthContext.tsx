
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
  loginAsAdmin: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        // Check if there's a mocked admin session in localStorage
        const savedAdmin = localStorage.getItem('task_compass_admin');
        if (savedAdmin) {
          setUser(JSON.parse(savedAdmin));
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

  const loginAsAdmin = async (username: string, password: string): Promise<boolean> => {
    if (username === 'admin' && password === 'admin@123') {
      const adminUser: AppUser = {
        uid: 'admin-id',
        email: 'admin@taskcompass.com',
        displayName: 'Administrator',
        photoURL: null,
        role: 'admin'
      };
      setUser(adminUser);
      localStorage.setItem('task_compass_admin', JSON.stringify(adminUser));
      return true;
    }
    return false;
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('task_compass_admin');
      setUser(null);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginAsAdmin, logout }}>
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

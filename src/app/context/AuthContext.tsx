"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { AppUser, UserAccount, UserRole } from '@/app/lib/types';
import initialUsers from '@/app/lib/users.json';
import { persistUsersToFile } from '@/app/actions/user-actions';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithCredentials: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  // User Management
  managedUsers: UserAccount[];
  addUser: (account: Omit<UserAccount, 'uid'>) => void;
  updateUser: (uid: string, updates: Partial<UserAccount>) => void;
  deleteUser: (uid: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [managedUsers, setManagedUsers] = useState<UserAccount[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load managed users from LocalStorage or seed from JSON
  useEffect(() => {
    const savedUsers = localStorage.getItem('task_compass_users');
    if (savedUsers) {
      try {
        setManagedUsers(JSON.parse(savedUsers));
      } catch (e) {
        console.error("Failed to parse managed users", e);
        setManagedUsers(initialUsers.accounts as UserAccount[]);
      }
    } else {
      setManagedUsers(initialUsers.accounts as UserAccount[]);
    }
    
    // Auth state from LocalStorage session
    const savedSession = localStorage.getItem('task_compass_session');
    if (savedSession) {
      setUser(JSON.parse(savedSession));
    }

    setIsHydrated(true);
    setLoading(false);
  }, []);

  // Persist managed users to LocalStorage and System JSON
  useEffect(() => {
    if (isHydrated) {
      // 1. Update local storage for immediate persistence in browser
      localStorage.setItem('task_compass_users', JSON.stringify(managedUsers));
      
      // 2. Sync with the server-side JSON file
      persistUsersToFile(managedUsers).catch(err => {
        console.warn('System file sync skipped or failed:', err);
      });
    }
  }, [managedUsers, isHydrated]);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const newUser: AppUser = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        role: 'user'
      };
      setUser(newUser);
      localStorage.setItem('task_compass_session', JSON.stringify(newUser));
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const loginWithCredentials = async (username: string, password: string): Promise<boolean> => {
    const account = managedUsers.find(u => u.username === username && u.password === password);
    if (account) {
      const { password: _, ...safeUser } = account;
      setUser(safeUser);
      localStorage.setItem('task_compass_session', JSON.stringify(safeUser));
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

  // Admin Actions
  const addUser = (account: Omit<UserAccount, 'uid'>) => {
    const newAccount = { ...account, uid: `user-${Math.random().toString(36).substr(2, 9)}` };
    setManagedUsers(prev => [...prev, newAccount]);
  };

  const updateUser = (uid: string, updates: Partial<UserAccount>) => {
    setManagedUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...updates } : u));
    // Update current session if the user edited themselves
    if (user?.uid === uid) {
      const updatedUser = { ...user, ...updates };
      delete (updatedUser as any).password;
      setUser(updatedUser as AppUser);
      localStorage.setItem('task_compass_session', JSON.stringify(updatedUser));
    }
  };

  const deleteUser = (uid: string) => {
    if (uid === 'admin-id') return; // Protect system admin
    setManagedUsers(prev => prev.filter(u => u.uid !== uid));
    if (user?.uid === uid) logout();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      loginWithGoogle, 
      loginWithCredentials,
      logout,
      managedUsers,
      addUser,
      updateUser,
      deleteUser
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

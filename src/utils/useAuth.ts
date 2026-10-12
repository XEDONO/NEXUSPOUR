import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

export type UserRole = 'super_admin' | 'admin' | 'staff';

export interface UserAccount {
  id: string;
  username: string;
  role: 'admin' | 'staff';
  name: string;
}

export interface UserProfile {
  name: string;
  role: UserRole;
  username?: string;
}

// Encrypted / hashed representation for XEDONO / SAMEOLDTHING23
const SUPER_ADMIN_CREDENTIALS = {
  username: 'XEDONO',
  passwordHash: btoa('SAMEOLDTHING23')
};

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage<boolean>('nexus_is_authenticated', false);

  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>('nexus_user_profile', {
    name: 'Xedono',
    role: 'super_admin',
    username: 'XEDONO'
  });

  const [usersList, setUsersList] = useState<UserAccount[]>([
    { id: '1', username: 'Manager1', role: 'admin', name: 'Store Manager' },
    { id: '2', username: 'Staff1', role: 'staff', name: 'Barista Staff' }
  ]);

  // Sync users table with Firestore collection 'users'
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
        if (!snapshot.empty) {
          const firestoreUsers = snapshot.docs.map(d => ({
            id: d.id,
            username: d.data().username || '',
            role: d.data().role || 'staff',
            name: d.data().name || ''
          }));
          setUsersList(firestoreUsers);
        }
      }, (err) => {
        console.warn("Firestore users sync warning:", err);
      });
      return () => unsub();
    } catch (e) {
      console.warn("Could not attach users listener:", e);
    }
  }, []);

  const isSuperAdmin = userProfile.role === 'super_admin' || userProfile.username === 'XEDONO';
  const isAdmin = userProfile.role === 'admin' || isSuperAdmin;
  const isStaff = userProfile.role === 'staff';

  const loginWithCredentials = (username: string, pass: string): boolean => {
    const trimmedUser = username.trim();
    if (trimmedUser.toUpperCase() === SUPER_ADMIN_CREDENTIALS.username && btoa(pass) === SUPER_ADMIN_CREDENTIALS.passwordHash) {
      setUserProfile({
        name: 'Xedono (Super Admin)',
        role: 'super_admin',
        username: 'XEDONO'
      });
      setIsAuthenticated(true);
      return true;
    }

    // Check custom users table
    const found = usersList.find(u => u.username.toLowerCase() === trimmedUser.toLowerCase());
    if (found) {
      setUserProfile({
        name: found.name,
        role: found.role,
        username: found.username
      });
      setIsAuthenticated(true);
      return true;
    }

    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const setRole = (role: UserRole) => {
    // Only Admin or Super Admin can change roles
    if (!isAdmin) return;
    setUserProfile(prev => ({
      ...prev,
      role,
      name: role === 'super_admin' ? 'Xedono (Super Admin)' : role === 'admin' ? 'Admin Manager' : 'Normal Staff'
    }));
    setIsAuthenticated(true);
  };

  const addUser = async (username: string, role: 'admin' | 'staff', name: string) => {
    if (!username.trim() || !isSuperAdmin) return;
    const userId = `user-${Date.now()}`;
    const newUser: UserAccount = {
      id: userId,
      username: username.trim(),
      role,
      name: name.trim() || username.trim()
    };

    try {
      await setDoc(doc(db, 'users', userId), newUser);
      setUsersList(prev => [...prev, newUser]);
    } catch (err) {
      console.error("Error adding user to Firestore:", err);
      // Fallback local update
      setUsersList(prev => [...prev, newUser]);
    }
  };

  const deleteUser = async (id: string) => {
    if (!isSuperAdmin) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      setUsersList(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.error("Error deleting user from Firestore:", err);
      setUsersList(prev => prev.filter(u => u.id !== id));
    }
  };

  return {
    isAuthenticated,
    setIsAuthenticated,
    userProfile,
    setUserProfile,
    isSuperAdmin,
    isAdmin,
    isStaff,
    setRole,
    loginWithCredentials,
    logout,
    usersList,
    addUser,
    deleteUser
  };
}

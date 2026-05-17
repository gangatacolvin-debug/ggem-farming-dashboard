import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userDepartment, setUserDepartment] = useState(null);
  const [hubAssignments, setHubAssignments] = useState([]);
  const [currentHub, setCurrentHub] = useState(null);
  const [userName, setUserName] = useState(null);
  const [loading, setLoading] = useState(true);

  // Login function
  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Fetch user role and department from Firestore
    try {
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserRole(userData.role);
        setUserDepartment(userData.department);
        setHubAssignments(userData.hubAssignments || []);
        setCurrentHub(userData.currentHub || null);
        setUserName(userData.name || userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userCredential.user.displayName || userCredential.user.email);
      }
    } catch (error) {
      console.warn("Fetched user profile failed (permission issue?):", error);
    }

    return userCredential;
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email.trim());
  };

  const logout = () => {
    return signOut(auth);
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      try {
        if (user) {
          // Fetch user role and department
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role);
            setUserDepartment(userData.department);
            setHubAssignments(userData.hubAssignments || []);
            setCurrentHub(userData.currentHub || null);
            setUserName(userData.name || userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || user.displayName || user.email);
          }
        } else {
          setUserRole(null);
          setUserDepartment(null);
          setHubAssignments([]);
          setCurrentHub(null);
          setUserName(null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    userDepartment,
    hubAssignments,
    currentHub,
    userName,
    login,
    resetPassword,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'panchayat.office@gmail.com';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Firebase signup
  const signup = async (email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(result.user);
    return result;
  };

  // Firebase login
  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
    setIsAdmin(false);
  };

  // Register user in backend
  const registerProfile = async (profileData) => {
    try {
      const response = await api.post('/auth/register', profileData);
      if (response.data.success) {
        await fetchUserProfile();
        return response.data;
      }
    } catch (error) {
      throw error;
    }
  };

  // Fetch user profile from backend
  const fetchUserProfile = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        console.log('No token available');
        return null;
      }
      
      const response = await api.get('/auth/me');
      console.log('Profile response:', response.data);
      
      if (response.data.isRegistered) {
        setUserProfile(response.data.user);
        setIsAdmin(response.data.user.role === 'admin');
        return response.data.user;
      } else {
        setUserProfile(null);
        setIsAdmin(response.data.isAdmin || false);
        return null;
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUserProfile(null);
      return null;
    }
  };

  // Check if email is admin
  const checkIsAdmin = (email) => {
    return email === ADMIN_EMAIL;
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        const isAdminUser = checkIsAdmin(user.email);
        setIsAdmin(isAdminUser);
        
        // Fetch user profile
        const profile = await fetchUserProfile();
        
        // If not admin and user is pending/rejected, log them out automatically
        if (!isAdminUser && profile && (profile.status === 'pending' || profile.status === 'rejected')) {
          console.log('User not approved, logging out...');
          await signOut(auth);
          setCurrentUser(null);
          setUserProfile(null);
          setIsAdmin(false);
        }
      } else {
        setUserProfile(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Check if user is approved
  const isApproved = () => {
    return userProfile?.status === 'approved';
  };

  // Check if user is pending
  const isPending = () => {
    return userProfile?.status === 'pending';
  };

  // Check if user is rejected
  const isRejected = () => {
    return userProfile?.status === 'rejected';
  };

  const value = {
    currentUser,
    userProfile,
    isAdmin,
    loading,
    signup,
    login,
    logout,
    registerProfile,
    fetchUserProfile,
    checkIsAdmin,
    isApproved,
    isPending,
    isRejected
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

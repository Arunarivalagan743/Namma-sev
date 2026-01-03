import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'panchayat.office@gmail.com';

const AdminRoute = ({ children }) => {
  const { currentUser, userProfile, loading, fetchUserProfile } = useAuth();
  const location = useLocation();
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  useEffect(() => {
    // Auto-create admin profile if admin is logged in but not registered
    const autoCreateAdminProfile = async () => {
      if (currentUser && currentUser.email === ADMIN_EMAIL && !userProfile && !creatingAdmin) {
        setCreatingAdmin(true);
        try {
          await api.post('/auth/register', {
            name: 'Panchayat Office',
            phone: '0000000000',
            address: '2/783(41, Moogambigai Nagar, Ganapathipalayam, Palladam, Tamil Nadu 641605'
          });
          await fetchUserProfile();
          toast.success('Admin account activated');
        } catch (error) {
          // Profile might already exist, just fetch it
          await fetchUserProfile();
        } finally {
          setCreatingAdmin(false);
        }
      }
    };

    autoCreateAdminProfile();
  }, [currentUser, userProfile, creatingAdmin]);

  if (loading || creatingAdmin) {
    return (
      <div className="min-h-screen bg-gov-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gov-blue font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Not admin
  if (currentUser.email !== ADMIN_EMAIL) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;

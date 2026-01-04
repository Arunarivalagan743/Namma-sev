import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
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

  // Logged in but not registered in backend
  if (!userProfile) {
    return <Navigate to="/register" state={{ from: location }} replace />;
  }

  // Registered but pending approval
  if (userProfile.status === 'pending') {
    return <Navigate to="/pending-approval" replace />;
  }

  // Rejected user - redirect to rejected page
  if (userProfile.status === 'rejected') {
    return <Navigate to="/account-rejected" replace />;
  }

  // Only approved users can access protected routes
  if (userProfile.status !== 'approved') {
    return <Navigate to="/login" replace />;
  }

  // Support both children prop and Outlet for nested routes
  return children ? children : <Outlet />;
};

export default ProtectedRoute;

import { Link, Navigate } from 'react-router-dom';
import { FiXCircle, FiLogOut, FiMail } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AccountRejected = () => {
  const { currentUser, userProfile, logout, loading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // If not logged in, redirect to login
  if (!loading && !currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If user is approved, redirect to dashboard
  if (!loading && userProfile?.status === 'approved') {
    return <Navigate to="/dashboard" replace />;
  }

  // If user is pending, redirect to pending page
  if (!loading && userProfile?.status === 'pending') {
    return <Navigate to="/pending-approval" replace />;
  }

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gov-cream flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gov-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gov-cream flex items-center justify-center py-8 sm:py-12 px-3 sm:px-4">
      <div className="max-w-sm sm:max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-4 sm:mb-6 flex justify-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center">
            <FiXCircle className="text-red-600 w-8 h-8 sm:w-10 sm:h-10" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-red-600 mb-3 sm:mb-4">
          Registration Rejected
        </h1>

        {/* Message */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
            Unfortunately, your registration request has been rejected by the administrator.
          </p>
          
          {userProfile?.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <p className="text-xs sm:text-sm font-medium text-red-800 mb-1">Reason:</p>
              <p className="text-xs sm:text-sm text-red-700">{userProfile.rejectionReason}</p>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600">
              <strong>Email:</strong> {currentUser?.email}
            </p>
          </div>
        </div>

        {/* What to do next */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 text-left">
          <h3 className="font-semibold text-gov-blue mb-2 sm:mb-3 text-sm sm:text-base">What can you do?</h3>
          <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
            <li className="flex items-start space-x-2">
              <span className="text-gov-blue font-bold">•</span>
              <span>Contact the Panchayat office for more information</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-gov-blue font-bold">•</span>
              <span>Verify your registration details are correct</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-gov-blue font-bold">•</span>
              <span>Register again with accurate information</span>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4 sm:mb-6">
          <div className="flex items-center justify-center space-x-2 text-gov-blue">
            <FiMail size={18} />
            <span className="text-sm">panchayat.office@gmail.com</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 sm:space-y-3">
          <button
            onClick={handleLogout}
            className="btn-secondary w-full flex items-center justify-center space-x-2 text-sm sm:text-base py-2.5 sm:py-3"
          >
            <FiLogOut size={18} />
            <span>{t('logout')}</span>
          </button>
          <Link 
            to="/" 
            className="block text-gov-blue hover:underline text-sm"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccountRejected;

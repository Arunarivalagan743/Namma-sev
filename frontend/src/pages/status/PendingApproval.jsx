import { Link } from 'react-router-dom';
import { FiClock, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const PendingApproval = () => {
  const { currentUser, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="min-h-screen bg-gov-cream flex items-center justify-center py-8 sm:py-12 px-3 sm:px-4">
      <div className="max-w-sm sm:max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-4 sm:mb-6 flex justify-center">
          <FiClock className="text-gray-600 w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-gov-blue mb-3 sm:mb-4">
          Registration Pending Approval
        </h1>

        {/* Message */}
        <div className="bg-white p-4 sm:p-6 mb-4 sm:mb-6">
          <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
            Thank you for registering with NamSev!
          </p>
          <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
            Your registration is currently under review by the Panchayat administrator. 
            This process helps us verify that you are a resident of our Panchayat.
          </p>
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-800">
              <strong>Email:</strong> {currentUser?.email}
            </p>
            <p className="text-xs sm:text-sm text-gray-700 mt-1.5 sm:mt-2">
              You will receive an email notification once your account is approved.
            </p>
          </div>
        </div>

        {/* What to expect */}
        <div className="bg-white p-4 sm:p-6 mb-4 sm:mb-6 text-left">
          <h3 className="font-semibold text-gov-blue mb-2 sm:mb-3 text-sm sm:text-base">What happens next?</h3>
          <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
            <li className="flex items-start space-x-2">
              <span className="text-gov-blue font-bold">1.</span>
              <span>Admin reviews your registration details</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-gov-blue font-bold">2.</span>
              <span>Verification of residency information</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-gov-blue font-bold">3.</span>
              <span>Account activation upon approval</span>
            </li>
          </ul>
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
        
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;

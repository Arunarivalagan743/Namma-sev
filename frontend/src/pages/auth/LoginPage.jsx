import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import LanguageSelector from '../../components/LanguageSelector';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'panchayat.office@gmail.com';

const LoginPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login, logout, checkIsAdmin, fetchUserProfile } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation with specific error messages
    if (!email && !password) {
      toast.error('Please enter your email and password to sign in.');
      return;
    }
    
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }
    
    if (!password) {
      toast.error('Please enter your password.');
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address (e.g., yourname@example.com).');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      
      // Wait for profile to be fetched
      const profile = await fetchUserProfile();
      
      // Redirect based on role
      if (checkIsAdmin(email)) {
        toast.success('Login successful');
        navigate('/admin', { replace: true });
      } else if (profile) {
        // User is registered, check status
        if (profile.status === 'pending') {
          // Log out the user - they cannot be logged in without approval
          await logout();
          toast.error('Your account is pending admin approval. Please wait for the administrator to approve your registration before you can login.');
          return;
        } else if (profile.status === 'approved') {
          toast.success('Login successful');
          navigate('/dashboard', { replace: true });
        } else if (profile.status === 'rejected') {
          // Log out the user - rejected users cannot login
          await logout();
          toast.error('Your registration was rejected by the administrator. Please contact support.');
          return;
        } else {
          await logout();
          toast.error('Invalid account status');
          return;
        }
      } else {
        // User not registered in backend yet, log them out
        await logout();
        toast.error('Please complete your registration first');
        navigate('/register', { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let message = 'Login failed. Please try again.';
      
      // Handle all Firebase Auth error codes with user-friendly messages
      switch (error.code) {
        // Email related errors
        case 'auth/user-not-found':
          message = 'This email is not registered. Please create a new account by clicking "Register" below.';
          break;
        case 'auth/invalid-email':
          message = 'Please enter a valid email address (e.g., yourname@example.com).';
          break;
        case 'auth/user-disabled':
          message = 'This account has been disabled. Please contact the administrator for assistance.';
          break;
        
        // Password related errors
        case 'auth/wrong-password':
          message = 'Incorrect password. Please check your password and try again.';
          break;
        case 'auth/invalid-credential':
          message = 'Email not registered or incorrect password. If you don\'t have an account, please click "Register" below to create one.';
          break;
        
        // Rate limiting and security
        case 'auth/too-many-requests':
          message = 'Too many failed login attempts. Please wait a few minutes before trying again, or reset your password.';
          break;
        
        // Network errors
        case 'auth/network-request-failed':
          message = 'Network error. Please check your internet connection and try again.';
          break;
        
        // Account existence errors
        case 'auth/invalid-login-credentials':
          message = 'Email not registered or incorrect password. If you don\'t have an account, please click "Register" below to create one.';
          break;
        
        // Operation errors
        case 'auth/operation-not-allowed':
          message = 'Login is temporarily unavailable. Please try again later.';
          break;
        
        // Timeout
        case 'auth/timeout':
          message = 'Request timed out. Please check your connection and try again.';
          break;
        
        default:
          // Check for generic error messages
          if (error.message?.includes('network')) {
            message = 'Network error. Please check your internet connection.';
          } else if (error.message?.includes('password')) {
            message = 'Incorrect password. Please try again.';
          } else if (error.message?.includes('email')) {
            message = 'Invalid email address. Please check and try again.';
          } else {
            message = 'Unable to sign in. Please check your credentials and try again.';
          }
      }
      
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-gray-50 flex items-center justify-center py-8 sm:py-12 px-4"
      style={{
        backgroundImage: 'linear-gradient(rgba(30, 58, 95, 0.85), rgba(30, 58, 95, 0.9)), url(https://images.unsplash.com/photo-1560439514-4e9645039924?w=1920&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Language Selector */}
        <div className="flex justify-end mb-3 sm:mb-4">
          <LanguageSelector variant="dropdown" />
        </div>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <img src="/namsev-logo.png" alt="NamSev" className="h-20 sm:h-24 md:h-32 mx-auto mb-3 sm:mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold text-white">{t('welcome')}</h1>
          <p className="text-gray-300 mt-1 sm:mt-2 text-sm sm:text-base">{t('panchayatName')}</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg p-5 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#1e3a5f] mb-1.5 sm:mb-2">
                {t('emailAddress')}
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10 text-sm sm:text-base"
                  placeholder={t('enterEmail')}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#1e3a5f] mb-1.5 sm:mb-2">
                {t('password')}
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10 text-sm sm:text-base"
                  placeholder={t('enterPassword')}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center space-x-2 py-2.5 sm:py-3 text-sm sm:text-base"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FiLogIn size={18} />
                  <span>{t('signIn')}</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-4 sm:my-6 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-3 sm:px-4 text-xs sm:text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Register Link */}
          <p className="text-center text-gray-600 text-sm sm:text-base">
            {t('dontHaveAccount')}{' '}
            <Link to="/register" className="text-[#c41e3a] font-medium hover:underline">
              {t('register')}
            </Link>
          </p>
        </div>

        {/* Admin Notice */}
       
      </div>
    </div>
  );
};

export default LoginPage;

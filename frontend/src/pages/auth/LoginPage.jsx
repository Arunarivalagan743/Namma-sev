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
  
  const { login, checkIsAdmin, fetchUserProfile } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      
      // Wait for profile to be fetched
      const profile = await fetchUserProfile();
      
      toast.success('Login successful');
      
      // Redirect based on role
      if (checkIsAdmin(email)) {
        navigate('/admin');
      } else if (profile) {
        // User is registered, go to dashboard
        if (profile.status === 'pending') {
          navigate('/pending-approval');
        } else if (profile.status === 'approved') {
          navigate('/dashboard');
        } else {
          toast.error('Your registration was rejected');
        }
      } else {
        // User not registered, go to registration
        navigate('/register');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let message = 'Login failed';
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please try again later';
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

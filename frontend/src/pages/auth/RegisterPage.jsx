import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import LanguageSelector from '../../components/LanguageSelector';
import { 
  FiMail, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiUser, 
  FiPhone, 
  FiMapPin,
  FiUserPlus
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const PANCHAYAT_NAME = import.meta.env.VITE_PANCHAYAT_NAME || 'Ganapathipalayam Panchayat';
const PANCHAYAT_CODE = import.meta.env.VITE_PANCHAYAT_CODE || 'TIRU001';

const RegisterPage = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Step 1: Firebase Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Step 2: Profile Details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [aadhaarLast4, setAadhaarLast4] = useState('');
  
  const { signup, login, registerProfile, currentUser, checkIsAdmin } = useAuth();
  const navigate = useNavigate();

  const handleStep1 = async (e) => {
    e.preventDefault();
    
    // Validation with specific error messages
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address (e.g., yourname@example.com).');
      return;
    }
    
    if (!password) {
      toast.error('Please enter a password.');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }
    
    // Password strength validation
    if (!/[a-zA-Z]/.test(password)) {
      toast.error('Password should contain at least one letter.');
      return;
    }
    
    if (!confirmPassword) {
      toast.error('Please confirm your password.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match. Please make sure both passwords are the same.');
      return;
    }

    setLoading(true);

    try {
      await signup(email, password);
      toast.success('Account created! Please complete your profile.');
      setStep(2);
    } catch (error) {
      console.error('Signup error:', error);
      
      let message = 'Registration failed. Please try again.';
      
      // Handle all Firebase Auth error codes with user-friendly messages
      switch (error.code) {
        // Email related errors
        case 'auth/email-already-in-use':
          message = 'This email is already registered. Please login instead or use a different email.';
          break;
        case 'auth/invalid-email':
          message = 'Please enter a valid email address (e.g., yourname@example.com).';
          break;
        
        // Password related errors
        case 'auth/weak-password':
          message = 'Password is too weak. Please use at least 6 characters with a mix of letters and numbers.';
          break;
        
        // Operation errors
        case 'auth/operation-not-allowed':
          message = 'Registration is temporarily unavailable. Please try again later.';
          break;
        
        // Network errors
        case 'auth/network-request-failed':
          message = 'Network error. Please check your internet connection and try again.';
          break;
        
        // Rate limiting
        case 'auth/too-many-requests':
          message = 'Too many registration attempts. Please wait a few minutes before trying again.';
          break;
        
        // Timeout
        case 'auth/timeout':
          message = 'Request timed out. Please check your connection and try again.';
          break;
        
        // Internal errors
        case 'auth/internal-error':
          message = 'An internal error occurred. Please try again later.';
          break;
        
        default:
          // Check for generic error messages
          if (error.message?.includes('network')) {
            message = 'Network error. Please check your internet connection.';
          } else if (error.message?.includes('email')) {
            message = 'There was an issue with your email. Please check and try again.';
          } else if (error.message?.includes('password')) {
            message = 'There was an issue with your password. Please use at least 6 characters.';
          } else {
            message = 'Unable to create account. Please try again later.';
          }
      }
      
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    
    // Validation with specific error messages
    if (!name) {
      toast.error('Please enter your full name.');
      return;
    }
    
    if (name.trim().length < 2) {
      toast.error('Please enter a valid name (at least 2 characters).');
      return;
    }
    
    if (!phone) {
      toast.error('Please enter your phone number.');
      return;
    }

    if (phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number.');
      return;
    }
    
    // Validate phone starts with valid Indian mobile prefix
    if (!/^[6-9]/.test(phone)) {
      toast.error('Please enter a valid Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }
    
    if (!address) {
      toast.error('Please enter your residential address.');
      return;
    }
    
    if (address.trim().length < 10) {
      toast.error('Please enter a complete address (at least 10 characters).');
      return;
    }
    
    // Validate Aadhaar if provided
    if (aadhaarLast4 && aadhaarLast4.length !== 4) {
      toast.error('Please enter exactly 4 digits of your Aadhaar number.');
      return;
    }

    setLoading(true);

    try {
      await registerProfile({
        name,
        phone,
        address,
        aadhaarLast4: aadhaarLast4 || null
      });
      
      toast.success('Registration completed successfully!');
      
      // Redirect based on role
      if (checkIsAdmin(currentUser?.email)) {
        navigate('/admin');
      } else {
        navigate('/pending-approval');
      }
    } catch (error) {
      console.error('Profile registration error:', error);
      
      let message = 'Failed to complete registration. Please try again.';
      
      // Handle different HTTP status codes
      const status = error.response?.status;
      
      switch (status) {
        case 400:
          message = error.response?.data?.message || 'Invalid information provided. Please check your details and try again.';
          break;
        case 401:
          message = 'Session expired. Please login again to complete registration.';
          break;
        case 403:
          message = 'Access denied. You do not have permission to perform this action.';
          break;
        case 404:
          message = 'Service not found. Please try again later.';
          break;
        case 409:
          message = 'An account with this information already exists. Please login instead.';
          toast.error(message);
          setTimeout(() => {
            navigate('/login');
          }, 2000);
          return;
        case 422:
          message = error.response?.data?.message || 'Invalid data provided. Please check your information.';
          break;
        case 429:
          message = 'Too many requests. Please wait a moment and try again.';
          break;
        case 500:
          message = 'Server error. Please try again later or contact support.';
          break;
        case 502:
        case 503:
        case 504:
          message = 'Service temporarily unavailable. Please try again in a few minutes.';
          break;
        default:
          // Handle network or other errors
          if (error.message?.includes('Network Error') || error.code === 'ERR_NETWORK') {
            message = 'Network error. Please check your internet connection and try again.';
          } else if (error.message?.includes('timeout')) {
            message = 'Request timed out. Please check your connection and try again.';
          } else if (error.response?.data?.message) {
            message = error.response.data.message;
          }
      }
      
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-gray-50 flex items-center justify-center py-6 sm:py-8 md:py-12 px-3 sm:px-4"
      style={{
        backgroundImage: 'linear-gradient(rgba(30, 58, 95, 0.85), rgba(30, 58, 95, 0.9)), url(https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=1920&q=80)',
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
        <div className="text-center mb-5 sm:mb-8">
          <img src="/namsev-logo.png" alt="NamSev" className="h-16 sm:h-20 md:h-32 mx-auto mb-3 sm:mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold text-white">{t('register')}</h1>
          <p className="text-gray-300 mt-1.5 sm:mt-2 text-sm sm:text-base">{t('panchayatName')}</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-5 sm:mb-8">
          <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-sm sm:text-base ${step >= 1 ? 'bg-[#c41e3a] text-white' : 'bg-gray-200 text-gray-500'}`}>
            {step > 1 ? '✓' : '1'}
          </div>
          <div className={`w-10 sm:w-16 h-1 ${step > 1 ? 'bg-[#c41e3a]' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-sm sm:text-base ${step >= 2 ? 'bg-[#c41e3a] text-white' : 'bg-gray-200 text-gray-500'}`}>
            2
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg p-5 sm:p-6 md:p-8">
          {step === 1 ? (
            /* Step 1: Create Account */
            <form onSubmit={handleStep1} className="space-y-4 sm:space-y-5">
              <h2 className="text-base sm:text-lg font-semibold text-[#1e3a5f] mb-3 sm:mb-4">{t('createAccount')}</h2>
              
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-[#1e3a5f] mb-1.5 sm:mb-2">
                  {t('emailAddress')} *
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10 text-sm sm:text-base"
                    placeholder="your.email@example.com"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-[#1e3a5f] mb-1.5 sm:mb-2">
                  {t('password')} *
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10 pr-10 text-sm sm:text-base"
                    placeholder="Minimum 6 characters"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-[#1e3a5f] mb-1.5 sm:mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field pl-10 text-sm sm:text-base"
                    placeholder="Re-enter password"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center space-x-2 py-2.5 sm:py-3 text-sm sm:text-base"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Continue</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Step 2: Profile Details with Phone Verification */
            <form onSubmit={handleStep2} className="space-y-4 sm:space-y-5">
              <h2 className="text-base sm:text-lg font-semibold text-[#1e3a5f] mb-3 sm:mb-4">Personal Details</h2>
              
              {/* Panchayat Info */}
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm text-gray-700">
                  <strong>Panchayat:</strong> {PANCHAYAT_NAME}
                </p>
                <p className="text-xs sm:text-sm text-gray-700">
                  <strong>Code:</strong> {PANCHAYAT_CODE}
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-[#1e3a5f] mb-1.5 sm:mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field pl-10 text-sm sm:text-base"
                    placeholder="As per Aadhaar"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-[#1e3a5f] mb-1.5 sm:mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <div className="absolute left-9 sm:left-10 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs sm:text-sm">+91</div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                    }}
                    className="input-field pl-16 sm:pl-20 text-sm sm:text-base"
                    placeholder="10-digit number"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-[#1e3a5f] mb-1.5 sm:mb-2">
                  Residential Address *
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="input-field pl-10 min-h-[70px] sm:min-h-[80px] text-sm sm:text-base"
                    placeholder="House No., Street, Area"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Aadhaar Last 4 */}
              <div>
                <label className="block text-sm font-medium text-[#1e3a5f] mb-1.5 sm:mb-2">
                  Last 4 digits of Aadhaar (Optional)
                </label>
                <input
                  type="text"
                  value={aadhaarLast4}
                  onChange={(e) => setAadhaarLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="input-field text-sm sm:text-base"
                  placeholder="XXXX"
                  disabled={loading}
                  maxLength={4}
                />
                <p className="text-xs text-gray-500 mt-1">For verification purposes only</p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center space-x-2 py-2.5 sm:py-3 text-sm sm:text-base disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <FiUserPlus size={18} />
                    <span>Complete Registration</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Login Link */}
          <p className="text-center text-gray-600 mt-4 sm:mt-6 text-sm sm:text-base">
            Already have an account?{' '}
            <Link to="/login" className="text-[#c41e3a] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

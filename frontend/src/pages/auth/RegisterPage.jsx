import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import { sendPhoneVerificationOTP, verifyPhoneOTP } from '../../config/firebase';
import LanguageSelector from '../../components/LanguageSelector';
import { 
  FiMail, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiUser, 
  FiPhone, 
  FiMapPin,
  FiUserPlus,
  FiCheck,
  FiShield
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
  
  // Phone Verification (verification only, not authentication)
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  
  const { signup, login, registerProfile, currentUser, checkIsAdmin } = useAuth();
  const navigate = useNavigate();

  // OTP Timer countdown
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleSendOTP = async () => {
    if (!phone || phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setSendingOtp(true);
    try {
      const verId = await sendPhoneVerificationOTP(phone);
      setVerificationId(verId);
      setOtpSent(true);
      setOtpTimer(60); // 60 seconds countdown
      toast.success('OTP sent to +91 ' + phone);
    } catch (error) {
      console.error('OTP send error:', error);
      let message = 'Failed to send OTP';
      if (error.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please try again later.';
      } else if (error.code === 'auth/invalid-phone-number') {
        message = 'Invalid phone number format';
      } else if (error.code === 'auth/quota-exceeded') {
        message = 'SMS quota exceeded. Please try again later.';
      }
      toast.error(message);
      // Reset recaptcha on error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier = null;
      }
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    if (!verificationId) {
      toast.error('Please request OTP first');
      return;
    }

    setVerifyingOtp(true);
    try {
      await verifyPhoneOTP(verificationId, otp, currentUser);
      setPhoneVerified(true);
      toast.success('Phone number verified successfully!');
    } catch (error) {
      console.error('OTP verification error:', error);
      let message = 'Invalid OTP';
      if (error.code === 'auth/invalid-verification-code') {
        message = 'Invalid OTP. Please try again.';
      } else if (error.code === 'auth/code-expired') {
        message = 'OTP expired. Please request a new one.';
      }
      toast.error(message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleStep1 = async (e) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signup(email, password);
      toast.success('Account created! Please complete your profile.');
      setStep(2);
    } catch (error) {
      console.error('Signup error:', error);
      
      let message = 'Registration failed';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Email already registered. Please login.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak';
      }
      
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    
    if (!name || !phone || !address) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    if (!phoneVerified) {
      toast.error('Please verify your phone number first');
      return;
    }

    setLoading(true);

    try {
      await registerProfile({
        name,
        phone,
        address,
        aadhaarLast4: aadhaarLast4 || null,
        phoneVerified: true
      });
      
      toast.success('Registration submitted successfully!');
      
      // Redirect based on role
      if (checkIsAdmin(currentUser?.email)) {
        navigate('/admin');
      } else {
        navigate('/pending-approval');
      }
    } catch (error) {
      console.error('Profile registration error:', error);
      toast.error(error.response?.data?.message || 'Failed to complete registration');
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
      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container"></div>

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
            {step > 1 ? <FiCheck size={14} className="sm:hidden" /> : null}
            {step > 1 ? <FiCheck size={16} className="hidden sm:block" /> : '1'}
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

              {/* Phone with OTP Verification */}
              <div>
                <label className="block text-sm font-medium text-[#1e3a5f] mb-1.5 sm:mb-2">
                  Phone Number * 
                  {phoneVerified && (
                    <span className="text-green-600 ml-2 text-xs">
                      <FiCheck className="inline mr-1" /> Verified
                    </span>
                  )}
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <div className="absolute left-9 sm:left-10 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs sm:text-sm">+91</div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                        setPhoneVerified(false);
                        setOtpSent(false);
                        setOtp('');
                      }}
                      className="input-field pl-16 sm:pl-20 text-sm sm:text-base"
                      placeholder="10-digit number"
                      disabled={loading || phoneVerified}
                      required
                    />
                  </div>
                  {!phoneVerified && (
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={sendingOtp || phone.length !== 10 || otpTimer > 0}
                      className="px-3 sm:px-4 py-2.5 sm:py-2 bg-[#1e3a5f] text-white text-xs sm:text-sm font-medium rounded hover:bg-[#152a47] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap w-full sm:w-auto"
                    >
                      {sendingOtp ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                      ) : otpTimer > 0 ? (
                        `Resend (${otpTimer}s)`
                      ) : otpSent ? (
                        'Resend OTP'
                      ) : (
                        'Send OTP'
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* OTP Input */}
              {otpSent && !phoneVerified && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                  <label className="block text-xs sm:text-sm font-medium text-[#1e3a5f] mb-2">
                    <FiShield className="inline mr-1" />
                    Enter OTP sent to +91 {phone}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="input-field flex-1 text-center text-base sm:text-lg tracking-widest font-mono"
                      placeholder="• • • • • •"
                      maxLength={6}
                      disabled={verifyingOtp}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOTP}
                      disabled={verifyingOtp || otp.length !== 6}
                      className="px-4 py-2.5 sm:py-2 bg-[#c41e3a] text-white text-sm font-medium rounded hover:bg-[#a01830] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
                    >
                      {verifyingOtp ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                      ) : (
                        'Verify'
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Didn't receive OTP? Check your SMS or wait for timer to resend.
                  </p>
                </div>
              )}

              {/* Verified Badge */}
              {phoneVerified && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 sm:p-3 flex items-center">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center mr-2.5 sm:mr-3 flex-shrink-0">
                    <FiCheck className="text-white" size={16} />
                  </div>
                  <div>
                    <p className="text-green-800 font-medium text-xs sm:text-sm">Phone Verified</p>
                    <p className="text-green-600 text-xs">+91 {phone}</p>
                  </div>
                </div>
              )}

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
                disabled={loading || !phoneVerified}
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

              {!phoneVerified && (
                <p className="text-xs text-center text-gray-500">
                  Please verify your phone number to complete registration
                </p>
              )}
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

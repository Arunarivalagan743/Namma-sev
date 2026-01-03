import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import LanguageSelector from './LanguageSelector';
import toast from 'react-hot-toast';
import { FiMenu, FiX, FiHome, FiFileText, FiPlusCircle, FiBell, FiCalendar, FiUser, FiLogOut, FiChevronRight } from 'react-icons/fi';

const CitizenNav = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    try {
      setMobileMenuOpen(false);
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/', label: t('home'), icon: FiHome },
    { path: '/new-complaint', label: t('fileComplaint'), icon: FiPlusCircle },
    { path: '/my-complaints', label: t('myComplaints'), icon: FiFileText },
    { path: '/announcements', label: t('announcements'), icon: FiBell },
    { path: '/calendar', label: 'Calendar', icon: FiCalendar },
    { path: '/profile', label: t('profile'), icon: FiUser },
  ];

  return (
    <>
      {/* Sticky Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Hamburger Menu Button - Mobile Only */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 text-[#1e3a5f] hover:text-[#c41e3a] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center flex-shrink-0">
              <img src="/namsev-logo.png" alt="NamSev" className="h-10 sm:h-12 lg:h-14" />
            </Link>

            {/* Desktop Navigation Links - Hidden on mobile & tablet */}
            <div className="hidden lg:flex items-center space-x-1 xl:space-x-2">
              {navLinks.map((link) => (
                <Link 
                  key={link.path}
                  to={link.path} 
                  className={`font-medium text-xs xl:text-sm px-2 xl:px-3 py-2 uppercase whitespace-nowrap transition-colors ${
                    isActive(link.path) || (link.path === '/' && isActive('/dashboard'))
                      ? 'text-[#1e3a5f] border-b-2 border-[#c41e3a]' 
                      : 'text-gray-600 hover:text-[#c41e3a]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <LanguageSelector variant="compact" />
              <span className="hidden xl:inline text-gray-600 text-sm truncate max-w-[120px]">
                {userProfile?.name || currentUser?.email?.split('@')[0]}
              </span>
              <button 
                onClick={handleLogout} 
                className="hidden lg:flex items-center space-x-1 text-[#c41e3a] hover:text-[#a01830] text-sm font-medium transition-colors"
              >
                <FiLogOut size={16} />
                <span>{t('logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Slide-out Menu */}
      <div 
        className={`fixed top-0 left-0 h-full w-[280px] sm:w-[320px] bg-white z-50 lg:hidden transform transition-transform duration-300 ease-in-out shadow-2xl ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Menu Header */}
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2c5282] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <img src="/namsev-logo.png" alt="NamSev" className="h-10 sm:h-12 brightness-0 invert" />
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-white/80 hover:text-white transition-colors"
            >
              <FiX size={24} />
            </button>
          </div>
          
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-full flex items-center justify-center">
              <FiUser className="text-white" size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm sm:text-base truncate">
                {userProfile?.name || 'User'}
              </p>
              <p className="text-white/70 text-xs sm:text-sm truncate">
                {currentUser?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="p-3 sm:p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-3">Menu</p>
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl transition-all ${
                  isActive(link.path) || (link.path === '/' && isActive('/dashboard'))
                    ? 'bg-[#c41e3a] text-white shadow-md' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <link.icon size={20} className={isActive(link.path) ? 'text-white' : 'text-gray-500'} />
                  <span className="font-medium text-sm sm:text-base">{link.label}</span>
                </div>
                <FiChevronRight size={16} className={isActive(link.path) ? 'text-white/70' : 'text-gray-400'} />
              </Link>
            ))}
          </div>
        </div>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 border-t bg-gray-50">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-[#c41e3a]/10 text-[#c41e3a] rounded-xl font-medium hover:bg-[#c41e3a] hover:text-white transition-all"
          >
            <FiLogOut size={18} />
            <span className="text-sm sm:text-base">{t('logout')}</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default CitizenNav;

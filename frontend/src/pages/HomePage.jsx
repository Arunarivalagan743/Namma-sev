import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import LanguageSelector from '../components/LanguageSelector';
import TranslatedText from '../components/TranslatedText';
import toast from 'react-hot-toast';
import api from '../services/api';
import { 
  FiPlay, FiMapPin, FiMail, FiChevronDown, FiMenu, FiX, 
  FiHome, FiUsers, FiBookOpen, FiCalendar, FiGrid, 
  FiPieChart, FiList, FiFileText, FiHelpCircle, FiLogIn, FiLogOut, FiEye
} from 'react-icons/fi';

const HomePage = () => {
  const { currentUser, userProfile, logout, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = !!currentUser;
  const contentRef = useRef(null);
  
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dynamic Data State
  const [homeData, setHomeData] = useState({
    news: [],
    alerts: [],
    announcements: [],
    events: [],
    nextMeeting: null,
    activePoll: null,
    works: [],
    schemes: [],
    suggestions: []
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Redirect pending/rejected users to appropriate pages immediately
  useEffect(() => {
    if (!authLoading && userProfile) {
      if (userProfile.status === 'pending') {
        navigate('/pending-approval', { replace: true });
        return;
      } else if (userProfile.status === 'rejected') {
        navigate('/account-rejected', { replace: true });
        return;
      }
    }
  }, [userProfile, authLoading, navigate]);

  // Block rendering for pending/rejected users
  if (!authLoading && userProfile && (userProfile.status === 'pending' || userProfile.status === 'rejected')) {
    return (
      <div className="min-h-screen bg-gov-cream flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gov-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Fetch home page data with auto-refresh every 30 seconds
  useEffect(() => {
    const fetchHomeData = async (silent = false) => {
      try {
        const response = await api.get('/engagement/home');
        if (response.data.success) {
          setHomeData(response.data.data);
          setLastUpdated(new Date());
        }
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        if (!silent) setLoading(false);
      }
    };
    
    fetchHomeData();
    const interval = setInterval(() => fetchHomeData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
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
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-[#c41e3a]';
      case 'high': return 'bg-gray-700';
      case 'medium': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getWorkStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-[#1e3a5f]';
      case 'in_progress': return 'bg-[#c41e3a]';
      case 'planned': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  };

  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Global Mobile Slide-Out Menu */}
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />
      
      {/* Slide-out Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-[280px] sm:w-[320px] bg-[#1e3a5f] z-[101] transform transition-transform duration-300 ease-out lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <img src="/namsev-logo.png" alt="NamSev" className="h-10" />
            <span className="text-white font-semibold text-lg">Menu</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-menu-item flex items-center space-x-3 px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <FiHome size={20} className="flex-shrink-0" />
              <span className="mobile-menu-text font-medium">{t('home')}</span>
            </Link>
            <Link
              to="/meetings"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-menu-item flex items-center space-x-3 px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <FiUsers size={20} className="flex-shrink-0" />
              <span className="mobile-menu-text font-medium">Gram Sabha</span>
            </Link>
            <Link
              to="/schemes"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-menu-item flex items-center space-x-3 px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <FiBookOpen size={20} className="flex-shrink-0" />
              <span className="mobile-menu-text font-medium">Schemes</span>
            </Link>
            <Link
              to="/events"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-menu-item flex items-center space-x-3 px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <FiCalendar size={20} className="flex-shrink-0" />
              <span className="mobile-menu-text font-medium">Events</span>
            </Link>
            <Link
              to="/works"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-menu-item flex items-center space-x-3 px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <FiGrid size={20} className="flex-shrink-0" />
              <span className="mobile-menu-text font-medium">Works</span>
            </Link>
            <Link
              to="/polls"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-menu-item flex items-center space-x-3 px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <FiPieChart size={20} className="flex-shrink-0" />
              <span className="mobile-menu-text font-medium">Polls</span>
            </Link>
            <Link
              to="/calendar"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-menu-item flex items-center space-x-3 px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <FiList size={20} className="flex-shrink-0" />
              <span className="mobile-menu-text font-medium">Calendar</span>
            </Link>
            <Link
              to="/announcements"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-menu-item flex items-center space-x-3 px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <FiFileText size={20} className="flex-shrink-0" />
              <span className="mobile-menu-text font-medium">News</span>
            </Link>
            <Link
              to="/public-complaints"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-menu-item flex items-center space-x-3 px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <FiEye size={20} className="flex-shrink-0" />
              <span className="mobile-menu-text font-medium">Public Complaints</span>
            </Link>
            <Link
              to="/faqs"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-menu-item flex items-center space-x-3 px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <FiHelpCircle size={20} className="flex-shrink-0" />
              <span className="mobile-menu-text font-medium">Contact</span>
            </Link>
          </div>
          
          {/* Divider */}
          <div className="my-4 mx-4 border-t border-white/20"></div>
          
          {/* Login/Logout in Mobile Menu */}
          <div className="px-3">
            {isLoggedIn ? (
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="mobile-menu-item flex items-center space-x-3 w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <FiLogOut size={20} className="flex-shrink-0" />
                <span className="mobile-menu-text font-medium">{t('logout')}</span>
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="mobile-menu-item flex items-center space-x-3 px-4 py-3 bg-[#c41e3a] text-white rounded-lg hover:bg-[#a01830] transition-colors"
              >
                <FiLogIn size={20} className="flex-shrink-0" />
                <span className="mobile-menu-text font-medium">{t('login')}</span>
              </Link>
            )}
          </div>
        </nav>
        
        {/* Menu Footer */}
        <div className="p-4 border-t border-white/20">
          <div className="text-white/60 text-xs text-center">
            <p>Ganapathipalayam Gram Panchayat</p>
            <p className="mt-1">contact@grampanchayat.gov.in</p>
          </div>
        </div>
      </div>

      {/* Full-Screen Hero Section */}
      <section 
        className="relative min-h-screen w-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80)'
        }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50"></div>

        {/* Top Navigation Bar */}
        <div className="absolute top-0 left-0 right-0 z-20">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link to="/" className="flex items-center">
                <img src="/namsev-logo.png" alt="NamSev" className="h-12 sm:h-16 md:h-20" />
              </Link>

              {/* Right Side - Contact & CTA */}
              <div className="hidden lg:flex items-center space-x-6">
                <div className="flex items-center text-white/80 text-sm">
                  <FiMail className="mr-2" />
                  <span>contact@grampanchayat.gov.in</span>
                </div>
                <Link 
                  to="/schemes"
                  className="flex items-center bg-[#c41e3a] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#a01830] transition-colors"
                >
                  <FiMapPin className="mr-2" />
                  View Schemes
                </Link>
              </div>
              
              {/* Mobile Menu Button */}
              <div className="lg:hidden flex items-center space-x-2 sm:space-x-3 mobile-nav-container">
                <div className="nav-lang-selector">
                  <LanguageSelector variant="compact" className="text-white [&_button]:text-white" />
                </div>
                {isLoggedIn ? (
                  <button onClick={handleLogout} className="text-white text-sm px-2 sm:px-3 py-2 nav-auth-btn">{t('logout')}</button>
                ) : (
                  <Link to="/login" className="bg-[#c41e3a] text-white px-2 sm:px-3 py-2 rounded text-sm nav-auth-btn">{t('login')}</Link>
                )}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>
              </div>
            </div>

            {/* Main Navigation - Desktop */}
            <nav className="hidden lg:flex mt-4 lg:mt-6 flex-wrap items-center justify-center gap-3 lg:gap-6 text-white text-xs sm:text-sm font-medium">
              <Link to="/" className="hover:text-[#c41e3a] transition-colors border-b-2 border-[#c41e3a] pb-1">{t('home')}</Link>
              <Link to="/meetings" className="hover:text-[#c41e3a] transition-colors">Gram Sabha</Link>
              <Link to="/schemes" className="hover:text-[#c41e3a] transition-colors">Schemes</Link>
              <Link to="/events" className="hover:text-[#c41e3a] transition-colors">Events</Link>
              <Link to="/works" className="hover:text-[#c41e3a] transition-colors">Works</Link>
              <Link to="/polls" className="hover:text-[#c41e3a] transition-colors">Polls</Link>
              <Link to="/calendar" className="hover:text-[#c41e3a] transition-colors">Calendar</Link>
              <Link to="/announcements" className="hover:text-[#c41e3a] transition-colors">News</Link>
              <Link to="/faqs" className="hover:text-[#c41e3a] transition-colors">Contact</Link>
              <div className="hidden lg:flex items-center space-x-4 ml-4 lg:ml-6 pl-4 lg:pl-6 border-l border-white/30">
                <LanguageSelector variant="compact" className="text-white [&_button]:text-white [&_button:hover]:text-[#c41e3a]" />
                {isLoggedIn ? (
                  <button onClick={handleLogout} className="hover:text-[#c41e3a] transition-colors">{t('logout')}</button>
                ) : (
                  <Link to="/login" className="hover:text-[#c41e3a] transition-colors">{t('login')}</Link>
                )}
              </div>
            </nav>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full min-h-screen flex items-center">
          <div className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-32 md:pt-40 pb-16">
            <div className="max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
              {/* Main Headline */}
              <h1 className="hero-title text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif text-white leading-tight mb-4 sm:mb-6">
                {t('heroTitle')}
              </h1>

              {/* Subtitle with Left Border */}
              <div className="border-l-4 border-white/50 pl-4 sm:pl-6 mb-6 sm:mb-10">
                <p className="hero-subtitle text-white/90 text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl">
                  {t('heroSubtitle')}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6">
                <Link 
                  to={isLoggedIn ? "/new-complaint" : "/register"}
                  className="hero-btn bg-[#c41e3a] text-white px-6 sm:px-8 py-3 sm:py-4 rounded font-medium text-base sm:text-lg hover:bg-[#a01830] transition-colors shadow-lg text-center"
                >
                  {isLoggedIn ? t('fileComplaint') : t('getStarted')}
                </Link>
                <Link 
                  to="/meetings"
                  className="hero-btn bg-white/10 backdrop-blur-sm text-white border border-white/30 px-6 sm:px-8 py-3 sm:py-4 rounded font-medium text-base sm:text-lg hover:bg-white/20 transition-colors text-center"
                >
                  {t('gramSabha')}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Down Indicator */}
        <button 
          onClick={scrollToContent}
          className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 text-white flex flex-col items-center animate-bounce cursor-pointer hover:opacity-80 transition-opacity"
        >
          <span className="text-xs sm:text-sm mb-2">{t('scrollDown')}</span>
          <FiChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </section>

      {/* Content Section Reference */}
      <div ref={contentRef}></div>

      {/* Minimal Glass Alert & Announcements Section */}
      {(homeData.alerts.length > 0 || (homeData.announcements && homeData.announcements.length > 0)) && (
        <div className="relative bg-white border-b border-gray-200">
          
          <div className="relative container mx-auto px-4 py-3 space-y-2">
            {/* Emergency Alerts - Sharp Card */}
            {homeData.alerts.length > 0 && (
              <div className="relative  ">
                <div className="flex items-center px-5 py-3">
                  {/* Icon */}
                 
                  
                  {/* Label */}
                  <div className="flex items-center mr-6">
                      <span className="text-xs font-semibold text-[#c41e3a] uppercase tracking-wider">{t('alert')}</span>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 overflow-hidden">
                    <div className="flex animate-marquee-smooth whitespace-nowrap">
                      {homeData.alerts.map((alert) => (
                        <span key={alert._id || alert.id} className="inline-flex items-center mx-8">
                          <span className="px-2 py-0.5 bg-[#c41e3a] text-white text-xs font-medium mr-3">
                            {alert.alert_type?.toUpperCase().replace('_', ' ')}
                          </span>
                          <TranslatedText text={alert.title} className="text-gray-800 text-sm" />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Announcements - Sharp Card */}
            {homeData.announcements && homeData.announcements.length > 0 && (
              <div className="relative">
                <div className="flex items-center px-5 py-3">
                  {/* Icon */}
              
                  
                  {/* Label */}
                  <div className="flex items-center mr-6">
                    <span className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wider">{t('announcements')}</span>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 overflow-hidden">
                    <div className="flex animate-marquee-smooth whitespace-nowrap">
                      {homeData.announcements.map((announcement) => (
                        <span key={announcement.id} className="inline-flex items-center mx-8">
                          <span className={`px-2 py-0.5 text-white text-xs font-medium mr-3 ${
                            announcement.priority === 'urgent' ? 'bg-[#c41e3a]' :
                            announcement.priority === 'high' ? 'bg-gray-700' :
                            announcement.priority === 'normal' ? 'bg-[#1e3a5f]' : 
                            'bg-gray-500'
                          }`}>
                            {announcement.priority?.toUpperCase()}
                          </span>
                          <TranslatedText text={announcement.title} className="text-gray-800 text-sm" />
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* View all link */}
                  <Link to="/announcements" className="hidden md:flex items-center text-[#1e3a5f] text-xs font-medium hover:text-[#c41e3a] transition-colors ml-4">
                    <span>{t('viewAll')}</span>
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sticky Navigation for Scrolled Content */}
      <nav className="bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-2 sm:py-3">
            <Link to="/" className="flex items-center">
              <img src="/namsev-logo.png" alt="NamSev" className="h-10 sm:h-12 md:h-14" />
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center justify-center flex-wrap gap-1 md:gap-2 lg:gap-4">
              <Link to="/" className="text-[#1e3a5f] font-medium text-xs sm:text-sm px-2 sm:px-3 py-1 border-b-2 border-[#c41e3a]">{t('home').toUpperCase()}</Link>
              <Link to="/meetings" className="text-gray-600 font-medium text-xs sm:text-sm px-2 sm:px-3 py-1 hover:text-[#c41e3a]">{t('gramSabha').toUpperCase()}</Link>
              <Link to="/schemes" className="text-gray-600 font-medium text-xs sm:text-sm px-2 sm:px-3 py-1 hover:text-[#c41e3a]">{t('schemes').toUpperCase()}</Link>
              <Link to="/events" className="text-gray-600 font-medium text-xs sm:text-sm px-2 sm:px-3 py-1 hover:text-[#c41e3a]">{t('events').toUpperCase()}</Link>
              <Link to="/works" className="text-gray-600 font-medium text-xs sm:text-sm px-2 sm:px-3 py-1 hover:text-[#c41e3a]">{t('works').toUpperCase()}</Link>
              <Link to="/polls" className="text-gray-600 font-medium text-xs sm:text-sm px-2 sm:px-3 py-1 hover:text-[#c41e3a]">{t('polls').toUpperCase()}</Link>
              <Link to="/calendar" className="text-gray-600 font-medium text-xs sm:text-sm px-2 sm:px-3 py-1 hover:text-[#c41e3a]">CALENDAR</Link>
              {isLoggedIn && (
                <>
                  <Link to="/new-complaint" className="text-gray-600 font-medium text-xs sm:text-sm px-2 sm:px-3 py-1 hover:text-[#c41e3a]">{t('fileComplaint').toUpperCase()}</Link>
                  <Link to="/my-complaints" className="text-gray-600 font-medium text-xs sm:text-sm px-2 sm:px-3 py-1 hover:text-[#c41e3a]">{t('myComplaints').toUpperCase()}</Link>
                </>
              )}
              <Link to="/faqs" className="text-gray-600 font-medium text-xs sm:text-sm px-2 sm:px-3 py-1 hover:text-[#c41e3a]">{t('faqs').toUpperCase()}</Link>
            </div>
            
            {/* Mobile Navigation - Hamburger */}
            <div className="flex lg:hidden items-center space-x-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-[#1e3a5f] hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
              </button>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              <LanguageSelector variant="compact" />
              {isLoggedIn ? (
                <button onClick={handleLogout} className="text-gray-600 hover:text-[#c41e3a] text-xs sm:text-sm">{t('logout')}</button>
              ) : (
                <Link to="/login" className="bg-[#c41e3a] text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded text-xs sm:text-sm font-medium hover:bg-[#a01830]">{t('login')}</Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Latest News Section */}
      <section className="py-8 sm:py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-10">
            <div className="w-full lg:w-1/4">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gray-100 rounded flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-800">{t('latestNews')}</h2>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-5">{t('newsDescription')}</p>
              <Link to="/announcements" className="inline-block bg-[#c41e3a] text-white text-xs font-medium px-4 py-2 hover:bg-[#a01830] transition-colors">
                {t('moreNews').toUpperCase()}
              </Link>
            </div>

            <div className="w-full lg:w-3/4">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 sm:h-40 bg-gray-200 animate-pulse rounded"></div>
                  ))}
                </div>
              ) : homeData.news.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {homeData.news.slice(0, 3).map((news) => (
                    <Link to={`/news/${news._id || news.id}`} key={news._id || news.id} className="group block">
                      <div className="relative overflow-hidden">
                        <img 
                          src={news.image_url || 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop'} 
                          alt={news.title}
                          className="w-full h-32 sm:h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                          <TranslatedText text={news.title} className="font-semibold text-xs sm:text-sm leading-tight mb-1" as="h3" />
                          <p className="text-[10px] sm:text-xs text-gray-300">
                            {formatDate(news.published_at || news.created_at)} in <span className="text-[#c41e3a] uppercase">{news.category}</span>
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>{t('noData')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Gram Sabha Preview Section */}
      <section className="py-8 sm:py-12 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6 sm:mb-10">
            <span className="inline-flex items-center text-[#c41e3a] text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {t('gramSabha').toUpperCase()}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1e3a5f] mb-2 sm:mb-3">
              {t('upcomingMeetings')}
            </h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto px-4">
              {t('participateInGovernance')}
            </p>
          </div>

          {loading ? (
            <div className="flex gap-5 overflow-hidden px-2 py-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex-shrink-0 w-72 h-52 bg-gray-300 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : homeData.nextMeeting ? (
            <div className="relative">
              <div className="flex gap-5 overflow-x-auto scrollbar-hide px-2 py-4 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {/* Current Next Meeting Card */}
                <div className="flex-shrink-0 w-72 h-52 relative overflow-hidden group cursor-pointer">
                  <img 
                    src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop"
                    alt={homeData.nextMeeting.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
                  <div className="absolute top-4 left-4 bg-[#c41e3a] text-white text-center px-3 py-2">
                    <div className="text-2xl font-bold leading-none">{new Date(homeData.nextMeeting.meeting_date).getDate()}</div>
                    <div className="text-xs uppercase mt-1">{new Date(homeData.nextMeeting.meeting_date).toLocaleDateString('en-IN', { month: 'short' })}</div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <TranslatedText text={homeData.nextMeeting.title} className="text-lg font-bold mb-2 line-clamp-2 leading-tight" as="h3" />
                    <p className="text-xs text-gray-200 flex items-center">
                      <span>10:00 am - 12:00 pm</span>
                      <span className="mx-2">at</span>
                      <span className="uppercase text-[#c41e3a] font-medium">{homeData.nextMeeting.venue || 'PANCHAYAT OFFICE'}</span>
                    </p>
                  </div>
                </div>
                

              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>{t('noData')}</p>
            </div>
          )}

          <div className="text-center mt-8">
            <Link to="/meetings" className="inline-flex items-center bg-[#1e3a5f] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#152d4a] transition-colors">
              {t('viewAll')} {t('meetings')}
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Events Preview Section */}
      <section className="py-12 bg">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <span className="inline-flex items-center text-[#c41e3a] text-sm font-semibold uppercase tracking-wider mb-2">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              EVENTS
            </span>
            <h2 className="text-3xl font-serif font-bold text-[#1e3a5f] mb-3">
              Our Upcoming <span className="text-[#c41e3a]">Events</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Join community events and programs organized by the Panchayat
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white  p-5 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-10 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : homeData.events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {homeData.events.slice(0, 3).map((event, index) => (
                <div key={event._id || event.id || index} className="transition-all duration-300 overflow-hidden group">
                  <div className="p-5">
                    {/* Location */}
                    <div className="flex items-center text-gray-500 text-sm mb-4">
                      <svg className="w-4 h-4 mr-2 text-[#c41e3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{event.venue || 'Village Community Center'}</span>
                    </div>

                    {/* Image */}
                    <div className="relative h-48 rounded-lg overflow-hidden mb-4">
                      <img 
                        src={event.image_url || `https://images.unsplash.com/photo-${index === 0 ? '1517245386807-bb43f82c33c4' : index === 1 ? '1523240795612-9a054b0db644' : '1552664730-d307ca884978'}?w=400&h=300&fit=crop`}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5 text-[#c41e3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(event.event_date)}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5 text-[#c41e3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        10:00AM - 04:00PM
                      </span>
                    </div>

                    {/* Title */}
                    <TranslatedText text={event.title} className="text-xl font-bold text-[#1e3a5f] mb-2 group-hover:text-[#c41e3a] transition-colors" as="h3" />

                    {/* Description */}
                    <TranslatedText text={event.description || 'There are many variations of passages the majority have some injected humour.'} className="text-gray-500 text-sm mb-5 line-clamp-2" as="p" />

                    {/* Join Button */}
                    <Link
                      to={`/events/${event.id}`}
                      className="inline-flex items-center bg-[#c41e3a] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#a01830] transition-colors group/btn"
                    >
                      JOIN EVENT
                      <svg className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>{t('noData')}</p>
            </div>
          )}

          <div className="text-center mt-8">
            <Link to="/events" className="inline-flex items-center bg-[#c41e3a] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#a01830] transition-colors">
              {t('viewAll')} {t('events')}
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Engagement Summary Cards */}
      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* Active Poll */}
            <div className="bg-white p-4 sm:p-6">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#c41e3a] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="ml-2 sm:ml-3 text-base sm:text-lg font-semibold text-gray-800">Your Voice</h3>
              </div>
              {homeData.activePoll ? (
                <>
                  <TranslatedText text={homeData.activePoll.question} className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2" as="p" />
                  <p className="text-gray-500 text-xs mb-2">{homeData.activePoll.total_votes || 0} votes so far</p>
                  <Link to="/polls" className="inline-block bg-[#c41e3a] text-white text-xs font-medium px-3 sm:px-4 py-2 rounded hover:bg-[#a01830] transition-colors">
                    {t('vote')} {t('now')}
                  </Link>
                </>
              ) : (
                <p className="text-gray-500 text-xs sm:text-sm">{t('noData')}</p>
              )}
            </div>

            {/* Government Schemes */}
            <div className="bg-white p-4 sm:p-6">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#c41e3a] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="ml-2 sm:ml-3 text-base sm:text-lg font-semibold text-gray-800">Schemes</h3>
              </div>
              {homeData.schemes.length > 0 ? (
                <ul className="space-y-2">
                  {homeData.schemes.slice(0, 2).map(scheme => (
                    <li key={scheme._id || scheme.id} className="border-b pb-2">
                      <TranslatedText text={scheme.name} className="text-gray-700 text-xs sm:text-sm font-medium line-clamp-1" as="p" />
                      <p className="text-[#c41e3a] text-[10px] sm:text-xs">Deadline: {formatDate(scheme.last_date)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-xs sm:text-sm">{t('noData')}</p>
              )}
              <Link to="/schemes" className="mt-3 sm:mt-4 inline-block text-[#c41e3a] text-xs sm:text-sm font-medium hover:underline">
                {t('viewAll')} {t('schemes')} →
              </Link>
            </div>

            {/* Works */}
            <div className="bg-white p-4 sm:p-6">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#c41e3a] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="ml-2 sm:ml-3 text-base sm:text-lg font-semibold text-gray-800">Works</h3>
              </div>
              {homeData.works.length > 0 ? (
                <ul className="space-y-2">
                  {homeData.works.slice(0, 2).map(work => (
                    <li key={work._id || work.id} className="border-b pb-2">
                      <TranslatedText text={work.title} className="text-gray-700 text-xs sm:text-sm font-medium line-clamp-1" as="p" />
                      <p className="text-[#c41e3a] text-[10px] sm:text-xs">{work.progress_percentage || 0}% Complete</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-xs sm:text-sm">{t('noData')}</p>
              )}
              <Link to="/works" className="mt-3 sm:mt-4 inline-block text-[#c41e3a] text-xs sm:text-sm font-medium hover:underline">
                {t('viewAll')} {t('works')} →
              </Link>
            </div>

            {/* Suggestions */}
            <div className="bg-white p-4 sm:p-6">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#c41e3a] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="ml-2 sm:ml-3 text-base sm:text-lg font-semibold text-gray-800">Ideas</h3>
              </div>
              {homeData.suggestions.length > 0 ? (
                <ul className="space-y-2">
                  {homeData.suggestions.slice(0, 2).map(sug => (
                    <li key={sug._id || sug.id} className="border-b pb-2">
                      <TranslatedText text={sug.title} className="text-gray-700 text-xs sm:text-sm font-medium line-clamp-1" as="p" />
                      <p className="text-[#c41e3a] text-[10px] sm:text-xs">{sug.upvotes || 0} upvotes</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-xs sm:text-sm">{t('noData')}</p>
              )}
              <Link to="/suggestions" className="mt-3 sm:mt-4 inline-block text-[#c41e3a] text-xs sm:text-sm font-medium hover:underline">
                {t('viewAll')} {t('suggestions')} →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Panchayat Works Progress Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-serif font-bold text-gray-800">{t('publicWorks')}</h2>
            <p className="text-gray-500 mt-2">{t('exploreSchemes')}</p>
          </div>
          
          {homeData.works.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {homeData.works.map((work, index) => (
                <div key={work._id || work.id} className="overflow-hidden">
                  {/* Work Image */}
                  <img 
                    src={work.image_url || `https://images.unsplash.com/photo-${index === 0 ? '1504307651254-35680f356dfd' : index === 1 ? '1590674899484-d5640e854abe' : '1621905252507-b35492cc74b4'}?w=400&h=200&fit=crop`} 
                    alt={work.title}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-1 rounded text-xs text-white ${getWorkStatusColor(work.status)}`}>
                        {work.status?.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">{work.work_type}</span>
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-2"><TranslatedText text={work.title} /></h4>
                    <p className="text-gray-500 text-sm mb-3">{work.location}</p>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-[#c41e3a] h-3 rounded-full transition-all duration-500" 
                        style={{ width: `${work.progress_percentage || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-right text-sm text-gray-600 mt-1">{work.progress_percentage || 0}% Complete</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>{t('noData')}</p>
            </div>
          )}
          
          <div className="text-center mt-8">
            <Link to="/works" className="inline-block bg-[#1e3a5f] text-white px-6 py-3 rounded-lg hover:bg-[#152d4a] transition-colors">
              {t('viewAll')} {t('works')}
            </Link>
          </div>
        </div>
      </section>

      {/* Public Suggestions Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-serif font-bold text-gray-800">{t('suggestions')}</h2>
              <p className="text-gray-500 mt-1">{t('shareOpinion')}</p>
            </div>
            {isLoggedIn && (
              <Link to="/suggestions" className="bg-[#c41e3a] text-white px-4 py-2 rounded hover:bg-[#a01830] transition-colors">
                + {t('suggestions')}
              </Link>
            )}
          </div>
          
          {homeData.suggestions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {homeData.suggestions.map((suggestion, index) => (
                <div key={suggestion._id || suggestion.id} className="bg-white overflow-hidden">
                  {/* Suggestion Image */}
                  <img 
                    src={suggestion.image_url || `https://images.unsplash.com/photo-${index === 0 ? '1552664730-d307ca884978' : index === 1 ? '1517245386807-bb43f82c33c4' : '1523240795612-9a054b0db644'}?w=400&h=200&fit=crop`} 
                    alt={suggestion.title}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-1 bg-[#c41e3a]/10 text-[#c41e3a] rounded text-xs font-medium">
                        {suggestion.category}
                      </span>
                      <span className="flex items-center text-[#c41e3a] text-sm">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                        </svg>
                        {suggestion.upvotes || 0}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-2"><TranslatedText text={suggestion.title} /></h4>
                    <p className="text-gray-500 text-sm">by {suggestion.user_name || 'Anonymous'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>{t('noData')}</p>
            </div>
          )}
          
          <div className="text-center mt-8">
            <Link to="/suggestions" className="inline-block border border-[#c41e3a] text-[#c41e3a] px-6 py-3 rounded-lg hover:bg-[#c41e3a] hover:text-white transition-colors">
              {t('viewAll')} {t('suggestions')}
            </Link>
          </div>
        </div>
      </section>

    

      {/* Quick Links Section */}
    
      

      {/* CTA Section */}
      <section className="py-10 bg-gray-50 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{t('panchayatName')}</h3>
              <p className="text-gray-500 text-sm">{t('address')}</p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
              <Link to="/public-complaints" className="bg-white border border-[#1e3a5f] text-[#1e3a5f] px-5 py-2 text-sm font-medium hover:bg-[#1e3a5f] hover:text-white transition-colors">
                VIEW PUBLIC COMPLAINTS
              </Link>
              {isLoggedIn ? (
                <>
                  <Link to="/my-complaints" className="bg-white border border-gray-300 text-gray-600 px-5 py-2 text-sm font-medium hover:bg-gray-50 transition-colors">
                    {t('myComplaints').toUpperCase()}
                  </Link>
                  <Link to="/new-complaint" className="bg-[#c41e3a] text-white px-5 py-2 text-sm font-medium hover:bg-[#a01830] transition-colors">
                    {t('fileComplaint').toUpperCase()}
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="bg-white border border-gray-300 text-gray-600 px-5 py-2 text-sm font-medium hover:bg-gray-50 transition-colors">
                    {t('login').toUpperCase()}
                  </Link>
                  <Link to="/register" className="bg-[#c41e3a] text-white px-5 py-2 text-sm font-medium hover:bg-[#a01830] transition-colors">
                    {t('register').toUpperCase()}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
      {/* Stats Section */}
      <section className="py-8 sm:py-10 bg-[#1e3a5f]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center text-white">
            <div className="p-2 sm:p-4">
              <div className="text-2xl sm:text-3xl font-bold">14,022</div>
              <div className="text-xs sm:text-sm text-gray-300 mt-1">Population</div>
            </div>
            <div className="p-2 sm:p-4">
              <div className="text-2xl sm:text-3xl font-bold">4,023</div>
              <div className="text-xs sm:text-sm text-gray-300 mt-1">Households</div>
            </div>
            <div className="p-2 sm:p-4">
              <div className="text-2xl sm:text-3xl font-bold">69%</div>
              <div className="text-xs sm:text-sm text-gray-300 mt-1">Literacy Rate</div>
            </div>
            <div className="p-2 sm:p-4">
              <div className="text-2xl sm:text-3xl font-bold">2287</div>
              <div className="text-xs sm:text-sm text-gray-300 mt-1">Hectares</div>
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-[#1e3a5f] text-white py-6 sm:py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center sm:text-left">
              <img src="/namsev-logo.png" alt="NamSev" className="h-14 sm:h-16 md:h-20 mb-4 brightness-0 invert mx-auto sm:mx-0" />
              <p className="text-gray-300 text-xs sm:text-sm">Ganapathipalayam Panchayat serves the citizens with dedication and transparency.</p>
            </div>
            <div className="text-center sm:text-left">
              <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Quick Links</h4>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-300">
                <li><Link to="/meetings" className="hover:text-white">Gram Sabha</Link></li>
                <li><Link to="/schemes" className="hover:text-white">Government Schemes</Link></li>
                <li><Link to="/works" className="hover:text-white">Development Works</Link></li>
                <li><Link to="/faqs" className="hover:text-white">FAQs</Link></li>
              </ul>
            </div>
            <div className="text-center sm:text-left">
              <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Engage</h4>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-300">
                <li><Link to="/polls" className="hover:text-white">Vote in Polls</Link></li>
                <li><Link to="/suggestions" className="hover:text-white">Share Ideas</Link></li>
                <li><Link to="/events" className="hover:text-white">Upcoming Events</Link></li>
                <li><Link to="/budget" className="hover:text-white">Budget Overview</Link></li>
              </ul>
            </div>
            <div className="text-center sm:text-left">
              <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Contact</h4>
              <p className="text-gray-300 text-xs sm:text-sm">Moogambigai Nagar, Ganapathipalayam</p>
              <p className="text-gray-300 text-xs sm:text-sm">Palladam, Tiruppur - 641605</p>
              <p className="text-gray-300 text-xs sm:text-sm mt-2">Phone: +91-XXX-XXXXXXX</p>
            </div>
          </div>
          <div className="border-t border-gray-600 mt-6 sm:mt-8 pt-4 sm:pt-6 text-center text-gray-400 text-xs sm:text-sm">
            © 2025 Ganapathipalayam Panchayat. All rights reserved.
          </div>
        </div>
      </footer>

      {/* CSS for marquee animation and scrollbar hide */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default HomePage;

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import CitizenNav from '../../components/CitizenNav';
import TranslatedText from '../../components/TranslatedText';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SchemeDetailPage = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [scheme, setScheme] = useState(null);
  const [relatedSchemes, setRelatedSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchemeDetails();
    fetchRelatedSchemes();
  }, [id]);

  const fetchSchemeDetails = async () => {
    try {
      const response = await api.get(`/engagement/schemes`);
      if (response.data.success) {
        const schemes = response.data.data || [];
        const foundScheme = schemes.find(s => s._id === id || s.id === parseInt(id));
        setScheme(foundScheme);
      }
    } catch (error) {
      console.error('Error fetching scheme:', error);
      toast.error('Failed to load scheme details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedSchemes = async () => {
    try {
      const response = await api.get('/engagement/schemes');
      if (response.data.success) {
        const schemes = response.data.data || [];
        setRelatedSchemes(schemes.filter(s => (s._id || s.id) !== id).slice(0, 4));
      }
    } catch (error) {
      console.error('Error fetching related schemes:', error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No deadline';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      central: 'bg-gray-100 text-gray-800',
      state: 'bg-gray-200 text-gray-700',
      local: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // Category-specific default images for schemes
  const getCategoryImage = (category) => {
    const categoryImages = {
      agriculture: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=500&fit=crop',
      housing: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop',
      education: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=500&fit=crop',
      health: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=500&fit=crop',
      welfare: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&h=500&fit=crop',
      employment: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=500&fit=crop',
      central: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&h=500&fit=crop',
      state: 'https://images.unsplash.com/photo-1577495508326-19a1b3cf65b7?w=800&h=500&fit=crop',
      local: 'https://images.unsplash.com/photo-1560439514-4e9645039924?w=800&h=500&fit=crop'
    };
    return categoryImages[category] || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&h=500&fit=crop';
  };

  const handleBookmark = async () => {
    if (!currentUser) {
      toast.error('Please login to bookmark schemes');
      return;
    }
    try {
      await api.post(`/engagement/schemes/${id}/bookmark`);
      toast.success('Scheme bookmarked!');
    } catch (error) {
      toast.error('Failed to bookmark');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CitizenNav />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-80 bg-gray-200 rounded mb-6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!scheme) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CitizenNav />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Scheme Not Found</h1>
          <Link to="/schemes" className="text-[#c41e3a] hover:underline">← Back to Schemes</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <CitizenNav />
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Breadcrumb */}
        <nav className="text-xs sm:text-sm mb-4 sm:mb-6">
          <Link to="/" className="text-gray-500 hover:text-[#c41e3a]">HOME</Link>
          <span className="text-gray-400 mx-1.5 sm:mx-2">›</span>
          <Link to="/schemes" className="text-gray-500 hover:text-[#c41e3a]">SCHEMES</Link>
          <span className="text-gray-400 mx-1.5 sm:mx-2">›</span>
          <span className="text-gray-700">{scheme.category?.toUpperCase()}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:w-2/3">
            {/* Category Badge */}
            <span className={`inline-block px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4 ${getCategoryColor(scheme.category)}`}>
              {scheme.category?.toUpperCase()} SCHEME
            </span>

            {/* Title */}
            <TranslatedText text={scheme.name} className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-3 sm:mb-4" as="h1" />

            {/* Scheme Image */}
            <div className="overflow-hidden mb-6 sm:mb-8">
              <img 
                src={scheme.image_url || getCategoryImage(scheme.category)} 
                alt={scheme.name}
                className="w-full h-52 sm:h-64 md:h-80 lg:h-96 object-cover"
              />
            </div>

            {/* Key Information Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="bg-gray-50 p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500">Last Date</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{formatDate(scheme.last_date)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500">Status</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{scheme.is_active ? 'Active' : 'Closed'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500">Category</p>
                    <p className="font-semibold text-gray-900 capitalize text-sm sm:text-base">{scheme.category}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <span className="w-1 h-5 sm:h-6 bg-[#c41e3a] mr-2 sm:mr-3"></span>
                About This Scheme
              </h2>
              <TranslatedText text={scheme.description || 'No description available for this scheme.'} className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line" as="p" />
            </div>

            {/* Benefits */}
            {scheme.benefits && (
              <div className="mb-6 sm:mb-8 bg-gray-50 p-4 sm:p-6 border-l-4 border-[#c41e3a]">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#c41e3a] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Benefits
                </h2>
                <TranslatedText text={scheme.benefits} className="text-sm sm:text-base text-gray-700 whitespace-pre-line" as="p" />
              </div>
            )}

            {/* Eligibility */}
            {scheme.eligibility && (
              <div className="mb-6 sm:mb-8 bg-gray-50 p-4 sm:p-6 border-l-4 border-gray-400">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Eligibility Criteria
                </h2>
                <TranslatedText text={scheme.eligibility} className="text-sm sm:text-base text-gray-700 whitespace-pre-line" as="p" />
              </div>
            )}

            {/* Required Documents */}
            {scheme.required_documents && (
              <div className="mb-6 sm:mb-8 bg-gray-50 p-4 sm:p-6 border-l-4 border-gray-300">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Required Documents
                </h2>
                <TranslatedText text={scheme.required_documents} className="text-sm sm:text-base text-gray-700 whitespace-pre-line" as="p" />
              </div>
            )}

            {/* Apply Button */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-8">
              {scheme.application_link && (
                <a 
                  href={scheme.application_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#c41e3a] text-white px-5 sm:px-8 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-[#a01830] transition-colors flex items-center justify-center text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Apply Now
                </a>
              )}
              <button 
                onClick={handleBookmark}
                className="border border-[#1e3a5f] text-[#1e3a5f] px-5 sm:px-8 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-[#1e3a5f] hover:text-white transition-colors flex items-center justify-center text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Bookmark
              </button>
            </div>

            {/* Back Link */}
            <Link 
              to="/schemes" 
              className="inline-flex items-center text-[#c41e3a] hover:text-[#a01830] font-medium text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to All Schemes
            </Link>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3">
            {/* Quick Info Card */}
            <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2c5282] text-white rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Info</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm sm:text-base">Open for Applications</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm sm:text-base">Deadline: {formatDate(scheme.last_date)}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                  </svg>
                  <span className="capitalize text-sm sm:text-base">{scheme.category} Government</span>
                </div>
              </div>
            </div>

            {/* Related Schemes */}
            <div className="bg-white p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Related Schemes</h3>
              <div className="space-y-3 sm:space-y-4">
                {relatedSchemes.map(item => (
                  <Link key={item.id} to={`/schemes/${item.id}`} className="block group">
                    <div className="flex gap-2 sm:gap-3">
                      <img 
                        src={item.image_url || getCategoryImage(item.category)} 
                        alt={item.name} 
                        className="w-16 h-12 sm:w-20 sm:h-16 object-cover flex-shrink-0" 
                      />
                      <div>
                        <h4 className="font-medium text-gray-800 group-hover:text-[#c41e3a] text-xs sm:text-sm line-clamp-2">{item.name}</h4>
                        <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${getCategoryColor(item.category)}`}>
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link 
                to="/schemes" 
                className="mt-3 sm:mt-4 inline-block text-xs sm:text-sm text-[#c41e3a] border border-[#c41e3a] px-3 sm:px-4 py-1.5 sm:py-2 rounded hover:bg-[#c41e3a] hover:text-white transition-colors"
              >
                VIEW ALL SCHEMES
              </Link>
            </div>

            {/* Help Section */}
            <div className="mt-4 sm:mt-6 bg-gray-50 border rounded-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Need Help?</h3>
              <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">
                Contact the Panchayat office for assistance with your application.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#c41e3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>+91-XXX-XXXXXXX</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#c41e3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>help@ganapathipalayam.gov.in</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchemeDetailPage;

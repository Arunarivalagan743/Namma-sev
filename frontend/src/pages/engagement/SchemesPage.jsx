import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import CitizenNav from '../../components/CitizenNav';
import TranslatedText from '../../components/TranslatedText';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiArrowRight, FiMapPin, FiClock, FiCalendar } from 'react-icons/fi';

const SchemesPage = () => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const categories = ['all', 'agriculture', 'housing', 'education', 'health', 'welfare', 'employment', 'other'];

  // Auto-refresh every 60 seconds for scheme updates
  useEffect(() => {
    fetchSchemes();
    const interval = setInterval(() => {
      fetchSchemes(true); // silent refresh
    }, 60000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchSchemes = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let url = '/engagement/schemes';
      if (filter !== 'all') {
        url += `?category=${filter}`;
      }
      const response = await api.get(url);
      if (response.data.success) {
        setSchemes(response.data.schemes);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching schemes:', error);
      if (!silent) toast.error('Failed to load schemes');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No deadline';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDefaultImage = (category, index) => {
    // Category-specific images for government schemes
    const categoryImages = {
      agriculture: [
        'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=300&h=200&fit=crop', // Farmer in field
        'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=300&h=200&fit=crop', // Rice paddy
        'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=300&h=200&fit=crop'  // Farming
      ],
      housing: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop', // Rural house
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300&h=200&fit=crop', // Modern house
        'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=300&h=200&fit=crop'  // House construction
      ],
      education: [
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&h=200&fit=crop', // Students studying
        'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=300&h=200&fit=crop', // Classroom
        'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=300&h=200&fit=crop'  // School children
      ],
      health: [
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=300&h=200&fit=crop', // Doctor
        'https://images.unsplash.com/photo-1551076805-e1869033e561?w=300&h=200&fit=crop', // Medical care
        'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=300&h=200&fit=crop'  // Healthcare
      ],
      welfare: [
        'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=300&h=200&fit=crop', // Helping hands
        'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=300&h=200&fit=crop', // Community help
        'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=300&h=200&fit=crop'  // Social welfare
      ],
      employment: [
        'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=300&h=200&fit=crop', // Workers
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&h=200&fit=crop', // Construction work
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&h=200&fit=crop'  // Skill training
      ],
      other: [
        'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=300&h=200&fit=crop', // Government building
        'https://images.unsplash.com/photo-1577495508326-19a1b3cf65b7?w=300&h=200&fit=crop', // Official documents
        'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=300&h=200&fit=crop'  // Office work
      ]
    };
    const images = categoryImages[category] || categoryImages.other;
    return images[index % images.length];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenNav />
      
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <span className="inline-flex items-center text-[#1e3a5f] text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2">
            <FiCalendar className="mr-1.5 sm:mr-2" size={14} />
            {t('schemes').toUpperCase()}
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#1e3a5f] mb-2 sm:mb-3">
            {t('governmentSchemes')}
          </h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto px-2">
            {t('exploreSchemes')}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-6 sm:mb-8 md:mb-10 px-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all capitalize ${
                filter === cat 
                  ? 'bg-[#1e3a5f] text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Schemes List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-lg p-3 sm:p-4 animate-pulse flex gap-3 sm:gap-4">
                <div className="w-24 sm:w-32 h-20 sm:h-24 bg-gray-200 rounded-lg flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="h-4 sm:h-5 bg-gray-200 rounded w-3/4 mb-2 sm:mb-3"></div>
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : schemes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {schemes.map((scheme, index) => (
              <div 
                key={scheme.id} 
                className="bg-white rounded-lg p-3 sm:p-4 transition-all duration-300 group"
              >
                <div className="flex gap-3 sm:gap-4">
                  {/* Image */}
                  <div className="w-24 sm:w-32 h-20 sm:h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={scheme.image_url || getDefaultImage(scheme.category, index)}
                      alt={scheme.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <TranslatedText text={scheme.name} className="text-base sm:text-lg font-bold text-[#1e3a5f] mb-1.5 sm:mb-2 line-clamp-1 group-hover:text-[#c41e3a] transition-colors" as="h3" />

                    {/* Details Row */}
                    <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                      <span className="flex items-center">
                        <FiMapPin className="mr-1 text-gray-400" size={12} />
                        {scheme.category || 'Government Scheme'}
                      </span>
                      <span className="flex items-center">
                        <FiClock className="mr-1 text-gray-400" size={12} />
                        {scheme.last_date ? `Ends ${formatDate(scheme.last_date)}` : 'Open'}
                      </span>
                      {scheme.benefit_amount && (
                        <span className="text-[#c41e3a] font-semibold">
                          ₹{scheme.benefit_amount}
                        </span>
                      )}
                    </div>

                    {/* Read Details Link */}
                    <Link
                      to={`/schemes/${scheme.id}`}
                      className="inline-flex items-center text-[#c41e3a] hover:text-[#a01830] font-medium text-xs sm:text-sm group/link"
                    >
                      Read Details
                      <FiArrowRight className="ml-1 w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 bg-white">
            <svg className="w-12 sm:w-16 h-12 sm:h-16 mx-auto text-gray-300 mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-base sm:text-lg font-medium text-gray-600 mb-1.5 sm:mb-2">No Schemes Found</h3>
            <p className="text-sm text-gray-500">Check back later for new schemes</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchemesPage;

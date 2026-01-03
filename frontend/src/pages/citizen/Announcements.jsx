import { useState, useEffect, useRef } from 'react';
import { announcementService } from '../../services/announcement.service';
import { FiBell, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import CitizenNav from '../../components/CitizenNav';
import TranslatedText from '../../components/TranslatedText';
import { useTranslation } from '../../context/TranslationContext';

const Announcements = () => {
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const scrollContainerRef = useRef(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchAnnouncements();
  }, [pagination.page, filter]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await announcementService.getAll({
        page: pagination.page,
        limit: pagination.limit
      });
      setAnnouncements(response.announcements || []);
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 0
      }));
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const getDateParts = (date) => {
    const d = new Date(date);
    return {
      day: d.getDate(),
      month: d.toLocaleDateString('en-IN', { month: 'short' })
    };
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDefaultImage = (priority, index) => {
    // Priority-based announcement images
    const priorityImages = {
      urgent: [
        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&h=400&fit=crop', // Breaking news
        'https://images.unsplash.com/photo-1586339949216-35c2747cc36d?w=600&h=400&fit=crop', // Alert
        'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=600&h=400&fit=crop'  // Urgent news
      ],
      high: [
        'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600&h=400&fit=crop', // Government announcement
        'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?w=600&h=400&fit=crop', // Important notice
        'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&h=400&fit=crop'  // Official meeting
      ],
      normal: [
        'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=600&h=400&fit=crop', // Community news
        'https://images.unsplash.com/photo-1560439514-4e9645039924?w=600&h=400&fit=crop', // Village update
        'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=600&h=400&fit=crop'  // Community activity
      ],
      low: [
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop', // General info
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop', // Notice board
        'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&h=400&fit=crop'  // Information
      ]
    };
    const images = priorityImages[priority] || priorityImages.normal;
    return images[index % images.length];
  };

  const priorities = ['all', 'urgent', 'high', 'normal', 'low'];

  const filteredAnnouncements = filter === 'all' 
    ? announcements 
    : announcements.filter(a => a.priority === filter);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <CitizenNav />
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <span className="inline-flex items-center text-[#c41e3a] text-xs sm:text-sm font-semibold uppercase tracking-wider mb-1.5 sm:mb-2">
            <FiBell className="mr-1.5 sm:mr-2" />
            {t('announcements')}
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#1e3a5f] mb-2 sm:mb-3">
            {t('announcements')}
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm sm:text-base px-4">
            {t('stayUpdatedAnnouncements')} {t('panchayatName')}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-5 sm:mb-8 px-2">
          {priorities.map(priority => (
            <button
              key={priority}
              onClick={() => setFilter(priority)}
              className={`px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all ${
                filter === priority 
                  ? 'bg-[#c41e3a] text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </button>
          ))}
        </div>

        {/* Announcements Horizontal Scroll */}
        {loading ? (
          <div className="relative">
            <div className="flex gap-3 sm:gap-5 overflow-hidden px-2 py-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex-shrink-0 w-56 sm:w-72 h-44 sm:h-52 bg-gray-300 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        ) : filteredAnnouncements.length > 0 ? (
          <div className="relative">
            {/* Navigation Arrows - hidden on mobile */}
            <button 
              onClick={() => scroll('left')}
              className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 sm:w-10 h-8 sm:h-10 bg-white items-center justify-center hover:bg-gray-50 transition-colors shadow-md"
            >
              <FiChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 sm:w-10 h-8 sm:h-10 bg-white items-center justify-center hover:bg-gray-50 transition-colors shadow-md"
            >
              <FiChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>

            {/* Cards Container */}
            <div 
              ref={scrollContainerRef}
              className="flex gap-3 sm:gap-5 overflow-x-auto scrollbar-hide px-1 sm:px-8 py-4 scroll-smooth snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {filteredAnnouncements.map((announcement, index) => {
                const dateParts = getDateParts(announcement.created_at);
                return (
                  <div 
                    key={announcement.id} 
                    className="flex-shrink-0 w-64 sm:w-72 h-44 sm:h-52 relative overflow-hidden group cursor-pointer snap-start"
                  >
                    {/* Background Image */}
                    <img 
                      src={announcement.image_url || getDefaultImage(announcement.priority, index)}
                      alt={announcement.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    
                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
                    
                    {/* Date Badge */}
                    <div className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-[#c41e3a] text-white text-center px-2 sm:px-3 py-1.5 sm:py-2">
                      <div className="text-xl sm:text-2xl font-bold leading-none">{dateParts.day}</div>
                      <div className="text-[10px] sm:text-xs uppercase mt-0.5 sm:mt-1">{dateParts.month}</div>
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white">
                      <TranslatedText text={announcement.title} className="text-base sm:text-lg font-bold mb-1.5 sm:mb-2 line-clamp-2 leading-tight" as="h3" />
                      <p className="text-[10px] sm:text-xs text-gray-200 flex items-center flex-wrap">
                        <span>{formatTime(announcement.created_at)}</span>
                        <span className="mx-1 sm:mx-2">at</span>
                        <span className="uppercase text-[#c41e3a] font-medium text-[10px] sm:text-xs">PANCHAYAT OFFICE</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 sm:p-12 text-center">
            <FiBell size={48} className="mx-auto mb-3 sm:mb-4 text-gray-300" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-1.5 sm:mb-2">No announcements yet</h3>
            <p className="text-gray-500 text-sm sm:text-base">Check back later for updates from the Panchayat</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center mt-6 sm:mt-10 gap-1.5 sm:gap-2 px-4">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              Previous
            </button>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-medium text-xs sm:text-sm ${
                    pagination.page === i + 1
                      ? 'bg-[#c41e3a] text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Hide scrollbar CSS */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Announcements;

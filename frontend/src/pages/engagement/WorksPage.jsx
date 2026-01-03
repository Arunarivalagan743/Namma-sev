import { useState, useEffect } from 'react';
import { useTranslation } from '../../context/TranslationContext';
import CitizenNav from '../../components/CitizenNav';
import TranslatedText from '../../components/TranslatedText';
import api from '../../services/api';
import toast from 'react-hot-toast';

const WorksPage = () => {
  const { t } = useTranslation();
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const workTypes = ['all', 'road', 'water', 'sanitation', 'electricity', 'building', 'park', 'other'];
  const statusFilters = ['all', 'planned', 'in_progress', 'completed'];

  // Auto-refresh every 60 seconds for works progress updates
  useEffect(() => {
    fetchWorks();
    const interval = setInterval(() => {
      fetchWorks(true); // silent refresh
    }, 60000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchWorks = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let url = '/engagement/works';
      if (filter !== 'all' && statusFilters.includes(filter)) {
        url += `?status=${filter}`;
      } else if (filter !== 'all') {
        url += `?work_type=${filter}`;
      }
      const response = await api.get(url);
      if (response.data.success) {
        setWorks(response.data.works);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching works:', error);
      if (!silent) toast.error('Failed to load works');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    const num = Number(amount);
    if (!num || isNaN(num)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const getStatusColor = (status) => {
    const colors = {
      planned: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-[#c41e3a]/10 text-[#c41e3a]',
      completed: 'bg-gray-100 text-gray-800',
      delayed: 'bg-[#c41e3a]/20 text-[#c41e3a]'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 75) return 'bg-[#c41e3a]';
    if (percentage >= 50) return 'bg-gray-600';
    if (percentage >= 25) return 'bg-gray-500';
    return 'bg-gray-400';
  };

  // Work type-specific images
  const getWorkTypeImage = (workType) => {
    const workImages = {
      road: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400&h=300&fit=crop', // Road construction
      water: 'https://images.unsplash.com/photo-1594398901394-4e34939a4fd0?w=400&h=300&fit=crop', // Water pipeline
      sanitation: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', // Sanitation work
      electricity: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=300&fit=crop', // Electric poles
      building: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop', // Building construction
      park: 'https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?w=400&h=300&fit=crop', // Park/garden
      other: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop'  // General construction
    };
    return workImages[workType] || workImages.other;
  };

  const getWorkIcon = (type) => {
    const icons = {
      road: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      water: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      sanitation: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      electricity: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      building: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      park: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )
    };
    return icons[type] || icons.building;
  };

  // Calculate total budget safely
  const totalBudget = works.reduce((sum, w) => {
    const budget = Number(w.budget_amount);
    return sum + (isNaN(budget) ? 0 : budget);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenNav />
      
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1e3a5f] mb-1.5 sm:mb-2">{t('publicWorks')}</h1>
          <p className="text-sm sm:text-base text-gray-600">{t('participateInGovernance')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <div className="bg-white p-3 sm:p-4 md:p-6">
            <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">{t('planned')}</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{works.filter(w => w.status === 'planned').length}</p>
            <p className="text-xs sm:text-sm mt-1 sm:mt-2">
              <span className="text-gray-500">↔ 0%</span>
            </p>
          </div>
          <div className="bg-white p-3 sm:p-4 md:p-6">
            <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">{t('inProgress')}</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{works.filter(w => w.status === 'in_progress').length}</p>
            <p className="text-xs sm:text-sm mt-1 sm:mt-2">
              <span className="text-[#c41e3a]">↑ Active</span>
            </p>
          </div>
          <div className="bg-white p-3 sm:p-4 md:p-6">
            <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">{t('completed')}</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{works.filter(w => w.status === 'completed').length}</p>
            <p className="text-xs sm:text-sm mt-1 sm:mt-2">
              <span className="text-green-600">↑ Done</span>
            </p>
          </div>
          <div className="bg-white p-3 sm:p-4 md:p-6">
            <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">Total Budget</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{formatCurrency(totalBudget)}</p>
            <p className="text-xs sm:text-sm mt-1 sm:mt-2">
              <span className="text-[#c41e3a]">₹</span>
              <span className="text-gray-500 ml-1">Allocated</span>
            </p>
          </div>
        </div>

        {/* Filter Tabs - Pill Style like reference */}
        <div className="flex justify-center mb-6 sm:mb-8 overflow-x-auto pb-2">
          <div className="inline-flex bg-gray-100 rounded-full p-0.5 sm:p-1">
            {statusFilters.map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 capitalize whitespace-nowrap ${
                  filter === status 
                    ? 'bg-[#c41e3a] text-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {status === 'all' ? 'All Works' : status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Work Type Filter */}
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-6 sm:mb-8">
          {workTypes.filter(t => t !== 'all').map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-200 capitalize ${
                filter === type 
                  ? 'bg-[#1e3a5f] text-white' 
                  : 'bg-white text-gray-600 hover:text-[#1e3a5f]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Works Grid - Card Layout like reference */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white overflow-hidden animate-pulse">
                <div className="h-36 sm:h-48 bg-gray-200"></div>
                <div className="p-3 sm:p-4">
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2 sm:mb-3"></div>
                  <div className="h-2.5 sm:h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-2 bg-gray-200 rounded-full w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : works.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {works.map(work => (
              <div key={work.id} className="bg-white overflow-hidden group">
                {/* Card Image */}
                <div className="relative h-36 sm:h-48 overflow-hidden">
                  <img 
                    src={work.image_url || getWorkTypeImage(work.work_type)} 
                    alt={work.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Maroon Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#c41e3a]/40 via-transparent to-transparent"></div>
                  {/* Status Badge */}
                  <span className={`absolute top-2 sm:top-3 right-2 sm:right-3 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${getStatusColor(work.status)}`}>
                    {work.status?.replace('_', ' ').toUpperCase()}
                  </span>
                  {/* Work Type Badge */}
                  <span className="absolute top-2 sm:top-3 left-2 sm:left-3 px-2 sm:px-3 py-0.5 sm:py-1 bg-white/90 text-[#1e3a5f] rounded-full text-[10px] sm:text-xs font-medium capitalize">
                    {work.work_type}
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-3 sm:p-4">
                  {/* Contractor Info */}
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#1e3a5f] rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold mr-1.5 sm:mr-2">
                        {work.contractor ? work.contractor.charAt(0).toUpperCase() : 'NA'}
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-800 line-clamp-1">{work.contractor || 'Not Assigned'}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500">Contractor</p>
                      </div>
                    </div>
                    <span className="text-sm sm:text-lg font-bold text-[#c41e3a]">{formatCurrency(work.budget_amount)}</span>
                  </div>

                  {/* Title */}
                  <TranslatedText text={work.title} className="text-base sm:text-lg font-semibold text-[#1e3a5f] mb-1.5 sm:mb-2 line-clamp-2" as="h3" />

                  {/* Description */}
                  {work.description && (
                    <TranslatedText text={work.description} className="text-gray-500 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2" as="p" />
                  )}

                  {/* Progress Bar */}
                  <div className="mb-2 sm:mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] sm:text-xs text-gray-500">Progress</span>
                      <span className="text-xs sm:text-sm font-bold text-[#1e3a5f]">{work.progress_percentage || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                      <div 
                        className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 ${getProgressColor(work.progress_percentage || 0)}`}
                        style={{ width: `${work.progress_percentage || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-100 text-[10px] sm:text-xs text-gray-500">
                    <div className="flex items-center">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1 text-[#c41e3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(work.start_date)}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1 text-[#c41e3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {work.location || 'Village'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 sm:py-16 bg-white rounded-xl">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-1.5 sm:mb-2">No Works Found</h3>
            <p className="text-sm text-gray-500">Check back later for development updates</p>
          </div>
        )}

        {/* Last Updated */}
        <div className="text-center mt-6 sm:mt-8 text-xs sm:text-sm text-gray-400">
          Last updated: {lastUpdated.toLocaleTimeString('en-IN')}
        </div>
      </div>
    </div>
  );
};

export default WorksPage;

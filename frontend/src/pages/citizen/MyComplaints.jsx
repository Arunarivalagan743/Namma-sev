import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { complaintService } from '../../services/complaint.service';
import { 
  FiFileText, FiFilter, FiSearch, FiClock, FiMapPin, FiPlus,
  FiChevronRight, FiAlertCircle, FiCheckCircle, FiLoader, FiXCircle,
  FiImage, FiStar, FiTruck, FiDroplet, FiZap, FiTrash2, FiSun,
  FiActivity, FiHeart, FiHome, FiVolume2, FiClipboard, FiMessageSquare
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import CitizenNav from '../../components/CitizenNav';
import TranslatedText from '../../components/TranslatedText';
import { useTranslation } from '../../context/TranslationContext';

const MyComplaints = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const statusConfig = complaintService.getStatusConfig();

  // Category icon mapping using Feather icons
  const getCategoryIcon = (category) => {
    const icons = {
      'Road & Infrastructure': <FiTruck size={20} />,
      'Water Supply': <FiDroplet size={20} />,
      'Electricity': <FiZap size={20} />,
      'Sanitation': <FiTrash2 size={20} />,
      'Street Lights': <FiSun size={20} />,
      'Drainage': <FiActivity size={20} />,
      'Public Health': <FiHeart size={20} />,
      'Encroachment': <FiHome size={20} />,
      'Noise Pollution': <FiVolume2 size={20} />,
      'Other': <FiClipboard size={20} />
    };
    return icons[category] || <FiFileText size={20} />;
  };

  useEffect(() => {
    fetchComplaints();
  }, [filter, pagination.page]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      if (filter) params.status = filter;

      const response = await complaintService.getMyComplaints(params);
      setComplaints(response.complaints || []);
      setStats(response.stats || null);
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 0
      }));
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FiAlertCircle className="text-yellow-500" size={18} />;
      case 'in_progress': return <FiLoader className="text-blue-500" size={18} />;
      case 'resolved': return <FiCheckCircle className="text-green-500" size={18} />;
      case 'rejected': return <FiXCircle className="text-red-500" size={18} />;
      default: return <FiClock className="text-gray-400" size={18} />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-gov-red/10 text-gov-red border-gov-red/30';
      case 'high': return 'bg-gov-red/10 text-gov-red border-gov-red/30';
      case 'normal': return 'bg-gov-blue/10 text-gov-blue border-gov-blue/30';
      case 'low': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const filteredComplaints = complaints.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.tracking_id?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenNav />
      
      {/* Header with Background Image */}
      <div 
        className="relative h-32 sm:h-40 md:h-48 overflow-hidden"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(30, 58, 95, 0.9), rgba(196, 30, 58, 0.8)), url(https://images.unsplash.com/photo-1586339949216-35c2747cc36d?w=1600&h=400&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-white">{t('myComplaints')}</h1>
            <p className="text-white/80 mt-1.5 sm:mt-2 text-sm sm:text-base">{t('panchayatName')}</p>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="space-y-4 sm:space-y-6">

          {/* Stats Summary */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md transition-shadow hover:border-gov-blue/30">
                <div className="w-10 h-10 rounded-full bg-gov-blue/10 flex items-center justify-center mx-auto mb-2">
                  <FiClock className="text-gov-blue" size={20} />
                </div>
                <p className="text-2xl font-bold text-gov-blue">{stats.pending || 0}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md transition-shadow hover:border-gov-blue/30">
                <div className="w-10 h-10 rounded-full bg-gov-blue/20 flex items-center justify-center mx-auto mb-2">
                  <FiLoader className="text-gov-blue" size={20} />
                </div>
                <p className="text-2xl font-bold text-gov-blue">{stats.in_progress || 0}</p>
                <p className="text-xs text-gray-500">In Progress</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md transition-shadow hover:border-gov-blue/30">
                <div className="w-10 h-10 rounded-full bg-gov-blue/10 flex items-center justify-center mx-auto mb-2">
                  <FiCheckCircle className="text-gov-blue" size={20} />
                </div>
                <p className="text-2xl font-bold text-gov-blue">{stats.resolved || 0}</p>
                <p className="text-xs text-gray-500">Resolved</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md transition-shadow hover:border-gov-blue/30">
                <div className="w-10 h-10 rounded-full bg-gov-blue/10 flex items-center justify-center mx-auto mb-2">
                  <FiFileText className="text-gov-blue" size={20} />
                </div>
                <p className="text-2xl font-bold text-gov-blue">{stats.total || 0}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:gap-4 md:flex-row">
              {/* Search */}
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, tracking ID, or category..."
                  className="input-field pl-10 text-sm sm:text-base"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <FiFilter className="text-gray-400 hidden sm:block" size={18} />
                <select
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="input-field w-full md:w-40 text-sm sm:text-base"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>

                {/* New Complaint Button */}
                <Link
                  to="/citizen/complaints/new"
                  className="btn-primary flex items-center space-x-1 px-3 py-2 text-sm whitespace-nowrap"
                >
                  <FiPlus size={16} />
                  <span className="hidden sm:inline">New</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Complaints Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                  <div className="h-36 sm:h-48 bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredComplaints.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredComplaints.map((complaint) => {
                  const status = statusConfig[complaint.status] || statusConfig.pending;
                  const hasImages = complaint.image_url || complaint.image_url_2 || complaint.image_url_3;
                  const hasFeedback = complaint.feedback_rating;
                  
                  // Get default image based on category
                  const getCategoryImage = (category) => {
                    const images = {
                      'Road': 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400&h=300&fit=crop',
                      'Water': 'https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=400&h=300&fit=crop',
                      'Drainage': 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=400&h=300&fit=crop',
                      'Electricity': 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=300&fit=crop',
                      'Garbage': 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400&h=300&fit=crop',
                      'Street Light': 'https://images.unsplash.com/photo-1542649761-acf86d3eaee8?w=400&h=300&fit=crop',
                      'Public Toilet': 'https://images.unsplash.com/photo-1629753423540-9fc6d9d3b12c?w=400&h=300&fit=crop',
                      'Park': 'https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=400&h=300&fit=crop',
                      'Building': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop',
                      'Other': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop'
                    };
                    return images[category] || images['Other'];
                  };

                  return (
                    <Link
                      key={complaint.id}
                      to={`/citizen/complaints/${complaint.id}`}
                      className="block bg-white rounded-xl overflow-hidden group hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gov-blue/30"
                    >
                      {/* Card Image */}
                      <div className="relative h-36 sm:h-48 overflow-hidden">
                        <img 
                          src={complaint.image_url || getCategoryImage(complaint.category)} 
                          alt={complaint.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = getCategoryImage(complaint.category);
                          }}
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-gov-blue/60 via-transparent to-transparent"></div>
                        
                        {/* Status Badge */}
                        <span className={`absolute top-2 sm:top-3 right-2 sm:right-3 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${status.bgColor} ${status.textColor}`}>
                          {status.label}
                        </span>
                        
                        {/* Category Badge */}
                        <span className="absolute top-2 sm:top-3 left-2 sm:left-3 px-2 sm:px-3 py-0.5 sm:py-1 bg-white/90 text-gov-blue rounded-full text-[10px] sm:text-xs font-medium">
                          {complaint.category}
                        </span>
                        
                        {/* Image Count Badge */}
                        {hasImages && (
                          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-black/50 rounded-full text-white text-[10px]">
                            <FiImage size={12} />
                            <span>{[complaint.image_url, complaint.image_url_2, complaint.image_url_3].filter(Boolean).length}</span>
                          </div>
                        )}
                        
                        {/* Tracking ID on Image */}
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 rounded-full text-white text-[10px] font-mono">
                          {complaint.tracking_id}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-3 sm:p-4">
                        {/* Title */}
                        <h3 className="text-sm sm:text-base font-semibold text-gov-blue mb-1.5 line-clamp-2 group-hover:text-gov-blue/80 transition-colors">
                          {complaint.title}
                        </h3>

                        {/* Description */}
                        <p className="text-gray-500 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">
                          {complaint.description?.substring(0, 80)}
                          {complaint.description?.length > 80 ? '...' : ''}
                        </p>

                        {/* Priority Badge */}
                        {complaint.priority && complaint.priority !== 'normal' && (
                          <div className="mb-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium border ${getPriorityColor(complaint.priority)}`}>
                              {complaint.priority.charAt(0).toUpperCase() + complaint.priority.slice(1)} Priority
                            </span>
                          </div>
                        )}

                        {/* Footer Info */}
                        <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-100 text-[10px] sm:text-xs text-gray-500">
                          <div className="flex items-center">
                            <FiClock size={12} className="mr-1 text-gov-red" />
                            {formatDate(complaint.created_at)}
                          </div>
                          <div className="flex items-center gap-2">
                            {complaint.location && (
                              <div className="flex items-center">
                                <FiMapPin size={12} className="mr-0.5 text-gov-red" />
                                <span className="truncate max-w-[60px]">{complaint.location}</span>
                              </div>
                            )}
                            {hasFeedback && (
                              <FiStar size={12} className="text-yellow-500" title="Feedback given" />
                            )}
                            {complaint.admin_remarks && (
                              <FiMessageSquare size={12} className="text-gov-blue" title="Admin replied" />
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-xl border border-gray-200 p-3 sm:p-4 mt-6">
                  <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => { e.preventDefault(); setPagination(prev => ({ ...prev, page: prev.page - 1 })); }}
                      disabled={pagination.page === 1}
                      className="btn-outline text-xs sm:text-sm px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <button
                      onClick={(e) => { e.preventDefault(); setPagination(prev => ({ ...prev, page: prev.page + 1 })); }}
                      disabled={pagination.page === pagination.totalPages}
                      className="btn-outline text-xs sm:text-sm px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FiFileText size={32} className="text-gray-300" />
              </div>
              <p className="text-lg text-gray-700 font-medium">No complaints found</p>
              <p className="text-sm text-gray-500 mt-1.5">
                {filter ? 'Try changing the filter' : 'Submit your first complaint to get started'}
              </p>
              <Link
                to="/citizen/complaints/new"
                className="btn-primary inline-flex items-center space-x-2 mt-4"
              >
                <FiPlus size={18} />
                <span>Submit Complaint</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyComplaints;

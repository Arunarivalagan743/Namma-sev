import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintService } from '../../services/complaint.service';
import CitizenNav from '../../components/CitizenNav';
import TranslatedText from '../../components/TranslatedText';
import { useTranslation } from '../../context/TranslationContext';
import { 
  FiFileText, FiMapPin, FiClock, FiCheck, FiLoader, FiX,
  FiChevronDown, FiChevronUp, FiFilter, FiStar, FiUsers,
  FiTruck, FiDroplet, FiZap, FiTrash2, FiSun, FiActivity, 
  FiHeart, FiHome, FiVolume2, FiClipboard, FiEye, FiMessageSquare,
  FiSearch, FiRefreshCw, FiArrowLeft, FiArrowRight, FiGrid, FiList
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const PublicComplaints = () => {
  const { t } = useTranslation();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ total: 0, resolved: 0, inProgress: 0, pending: 0, avgRating: null });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState({ category: '', status: '', search: '' });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'compact'
  const [showFilters, setShowFilters] = useState(false);

  const categories = complaintService.getCategories();
  const statusConfig = complaintService.getStatusConfig();

  // Category icon mapping
  const getCategoryIcon = (category, size = 16) => {
    const icons = {
      'Road & Infrastructure': <FiTruck size={size} />,
      'Water Supply': <FiDroplet size={size} />,
      'Electricity': <FiZap size={size} />,
      'Sanitation': <FiTrash2 size={size} />,
      'Street Lights': <FiSun size={size} />,
      'Drainage': <FiActivity size={size} />,
      'Public Health': <FiHeart size={size} />,
      'Encroachment': <FiHome size={size} />,
      'Noise Pollution': <FiVolume2 size={size} />,
      'Other': <FiClipboard size={size} />
    };
    return icons[category] || <FiFileText size={size} />;
  };

  useEffect(() => {
    fetchPublicComplaints();
  }, [filter.category, filter.status, pagination.page]);

  const fetchPublicComplaints = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: 12,
        category: filter.category,
        status: filter.status
      };
      
      const response = await complaintService.getPublicComplaints(params);
      setComplaints(response.complaints || []);
      setStats(response.stats || {});
      setPagination(prev => ({
        ...prev,
        totalPages: response.pagination?.totalPages || 1,
        total: response.pagination?.total || 0
      }));
    } catch (error) {
      console.error('Error fetching public complaints:', error);
      toast.error('Failed to load public complaints');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status) => {
    const config = {
      pending: { 
        label: 'Pending', 
        bg: 'bg-amber-50', 
        text: 'text-amber-700', 
        border: 'border-amber-200',
        dot: 'bg-amber-500',
        icon: <FiClock size={14} />
      },
      in_progress: { 
        label: 'In Progress', 
        bg: 'bg-blue-50', 
        text: 'text-blue-700', 
        border: 'border-blue-200',
        dot: 'bg-blue-500',
        icon: <FiLoader size={14} className="animate-spin" />
      },
      resolved: { 
        label: 'Resolved', 
        bg: 'bg-emerald-50', 
        text: 'text-emerald-700', 
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        icon: <FiCheck size={14} />
      },
      rejected: { 
        label: 'Rejected', 
        bg: 'bg-red-50', 
        text: 'text-red-700', 
        border: 'border-red-200',
        dot: 'bg-red-500',
        icon: <FiX size={14} />
      }
    };
    return config[status] || config.pending;
  };

  const clearFilters = () => {
    setFilter({ category: '', status: '', search: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const filteredComplaints = complaints.filter(c => 
    !filter.search || 
    c.title?.toLowerCase().includes(filter.search.toLowerCase()) ||
    c.trackingId?.toLowerCase().includes(filter.search.toLowerCase())
  );

  const hasActiveFilters = filter.category || filter.status || filter.search;

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenNav />
      
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f] text-white">
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <FiEye size={24} />
                <TranslatedText text="Public Complaints" />
              </h1>
              <p className="text-white/70 text-sm mt-1">
                <TranslatedText text="Transparency in action - see how issues are resolved" />
              </p>
            </div>
            
            {/* Quick Stats - Mobile Friendly */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="text-center px-3 py-1 bg-white/10 rounded-lg">
                <p className="text-lg sm:text-xl font-bold">{stats.total || 0}</p>
                <p className="text-[10px] sm:text-xs text-white/60">Total</p>
              </div>
              <div className="text-center px-3 py-1 bg-emerald-500/20 rounded-lg">
                <p className="text-lg sm:text-xl font-bold text-emerald-300">{stats.resolved || 0}</p>
                <p className="text-[10px] sm:text-xs text-emerald-200/60">Resolved</p>
              </div>
              <div className="text-center px-3 py-1 bg-blue-500/20 rounded-lg">
                <p className="text-lg sm:text-xl font-bold text-blue-300">{stats.inProgress || 0}</p>
                <p className="text-[10px] sm:text-xs text-blue-200/60">Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 sm:mb-6">
          {/* Main Filter Row */}
          <div className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={filter.search}
                  onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search by title or ID..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] focus:bg-white transition-all"
                />
              </div>
              
              {/* Desktop Filters */}
              <div className="hidden sm:flex items-center gap-2">
                <select
                  value={filter.category}
                  onChange={(e) => {
                    setFilter(prev => ({ ...prev, category: e.target.value }));
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] min-w-[160px]"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                
                <select
                  value={filter.status}
                  onChange={(e) => {
                    setFilter(prev => ({ ...prev, status: e.target.value }));
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] min-w-[140px]"
                >
                  <option value="">All Status</option>
                  <option value="resolved">✓ Resolved</option>
                  <option value="in_progress">⟳ In Progress</option>
                  <option value="pending">⏳ Pending</option>
                </select>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <FiX size={14} />
                    Clear
                  </button>
                )}
              </div>

              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              >
                <FiFilter size={16} />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 bg-[#c41e3a] rounded-full"></span>
                )}
              </button>

              {/* View Toggle */}
              <div className="hidden md:flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('card')}
                  className={`p-2.5 ${viewMode === 'card' ? 'bg-[#1e3a5f] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  <FiGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`p-2.5 ${viewMode === 'compact' ? 'bg-[#1e3a5f] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  <FiList size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Expanded Filters */}
          {showFilters && (
            <div className="sm:hidden px-3 pb-3 pt-0 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-2 pt-3">
                <select
                  value={filter.category}
                  onChange={(e) => {
                    setFilter(prev => ({ ...prev, category: e.target.value }));
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                
                <select
                  value={filter.status}
                  onChange={(e) => {
                    setFilter(prev => ({ ...prev, status: e.target.value }));
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="">All Status</option>
                  <option value="resolved">Resolved</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full mt-2 px-3 py-2 text-sm text-[#c41e3a] bg-red-50 rounded-lg"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}

          {/* Results Count */}
          <div className="px-3 sm:px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs sm:text-sm text-gray-500">
              Showing {filteredComplaints.length} of {pagination.total} complaints
            </span>
            <button
              onClick={fetchPublicComplaints}
              className="text-xs sm:text-sm text-[#1e3a5f] hover:underline flex items-center gap-1"
            >
              <FiRefreshCw size={12} />
              Refresh
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 text-sm">Loading complaints...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="bg-white rounded-xl p-8 sm:p-12 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiFileText className="text-gray-400" size={28} />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              <TranslatedText text="No complaints found" />
            </h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              {hasActiveFilters ? (
                <TranslatedText text="Try adjusting your filters to see more results" />
              ) : (
                <TranslatedText text="Citizens can choose to make their complaints public to help build community trust" />
              )}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 text-sm bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d4a6f]"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Card Grid View */}
            {viewMode === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredComplaints.map((complaint) => {
                  const statusCfg = getStatusConfig(complaint.status);
                  const isExpanded = expandedId === complaint.id;
                  
                  return (
                    <div 
                      key={complaint.id} 
                      className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 ${isExpanded ? 'md:col-span-2 xl:col-span-3' : ''}`}
                    >
                      {/* Card Header */}
                      <div className="p-4">
                        {/* Status & Category Row */}
                        <div className="flex items-center justify-between mb-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                            {statusCfg.icon}
                            {statusCfg.label}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            {getCategoryIcon(complaint.category, 12)}
                            <span className="hidden sm:inline">{complaint.category}</span>
                          </span>
                        </div>
                        
                        {/* Title */}
                        <h3 className="font-semibold text-gray-800 text-sm sm:text-base line-clamp-2 mb-2 min-h-[40px]">
                          {complaint.title}
                        </h3>
                        
                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-3">
                          <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">
                            {complaint.trackingId}
                          </span>
                          {complaint.location && (
                            <span className="flex items-center gap-1 truncate max-w-[120px]">
                              <FiMapPin size={11} />
                              {complaint.location}
                            </span>
                          )}
                        </div>

                        {/* Description Preview */}
                        {!isExpanded && (
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3">
                            {complaint.description}
                          </p>
                        )}
                        
                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <FiClock size={12} />
                            {formatDate(complaint.createdAt)}
                          </div>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : complaint.id)}
                            className="flex items-center gap-1 text-xs font-medium text-[#1e3a5f] hover:text-[#c41e3a] transition-colors"
                          >
                            {isExpanded ? 'Less' : 'Details'}
                            {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50 p-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Left Column */}
                            <div className="space-y-4">
                              {/* Full Description */}
                              <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</h4>
                                <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                                  {complaint.description}
                                </p>
                              </div>

                              {/* Images */}
                              {(complaint.imageUrl || complaint.imageUrl2 || complaint.imageUrl3) && (
                                <div>
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Evidence Photos</h4>
                                  <div className="flex gap-2 overflow-x-auto pb-2">
                                    {[complaint.imageUrl, complaint.imageUrl2, complaint.imageUrl3]
                                      .filter(Boolean)
                                      .map((url, idx) => (
                                        <a 
                                          key={idx}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex-shrink-0"
                                        >
                                          <img 
                                            src={url} 
                                            alt={`Evidence ${idx + 1}`}
                                            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border-2 border-gray-200 hover:border-[#1e3a5f] transition-colors"
                                          />
                                        </a>
                                      ))}
                                  </div>
                                </div>
                              )}

                              {/* Admin Remarks */}
                              {complaint.adminRemarks && (
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                  <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                                    <FiMessageSquare size={12} />
                                    Admin Response
                                  </h4>
                                  <p className="text-sm text-blue-800">{complaint.adminRemarks}</p>
                                </div>
                              )}
                            </div>

                            {/* Right Column - Timeline */}
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                                <FiClock size={12} />
                                Resolution Timeline
                              </h4>
                              
                              <div className="bg-white rounded-lg border border-gray-200 p-3 max-h-[300px] overflow-y-auto">
                                {complaint.timeline && complaint.timeline.length > 0 ? (
                                  <div className="relative">
                                    {complaint.timeline.map((item, index) => {
                                      const itemStatusCfg = getStatusConfig(item.status);
                                      return (
                                        <div key={item.id || index} className="relative pl-6 pb-4 last:pb-0">
                                          {/* Vertical Line */}
                                          {index < complaint.timeline.length - 1 && (
                                            <div className="absolute left-[9px] top-5 w-0.5 h-full bg-gray-200"></div>
                                          )}
                                          
                                          {/* Dot */}
                                          <div className={`absolute left-0 top-1 w-[18px] h-[18px] rounded-full ${itemStatusCfg.dot} border-2 border-white shadow-sm flex items-center justify-center`}>
                                            <span className="text-white">{itemStatusCfg.icon}</span>
                                          </div>
                                          
                                          {/* Content */}
                                          <div>
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className={`text-xs font-medium ${itemStatusCfg.text}`}>
                                                {itemStatusCfg.label}
                                              </span>
                                              <span className="text-[10px] text-gray-400">
                                                {formatDateTime(item.createdAt)}
                                              </span>
                                            </div>
                                            {item.remarks && (
                                              <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                                {item.remarks}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-400 text-center py-4">
                                    No updates yet
                                  </p>
                                )}
                              </div>

                              {/* Feedback */}
                              {complaint.feedback?.rating && (
                                <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                                  <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                                    <FiStar size={12} />
                                    Citizen Feedback
                                  </h4>
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map(star => (
                                        <FiStar 
                                          key={star}
                                          size={14}
                                          className={star <= complaint.feedback.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-sm font-medium text-emerald-700">{complaint.feedback.rating}/5</span>
                                  </div>
                                  {complaint.feedback.comment && (
                                    <p className="text-xs text-emerald-700 italic">"{complaint.feedback.comment}"</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Dates Footer */}
                          <div className="flex flex-wrap gap-4 text-xs text-gray-400 mt-4 pt-3 border-t border-gray-200">
                            <span>Filed: {formatDateTime(complaint.createdAt)}</span>
                            {complaint.resolvedAt && (
                              <span className="text-emerald-600">✓ Resolved: {formatDateTime(complaint.resolvedAt)}</span>
                            )}
                            <span>By: {complaint.userName}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Compact List View */
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {filteredComplaints.map((complaint) => {
                    const statusCfg = getStatusConfig(complaint.status);
                    
                    return (
                      <div 
                        key={complaint.id}
                        className="p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setExpandedId(expandedId === complaint.id ? null : complaint.id)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Status Dot */}
                          <div className={`w-3 h-3 rounded-full ${statusCfg.dot} mt-1.5 flex-shrink-0`}></div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="font-medium text-gray-800 text-sm truncate">{complaint.title}</h3>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                  <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-[10px]">
                                    {complaint.trackingId}
                                  </span>
                                  <span>{complaint.category}</span>
                                  <span>{formatDate(complaint.createdAt)}</span>
                                </div>
                              </div>
                              <span className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                                {statusCfg.label}
                              </span>
                            </div>
                            
                            {expandedId === complaint.id && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-sm text-gray-600 mb-3">{complaint.description}</p>
                                {complaint.adminRemarks && (
                                  <div className="bg-blue-50 p-2 rounded text-xs text-blue-700">
                                    <strong>Admin:</strong> {complaint.adminRemarks}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="p-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <FiArrowLeft size={18} />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                        className={`w-9 h-9 rounded-lg text-sm font-medium ${
                          pagination.page === pageNum 
                            ? 'bg-[#1e3a5f] text-white' 
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <FiArrowRight size={18} />
                </button>
              </div>
            )}
          </>
        )}

        {/* Trust Banner - Simplified */}
        <div className="mt-8 bg-gradient-to-r from-[#1e3a5f] to-[#c41e3a] rounded-xl p-5 sm:p-6 text-white text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FiUsers size={20} />
            <h3 className="font-semibold">
              <TranslatedText text="Building Trust Through Transparency" />
            </h3>
          </div>
          <p className="text-white/80 text-sm max-w-lg mx-auto">
            <TranslatedText text="Public complaints help others see how issues are resolved, strengthening community trust." />
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicComplaints;

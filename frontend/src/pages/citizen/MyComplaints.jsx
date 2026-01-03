import { useState, useEffect } from 'react';
import { complaintService } from '../../services/complaint.service';
import { FiFileText, FiFilter, FiSearch, FiClock, FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';
import CitizenNav from '../../components/CitizenNav';
import TranslatedText from '../../components/TranslatedText';
import { useTranslation } from '../../context/TranslationContext';

const MyComplaints = () => {
  const { t } = useTranslation();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

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

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'status-pending',
      in_progress: 'status-in-progress',
      resolved: 'status-resolved',
      rejected: 'status-rejected'
    };
    const labels = {
      pending: 'Pending',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      rejected: 'Rejected'
    };
    return (
      <span className={styles[status] || 'status-pending'}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, ID, or category..."
              className="input-field pl-10 text-sm sm:text-base"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
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
          </div>
        </div>
      </div>

      {/* Complaints List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-48 sm:h-64">
            <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-gov-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredComplaints.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredComplaints.map((complaint) => (
              <div key={complaint.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex-1">
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <FiFileText className="text-gov-blue mt-0.5 sm:mt-1 flex-shrink-0" size={18} />
                      <div className="min-w-0 flex-1">
                        <TranslatedText text={complaint.title} className="font-semibold text-gov-blue text-sm sm:text-base" as="h3" />
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                          Tracking ID: <span className="font-mono text-xs">{complaint.tracking_id}</span>
                        </p>
                      </div>
                      <div className="flex-shrink-0 md:hidden">
                        {getStatusBadge(complaint.status)}
                      </div>
                    </div>
                    <p className="text-gray-600 text-xs sm:text-sm mt-2 sm:mt-3 ml-5 sm:ml-8 line-clamp-2">
                      {complaint.description?.substring(0, 150)}
                      {complaint.description?.length > 150 ? '...' : ''}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3 ml-5 sm:ml-8 text-xs sm:text-sm text-gray-500">
                      <span className="bg-gray-100 px-2 py-0.5 sm:py-1 rounded text-xs">
                        {complaint.category}
                      </span>
                      {complaint.location && (
                        <span className="flex items-center space-x-1">
                          <FiMapPin size={12} />
                          <span className="truncate max-w-[100px] sm:max-w-none">{complaint.location}</span>
                        </span>
                      )}
                      <span className="flex items-center space-x-1">
                        <FiClock size={12} />
                        <span className="whitespace-nowrap">{formatDate(complaint.created_at)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="hidden md:block md:text-right flex-shrink-0">
                    {getStatusBadge(complaint.status)}
                    {complaint.admin_remarks && (
                      <div className="mt-3 p-2 sm:p-3 bg-gray-50 rounded text-xs sm:text-sm text-gray-700 max-w-xs text-left">
                        <strong>Admin Remarks:</strong>
                        <p className="mt-1">{complaint.admin_remarks}</p>
                      </div>
                    )}
                  </div>
                  {complaint.admin_remarks && (
                    <div className="md:hidden mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                      <strong>Admin Remarks:</strong>
                      <p className="mt-1">{complaint.admin_remarks}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 sm:p-12 text-center text-gray-500">
            <FiFileText size={40} className="mx-auto mb-3 sm:mb-4 text-gray-300 sm:w-12 sm:h-12" />
            <p className="text-base sm:text-lg">No complaints found</p>
            <p className="text-xs sm:text-sm mt-1.5 sm:mt-2">
              {filter ? 'Try changing the filter' : 'Submit your first complaint to get started'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 border-t border-gray-200">
            <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn-outline text-xs sm:text-sm px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="btn-outline text-xs sm:text-sm px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
       
      </div>
        </div>
      </div>
    </div>
    
  );
};

export default MyComplaints;

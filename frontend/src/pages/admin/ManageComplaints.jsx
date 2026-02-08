import { useState, useEffect, lazy, Suspense } from 'react';
import { adminService } from '../../services/admin.service';
import { complaintService } from '../../services/complaint.service';
import { 
  FiFileText, 
  FiFilter, 
  FiSearch, 
  FiUser,
  FiMapPin,
  FiClock,
  FiEdit2,
  FiX,
  FiImage,
  FiExternalLink,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useTranslation } from '../../context/TranslationContext';
import TranslatedText from '../../components/TranslatedText';

// AI Components - Lazy loaded for performance
const ComplaintSummary = lazy(() => import('../../components/ai/ComplaintSummary'));

// Translatable status labels
const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected'
};

const ManageComplaints = () => {
  const { t } = useTranslation();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [updating, setUpdating] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const categories = complaintService.getCategories();
  const statuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, categoryFilter, pagination.page]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;

      const response = await adminService.getAllComplaints(params);
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

  const handleUpdateStatus = async () => {
    if (!selectedComplaint || !newStatus) {
      toast.error('Please select a status');
      return;
    }

    setUpdating(true);
    try {
      await adminService.updateComplaintStatus(selectedComplaint.id, newStatus, remarks);
      toast.success('Complaint status updated');
      setSelectedComplaint(null);
      setNewStatus('');
      setRemarks('');
      fetchComplaints();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleVisibility = async (complaintId, currentVisibility) => {
    try {
      await adminService.toggleComplaintVisibility(complaintId, !currentVisibility);
      toast.success(currentVisibility ? 'Complaint hidden from public' : 'Complaint made public');
      fetchComplaints();
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('Failed to toggle visibility');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'status-pending',
      in_progress: 'status-in-progress',
      resolved: 'status-resolved',
      rejected: 'status-rejected'
    };
    return (
      <span className={styles[status] || 'status-pending'}>
        <TranslatedText text={STATUS_LABELS[status] || status} />
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
    c.user_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="section-title text-xl sm:text-2xl">Manage Complaints</h1>
        <p className="text-sm sm:text-base text-gray-600">View and update complaint status</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, ID, or user..."
              className="input-field pl-9 sm:pl-10 text-sm sm:text-base"
            />
          </div>

          {/* Filter Row */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="input-field text-sm sm:text-base sm:w-40"
            >
              <option value="">All Status</option>
              {statuses.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="input-field text-sm sm:text-base sm:w-48"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
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
              <div key={complaint.id} className="p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4">
                  <div className="flex-1">
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <FiFileText className="text-gov-blue mt-0.5 sm:mt-1 flex-shrink-0" size={18} />
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gov-blue text-sm sm:text-base line-clamp-2">{complaint.title}</h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                          <span className="font-mono">{complaint.tracking_id}</span> | {complaint.category}
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-600 text-xs sm:text-sm mt-2 sm:mt-3 ml-6 sm:ml-8 line-clamp-2 sm:line-clamp-none">
                      {complaint.description?.substring(0, 200)}
                      {complaint.description?.length > 200 ? '...' : ''}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3 ml-6 sm:ml-8 text-xs sm:text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <FiUser size={12} />
                        <span>{complaint.user_name}</span>
                      </span>
                      {complaint.location && (
                        <span className="flex items-center space-x-1">
                          <FiMapPin size={12} />
                          <span className="line-clamp-1">{complaint.location}</span>
                        </span>
                      )}
                      <span className="flex items-center space-x-1">
                        <FiClock size={12} />
                        <span>{formatDate(complaint.created_at)}</span>
                      </span>
                    </div>

                    {complaint.admin_remarks && (
                      <div className="mt-2 sm:mt-3 ml-6 sm:ml-8 p-2 sm:p-3 bg-blue-50 rounded text-xs sm:text-sm">
                        <strong className="text-blue-800">Remarks:</strong>
                        <p className="text-blue-700">{complaint.admin_remarks}</p>
                      </div>
                    )}

                    {/* Complaint Images */}
                    {(complaint.image_url || complaint.image_url_2 || complaint.image_url_3) && (
                      <div className="mt-3 ml-6 sm:ml-8">
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                          <FiImage size={12} />
                          <span>Attached Images</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {[complaint.image_url, complaint.image_url_2, complaint.image_url_3]
                            .filter(Boolean)
                            .map((url, index) => (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative group"
                              >
                                <img
                                  src={url}
                                  alt={`Complaint image ${index + 1}`}
                                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-gray-200 hover:border-gov-blue transition-colors"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-all">
                                  <FiExternalLink className="text-white opacity-0 group-hover:opacity-100" size={16} />
                                </div>
                              </a>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 sm:space-x-3 ml-6 sm:ml-8 lg:ml-0">
                    {getStatusBadge(complaint.status)}
                    {/* Visibility Toggle - Can only make public, not private (transparency) */}
                    {complaint.is_public ? (
                      // Public complaints show locked badge - cannot be made private
                      <div
                        className="flex items-center space-x-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded bg-green-100 text-green-700 text-xs sm:text-sm cursor-not-allowed"
                        title="Public complaints cannot be hidden - Transparency policy"
                      >
                        <FiEye size={12} />
                        <span className="hidden sm:inline">Public</span>
                        <span className="text-[10px] ml-1">🔒</span>
                      </div>
                    ) : (
                      // Private complaints can be made public
                      <button
                        onClick={() => handleToggleVisibility(complaint.id, complaint.is_public)}
                        className="flex items-center space-x-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700 transition-colors text-xs sm:text-sm"
                        title="Click to make public"
                      >
                        <FiEyeOff size={12} />
                        <span className="hidden sm:inline">Private</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedComplaint(complaint);
                        setNewStatus(complaint.status);
                        setRemarks(complaint.admin_remarks || '');
                      }}
                      className="flex items-center space-x-1 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gov-blue text-white rounded hover:bg-opacity-90 transition-colors text-xs sm:text-sm"
                    >
                      <FiEdit2 size={12} />
                      <span>Update</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 sm:p-12 text-center text-gray-500">
            <FiFileText size={40} className="mx-auto mb-3 sm:mb-4 text-gray-300" />
            <p className="text-base sm:text-lg">No complaints found</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 border-t border-gray-200">
            <p className="text-xs sm:text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn-outline text-xs sm:text-sm px-3 py-1.5 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="btn-outline text-xs sm:text-sm px-3 py-1.5 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Update Status Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gov-blue text-sm sm:text-base">Update Complaint Status</h3>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={22} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Tracking ID</p>
                <p className="font-mono font-medium text-sm sm:text-base">{selectedComplaint.tracking_id}</p>
              </div>

              <div>
                <p className="text-xs sm:text-sm text-gray-500">Title</p>
                <p className="font-medium text-sm sm:text-base">{selectedComplaint.title}</p>
              </div>

              <div>
                <p className="text-xs sm:text-sm text-gray-500">Description</p>
                <p className="text-sm text-gray-700 mt-1">{selectedComplaint.description}</p>
              </div>

              {/* AI Summary - Collapsible, shows timeline and status overview */}
              <Suspense fallback={<div className="animate-pulse h-20 bg-gray-100 rounded-lg mt-2"></div>}>
                <ComplaintSummary
                  complaintId={selectedComplaint.id}
                  autoLoad={true}
                  collapsible={true}
                  defaultExpanded={false}
                  className="mt-2"
                />
              </Suspense>

              {/* Images in Modal */}
              {(selectedComplaint.image_url || selectedComplaint.image_url_2 || selectedComplaint.image_url_3) && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-2">Attached Images</p>
                  <div className="flex flex-wrap gap-2">
                    {[selectedComplaint.image_url, selectedComplaint.image_url_2, selectedComplaint.image_url_3]
                      .filter(Boolean)
                      .map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative group"
                        >
                          <img
                            src={url}
                            alt={`Evidence ${index + 1}`}
                            className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg border-2 border-gray-200 hover:border-gov-blue transition-colors"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-all">
                            <FiExternalLink className="text-white opacity-0 group-hover:opacity-100" size={18} />
                          </div>
                        </a>
                      ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gov-blue mb-1.5 sm:mb-2">
                  Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="input-field text-sm sm:text-base"
                >
                  {statuses.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gov-blue mb-1.5 sm:mb-2">
                  Remarks (Optional)
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="input-field min-h-[80px] sm:min-h-[100px] text-sm sm:text-base"
                  placeholder="Add any remarks for the citizen..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 sm:space-x-3 p-3 sm:p-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="btn-secondary text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updating}
                className="btn-primary flex items-center space-x-2 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
              >
                {updating ? (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Update Status</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageComplaints;

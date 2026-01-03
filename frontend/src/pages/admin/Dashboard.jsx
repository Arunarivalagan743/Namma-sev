import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service';
import { useTranslation } from '../../context/TranslationContext';
import { 
  FiUsers, 
  FiFileText, 
  FiClock, 
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiUserPlus
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await adminService.getDashboardStats();
      setStats(response);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard statistics');
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
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-gov-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-gov-blue">
          Admin Dashboard
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Manage users, complaints, and announcements for Ganapathipalayam Panchayat
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Total Users</p>
              <p className="text-2xl sm:text-3xl font-bold text-gov-blue mt-0.5 sm:mt-1">
                {stats?.users?.total_users || 0}
              </p>
            </div>
            <FiUsers className="text-gov-blue opacity-50 hidden sm:block" size={32} />
            <FiUsers className="text-gov-blue opacity-50 sm:hidden" size={24} />
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-yellow-800">Pending Users</p>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-700 mt-0.5 sm:mt-1">
                {stats?.users?.pending_users || 0}
              </p>
            </div>
            <FiUserPlus className="text-yellow-600 hidden sm:block" size={32} />
            <FiUserPlus className="text-yellow-600 sm:hidden" size={24} />
          </div>
          {stats?.users?.pending_users > 0 && (
            <Link to="/admin/users" className="text-yellow-700 text-xs sm:text-sm hover:underline mt-1 sm:mt-2 inline-block">
              Review now
            </Link>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Total Complaints</p>
              <p className="text-2xl sm:text-3xl font-bold text-gov-blue mt-0.5 sm:mt-1">
                {stats?.complaints?.total_complaints || 0}
              </p>
            </div>
            <FiFileText className="text-gov-blue opacity-50 hidden sm:block" size={32} />
            <FiFileText className="text-gov-blue opacity-50 sm:hidden" size={24} />
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-orange-800">Pending Complaints</p>
              <p className="text-2xl sm:text-3xl font-bold text-orange-700 mt-0.5 sm:mt-1">
                {stats?.complaints?.pending_complaints || 0}
              </p>
            </div>
            <FiClock className="text-orange-600 hidden sm:block" size={32} />
            <FiClock className="text-orange-600 sm:hidden" size={24} />
          </div>
        </div>
      </div>

      {/* Complaint Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-5">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <FiAlertCircle className="text-blue-600" size={20} />
            <div>
              <p className="text-xs sm:text-sm text-blue-800">In Progress</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-700">
                {stats?.complaints?.in_progress_complaints || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-5">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <FiCheckCircle className="text-green-600" size={20} />
            <div>
              <p className="text-xs sm:text-sm text-green-800">Resolved</p>
              <p className="text-xl sm:text-2xl font-bold text-green-700">
                {stats?.complaints?.resolved_complaints || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <FiUsers className="text-gov-blue" size={20} />
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Approved Citizens</p>
              <p className="text-xl sm:text-2xl font-bold text-gov-blue">
                {stats?.users?.approved_users || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Complaints */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gov-blue text-sm sm:text-base">Quick Actions</h2>
          </div>
          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
            <Link
              to="/admin/users"
              className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-gov-blue transition-colors"
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <FiUsers className="text-gov-blue" size={20} />
                <div>
                  <p className="font-medium text-gov-blue text-sm sm:text-base">Manage Users</p>
                  <p className="text-xs sm:text-sm text-gray-500">Approve or reject registrations</p>
                </div>
              </div>
              <FiArrowRight className="text-gray-400" size={18} />
            </Link>

            <Link
              to="/admin/complaints"
              className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-gov-blue transition-colors"
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <FiFileText className="text-gov-blue" size={20} />
                <div>
                  <p className="font-medium text-gov-blue text-sm sm:text-base">Manage Complaints</p>
                  <p className="text-xs sm:text-sm text-gray-500">Update complaint status</p>
                </div>
              </div>
              <FiArrowRight className="text-gray-400" size={18} />
            </Link>

            <Link
              to="/admin/announcements"
              className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-gov-blue transition-colors"
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <FiAlertCircle className="text-gov-blue" size={20} />
                <div>
                  <p className="font-medium text-gov-blue text-sm sm:text-base">Announcements</p>
                  <p className="text-xs sm:text-sm text-gray-500">Create public notices</p>
                </div>
              </div>
              <FiArrowRight className="text-gray-400" size={18} />
            </Link>
          </div>
        </div>

        {/* Recent Complaints */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gov-blue text-sm sm:text-base">Recent Complaints</h2>
            <Link to="/admin/complaints" className="text-gov-blue text-xs sm:text-sm hover:underline">
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {stats?.recentComplaints?.length > 0 ? (
              stats.recentComplaints.map((complaint) => (
                <div key={complaint.id} className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gov-blue text-sm sm:text-base line-clamp-1">{complaint.title}</p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                        {complaint.tracking_id} | {complaint.user_name}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {getStatusBadge(complaint.status)}
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
                        {formatDate(complaint.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 sm:p-8 text-center text-gray-500">
                <p className="text-sm sm:text-base">No recent complaints</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      {stats?.categoryDistribution?.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h2 className="font-semibold text-gov-blue mb-3 sm:mb-4 text-sm sm:text-base">Complaints by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
            {stats.categoryDistribution.map((cat, index) => (
              <div key={index} className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xl sm:text-2xl font-bold text-gov-blue">{cat.count}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 line-clamp-1">{cat.category}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

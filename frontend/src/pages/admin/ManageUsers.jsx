import { useState, useEffect } from 'react';
import { adminService } from '../../services/admin.service';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiCheck, 
  FiX,
  FiFilter,
  FiClock
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      if (filter === 'pending') {
        const response = await adminService.getPendingUsers();
        setPendingUsers(response.users || []);
      } else {
        const response = await adminService.getAllUsers({ status: filter || undefined });
        setUsers(response.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    setProcessing(userId);
    try {
      await adminService.approveUser(userId);
      toast.success('User approved successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Failed to approve user');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (userId) => {
    const reason = window.prompt('Enter rejection reason (optional):');
    setProcessing(userId);
    try {
      await adminService.rejectUser(userId, reason);
      toast.success('User registration rejected');
      fetchUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('Failed to reject user');
    } finally {
      setProcessing(null);
    }
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

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const displayUsers = filter === 'pending' ? pendingUsers : users;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="section-title text-xl sm:text-2xl">Manage Users</h1>
        <p className="text-sm sm:text-base text-gray-600">Approve or reject citizen registrations</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <FiFilter className="text-gray-400 hidden sm:block" />
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {['pending', 'approved', 'rejected', ''].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-gov-blue text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === '' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Users Alert */}
      {filter === 'pending' && pendingUsers.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center space-x-2">
            <FiClock className="text-yellow-600" size={18} />
            <p className="text-yellow-800 text-sm sm:text-base">
              <strong>{pendingUsers.length}</strong> user(s) waiting for approval
            </p>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-48 sm:h-64">
            <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-gov-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : displayUsers.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {displayUsers.map((user) => (
              <div key={user.id} className="p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4">
                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gov-blue bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                        <FiUser className="text-gov-blue" size={18} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gov-blue text-sm sm:text-base">{user.name}</h3>
                        {user.status && getStatusBadge(user.status)}
                      </div>
                    </div>

                    <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                        <FiMail size={14} />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                        <FiPhone size={14} />
                        <span>{user.phone}</span>
                      </div>
                      <div className="flex items-start space-x-2 text-xs sm:text-sm text-gray-600 sm:col-span-2">
                        <FiMapPin size={14} className="mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{user.address}</span>
                      </div>
                    </div>

                    {user.aadhaar_last4 && (
                      <p className="text-xs sm:text-sm text-gray-500 mt-2">
                        Aadhaar: XXXX-XXXX-{user.aadhaar_last4}
                      </p>
                    )}

                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5 sm:mt-2">
                      Registered: {formatDate(user.created_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  {filter === 'pending' && (
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <button
                        onClick={() => handleApprove(user.id)}
                        disabled={processing === user.id}
                        className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-xs sm:text-sm"
                      >
                        {processing === user.id ? (
                          <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <FiCheck size={16} />
                        )}
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(user.id)}
                        disabled={processing === user.id}
                        className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-xs sm:text-sm"
                      >
                        <FiX size={16} />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 sm:p-12 text-center text-gray-500">
            <FiUser size={40} className="mx-auto mb-3 sm:mb-4 text-gray-300" />
            <p className="text-base sm:text-lg">No users found</p>
            <p className="text-xs sm:text-sm mt-1.5 sm:mt-2">
              {filter === 'pending' 
                ? 'No pending registrations at the moment'
                : 'No users match the selected filter'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;

import { useState, useEffect } from 'react';
import { adminService } from '../../services/admin.service';
import { FiBarChart2, FiPieChart, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await adminService.getComplaintAnalytics();
      setAnalytics(response);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#EAB308',
      in_progress: '#3B82F6',
      resolved: '#22C55E',
      rejected: '#EF4444'
    };
    return colors[status] || '#6B7280';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      rejected: 'Rejected'
    };
    return labels[status] || status;
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
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">Insights and trends for complaint management</p>
      </div>

      {/* Resolution Rate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <FiCheckCircle className="text-green-600" size={20} />
            <h2 className="font-semibold text-gov-blue text-sm sm:text-base">Resolution Rate</h2>
          </div>
          <div className="flex items-end space-x-2 sm:space-x-4">
            <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-green-600">
              {analytics?.resolutionRate?.percentage || 0}%
            </span>
            <div className="text-xs sm:text-sm text-gray-500 pb-1 sm:pb-2">
              <p>{analytics?.resolutionRate?.resolved || 0} resolved</p>
              <p>out of {analytics?.resolutionRate?.total || 0} total</p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 bg-gray-200 rounded-full h-3 sm:h-4 overflow-hidden">
            <div 
              className="bg-green-600 h-full transition-all duration-500"
              style={{ width: `${analytics?.resolutionRate?.percentage || 0}%` }}
            />
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <FiPieChart className="text-gov-blue" size={20} />
            <h2 className="font-semibold text-gov-blue text-sm sm:text-base">Status Distribution</h2>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {analytics?.statusDistribution?.map((item) => (
              <div key={item.status}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">{getStatusLabel(item.status)}</span>
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500"
                    style={{ 
                      width: `${(item.count / (analytics?.resolutionRate?.total || 1)) * 100}%`,
                      backgroundColor: getStatusColor(item.status)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
          <FiBarChart2 className="text-gov-blue" size={20} />
          <h2 className="font-semibold text-gov-blue text-sm sm:text-base">Complaints by Category</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {analytics?.categoryDistribution?.map((item, index) => {
            const maxCount = Math.max(...analytics.categoryDistribution.map(c => c.count));
            return (
              <div key={index} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <span className="text-xs sm:text-sm text-gray-600 truncate">{item.category}</span>
                  <span className="text-base sm:text-lg font-bold text-gov-blue">{item.count}</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gov-blue h-full transition-all duration-500"
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Trend */}
      {analytics?.monthlyTrend?.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
            <FiTrendingUp className="text-gov-blue" size={20} />
            <h2 className="font-semibold text-gov-blue text-sm sm:text-base">Monthly Complaint Trend</h2>
          </div>
          <div className="flex items-end justify-between space-x-1 sm:space-x-2 h-32 sm:h-40 md:h-48 overflow-x-auto">
            {analytics.monthlyTrend.map((item, index) => {
              const maxCount = Math.max(...analytics.monthlyTrend.map(t => t.count));
              const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
              return (
                <div key={index} className="flex-1 min-w-[30px] sm:min-w-[40px] flex flex-col items-center">
                  <span className="text-[10px] sm:text-xs md:text-sm font-medium text-gov-blue mb-1 sm:mb-2">{item.count}</span>
                  <div 
                    className="w-full bg-gov-blue rounded-t transition-all duration-500"
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  />
                  <span className="text-[8px] sm:text-xs text-gray-500 mt-1 sm:mt-2 whitespace-nowrap">
                    {new Date(item.month + '-01').toLocaleDateString('en-IN', { 
                      month: 'short',
                      year: '2-digit'
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Card */}
      <div className="bg-gov-blue text-white rounded-lg p-4 sm:p-6">
        <h2 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Quick Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold">{analytics?.resolutionRate?.total || 0}</p>
            <p className="text-gray-300 text-xs sm:text-sm">Total Complaints</p>
          </div>
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold">{analytics?.resolutionRate?.resolved || 0}</p>
            <p className="text-gray-300 text-xs sm:text-sm">Resolved</p>
          </div>
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold">{analytics?.categoryDistribution?.length || 0}</p>
            <p className="text-gray-300 text-xs sm:text-sm">Categories</p>
          </div>
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold">{analytics?.resolutionRate?.percentage || 0}%</p>
            <p className="text-gray-300 text-xs sm:text-sm">Success Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

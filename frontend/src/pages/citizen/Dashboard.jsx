import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import { complaintService } from '../../services/complaint.service';
import { announcementService } from '../../services/announcement.service';
import TranslatedText from '../../components/TranslatedText';
import { 
  FiFileText, 
  FiPlusCircle, 
  FiBell, 
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const CitizenDashboard = () => {
  const { userProfile } = useAuth();
  const { t } = useTranslation();
  const [complaints, setComplaints] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [complaintsRes, announcementsRes] = await Promise.all([
        complaintService.getMyComplaints({ limit: 5 }),
        announcementService.getAll({ limit: 3 })
      ]);

      setComplaints(complaintsRes.complaints || []);
      setAnnouncements(announcementsRes.announcements || []);

      // Calculate stats
      const allComplaints = complaintsRes.complaints || [];
      setStats({
        total: complaintsRes.pagination?.total || allComplaints.length,
        pending: allComplaints.filter(c => c.status === 'pending').length,
        inProgress: allComplaints.filter(c => c.status === 'in_progress').length,
        resolved: allComplaints.filter(c => c.status === 'resolved').length
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
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
      year: 'numeric'
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
      {/* Welcome Banner with Background Image */}
      <div 
        className="rounded-lg p-4 sm:p-6 relative overflow-hidden"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(30, 58, 95, 0.9), rgba(196, 30, 58, 0.8)), url(https://images.unsplash.com/photo-1560439514-4e9645039924?w=1200&h=400&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <h1 className="text-xl sm:text-2xl font-semibold text-white">
          {t('welcome')}, {userProfile?.name || t('panchayatResident')}
        </h1>
        <p className="text-white/80 mt-1 text-sm sm:text-base">
          {t('panchayatName')} - {t('citizenPortal')}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <Link
          to="/new-complaint"
          className="bg-gov-blue text-white rounded-lg p-4 sm:p-6 hover:bg-opacity-90 transition-colors"
        >
          <FiPlusCircle size={28} className="mb-2 sm:mb-3 sm:w-8 sm:h-8" />
          <h3 className="font-semibold text-base sm:text-lg">{t('fileComplaint')}</h3>
          <p className="text-gray-300 text-xs sm:text-sm mt-1">{t('description')}</p>
        </Link>
        <Link
          to="/my-complaints"
          className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:border-gov-blue transition-colors"
        >
          <FiFileText size={28} className="text-gov-blue mb-2 sm:mb-3 sm:w-8 sm:h-8" />
          <h3 className="font-semibold text-base sm:text-lg text-gov-blue">{t('myComplaints')}</h3>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">{t('trackStatus')}</p>
        </Link>
        <Link
          to="/announcements"
          className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:border-gov-blue transition-colors sm:col-span-2 md:col-span-1"
        >
          <FiBell size={28} className="text-gov-blue mb-2 sm:mb-3 sm:w-8 sm:h-8" />
          <h3 className="font-semibold text-base sm:text-lg text-gov-blue">{t('announcements')}</h3>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">{t('latestNews')}</p>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">{t('totalComplaints')}</p>
              <p className="text-xl sm:text-2xl font-bold text-gov-blue">{stats.total}</p>
            </div>
            <FiFileText className="text-gray-400 w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">{t('pending')}</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <FiClock className="text-yellow-500 w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">{t('inProgress')}</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
            <FiAlertCircle className="text-blue-500 w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">{t('resolved')}</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.resolved}</p>
            </div>
            <FiCheckCircle className="text-green-500 w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gov-blue">{t('myComplaints')}</h2>
          <Link to="/my-complaints" className="text-gov-blue text-xs sm:text-sm hover:underline flex items-center space-x-1">
            <span>{t('viewAll')}</span>
            <FiArrowRight size={14} />
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {complaints.length > 0 ? (
            complaints.map((complaint) => (
              <div key={complaint.id} className="p-3 sm:p-4 hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <TranslatedText text={complaint.title} className="font-medium text-gov-blue text-sm sm:text-base truncate" as="p" />
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                      {complaint.tracking_id} | {complaint.category}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:text-right sm:flex-col sm:items-end">
                    {getStatusBadge(complaint.status)}
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-0 sm:mt-1">
                      {formatDate(complaint.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 sm:p-8 text-center text-gray-500">
              <FiFileText size={36} className="mx-auto mb-2 sm:mb-3 text-gray-300" />
              <p className="text-sm sm:text-base">{t('noData')}</p>
              <Link to="/new-complaint" className="text-gov-blue hover:underline text-xs sm:text-sm mt-1.5 sm:mt-2 inline-block">
                {t('fileComplaint')}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent Announcements */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gov-blue">{t('latestNews')}</h2>
          <Link to="/announcements" className="text-gov-blue text-xs sm:text-sm hover:underline flex items-center space-x-1">
            <span>{t('viewAll')}</span>
            <FiArrowRight size={14} />
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {announcements.length > 0 ? (
            announcements.map((announcement) => (
              <div key={announcement.id} className="p-3 sm:p-4 hover:bg-gray-50">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <FiBell className="text-gov-gold mt-0.5 sm:mt-1 flex-shrink-0" size={16} />
                  <div className="min-w-0 flex-1">
                    <TranslatedText text={announcement.title} className="font-medium text-gov-blue text-sm sm:text-base" as="p" />
                    <TranslatedText text={announcement.content} className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 line-clamp-2" as="p" />
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5 sm:mt-2">
                      {formatDate(announcement.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 sm:p-8 text-center text-gray-500">
              <FiBell size={36} className="mx-auto mb-2 sm:mb-3 text-gray-300" />
              <p className="text-sm sm:text-base">{t('noData')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;

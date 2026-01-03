import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { complaintService } from '../../services/complaint.service';
import { 
  FiSearch, FiMapPin, FiClock, FiCheck, FiX, FiLoader,
  FiArrowLeft, FiFileText, FiInfo, FiAlertCircle,
  FiTruck, FiDroplet, FiZap, FiTrash2, FiSun, FiActivity, FiHeart, FiHome, FiVolume2, FiClipboard
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const TrackComplaint = () => {
  const { trackingId: urlTrackingId } = useParams();
  const [trackingId, setTrackingId] = useState(urlTrackingId || '');
  const [loading, setLoading] = useState(false);
  const [complaint, setComplaint] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState('');

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

  // Auto-track if URL has tracking ID
  useEffect(() => {
    if (urlTrackingId) {
      setTrackingId(urlTrackingId);
      handleTrackById(urlTrackingId);
    }
  }, [urlTrackingId]);

  const handleTrackById = async (id) => {
    setLoading(true);
    setError('');
    setComplaint(null);

    try {
      const response = await complaintService.track(id.trim());
      setComplaint(response.complaint);
      setTimeline(response.timeline || []);
    } catch (err) {
      console.error('Track error:', err);
      setError(err.response?.data?.message || 'Complaint not found. Please check your tracking ID.');
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    
    if (!trackingId.trim()) {
      toast.error('Please enter a tracking ID');
      return;
    }

    handleTrackById(trackingId);
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FiClock className="text-gov-blue" size={20} />;
      case 'in_progress': return <FiLoader className="text-gov-blue animate-spin" size={20} />;
      case 'resolved': return <FiCheck className="text-gov-blue" size={20} />;
      case 'rejected': return <FiX className="text-gov-red" size={20} />;
      default: return <FiClock className="text-gov-blue" size={20} />;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending': return 'border-gov-blue/30 bg-gov-blue/5';
      case 'in_progress': return 'border-gov-blue/40 bg-gov-blue/10';
      case 'resolved': return 'border-gov-blue/30 bg-gov-blue/5';
      case 'rejected': return 'border-gov-red/30 bg-gov-red/5';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div 
        className="relative h-48 sm:h-56 overflow-hidden"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(30, 58, 95, 0.95), rgba(196, 30, 58, 0.85)), url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&h=400&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-white">
              Track Your Complaint
            </h1>
            <p className="text-white/80 mt-2 text-sm sm:text-base">
              திருப்பூர் பஞ்சாயத்து - Tirupur Panchayat
            </p>
            <p className="text-white/60 mt-1 text-xs sm:text-sm">
              Enter your Tracking ID to check status
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8 -mt-8">
        <div className="max-w-2xl mx-auto">
          
          {/* Search Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-6">
            <form onSubmit={handleTrack} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gov-blue mb-2">
                  Enter Tracking ID
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                    placeholder="e.g., TRP-XXXXXXXXX"
                    className="input-field pl-12 text-base sm:text-lg font-mono uppercase tracking-wider"
                    maxLength={20}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Your tracking ID was provided when you submitted the complaint
                </p>
              </div>
              
              <button
                type="submit"
                disabled={loading || !trackingId.trim()}
                className="w-full btn-primary py-3 text-base flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <FiSearch size={18} />
                    <span>Track Complaint</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-gov-red/5 border border-gov-red/20 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <FiAlertCircle className="text-gov-red flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-gov-red font-medium">Complaint Not Found</p>
                  <p className="text-gov-red/80 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Complaint Details */}
          {complaint && (
            <div className="space-y-4 sm:space-y-6">
              
              {/* Status Card */}
              <div className={`rounded-xl border-2 p-4 sm:p-6 ${getStatusStyle(complaint.status)}`}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                      complaint.status === 'rejected' ? 'bg-gov-red/10' : 'bg-gov-blue/10'
                    }`}>
                      {getStatusIcon(complaint.status)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Current Status</p>
                      <p className={`font-bold text-xl ${statusConfig[complaint.status]?.textColor}`}>
                        {statusConfig[complaint.status]?.label || complaint.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Tracking ID</p>
                    <p className="font-mono font-bold text-lg text-gov-blue">{complaint.tracking_id}</p>
                  </div>
                </div>
                
                {complaint.statusMessage && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-gray-700">{complaint.statusMessage}</p>
                  </div>
                )}

                {complaint.daysSinceCreation !== undefined && (
                  <div className="mt-4 flex items-center text-sm text-gray-600">
                    <FiClock className="mr-2" size={16} />
                    <span>Submitted {complaint.daysSinceCreation} days ago</span>
                  </div>
                )}
              </div>

              {/* Complaint Info Card */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gov-blue px-4 sm:px-6 py-3">
                  <h2 className="text-white font-semibold">Complaint Details</h2>
                </div>
                
                <div className="p-4 sm:p-6 space-y-4">
                  {/* Category & Title */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gov-blue">{getCategoryIcon(complaint.category)}</span>
                      <span className="bg-gov-blue/10 text-gov-blue px-3 py-1 rounded-full text-sm font-medium">
                        {complaint.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gov-blue">{complaint.title}</h3>
                  </div>

                  {/* Location */}
                  {complaint.location && (
                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <FiMapPin className="text-gov-blue flex-shrink-0 mt-0.5" size={18} />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                        <p className="text-gray-800">{complaint.location}</p>
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 pt-4 border-t">
                    <div className="flex items-center space-x-1">
                      <FiClock size={14} />
                      <span>Submitted: {formatDate(complaint.created_at)}</span>
                    </div>
                    {complaint.updated_at && complaint.updated_at !== complaint.created_at && (
                      <div className="flex items-center space-x-1">
                        <FiClock size={14} />
                        <span>Last Updated: {formatDate(complaint.updated_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {timeline.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gov-blue px-4 sm:px-6 py-3">
                    <h2 className="text-white font-semibold">Status Timeline</h2>
                  </div>
                  
                  <div className="p-4 sm:p-6">
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200"></div>
                      
                      <div className="space-y-6">
                        {timeline.map((item, index) => {
                          const isLatest = index === timeline.length - 1;
                          const itemStatus = statusConfig[item.status] || statusConfig.pending;
                          
                          return (
                            <div key={index} className="relative flex items-start">
                              {/* Timeline dot */}
                              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                                isLatest ? itemStatus.bgColor : 'bg-gray-100'
                              }`}>
                                {getStatusIcon(item.status)}
                              </div>
                              
                              {/* Content */}
                              <div className="ml-4 flex-1">
                                <p className={`font-medium ${isLatest ? itemStatus.textColor : 'text-gray-700'}`}>
                                  {itemStatus.label}
                                </p>
                                {item.remarks && (
                                  <p className="text-sm text-gray-600 mt-1">{item.remarks}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatDate(item.created_at)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-gov-blue/5 border border-gov-blue/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FiInfo className="text-gov-blue flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-gov-blue">
                    <p className="font-medium">Need more details?</p>
                    <p className="mt-1 text-gov-blue/80">
                      For complete information and to provide feedback, please{' '}
                      <Link to="/login" className="font-semibold underline hover:text-gov-blue">
                        login to your account
                      </Link>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Back to Home */}
          <div className="text-center mt-8">
            <Link 
              to="/" 
              className="inline-flex items-center text-gov-blue hover:text-gov-blue/80 transition-colors"
            >
              <FiArrowLeft className="mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackComplaint;

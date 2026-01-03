import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { complaintService } from '../../services/complaint.service';
import { 
  FiArrowLeft, FiMapPin, FiClock, FiCheck, FiX, FiLoader,
  FiFileText, FiTag, FiAlertCircle, FiStar, FiPhone, FiImage,
  FiTruck, FiDroplet, FiZap, FiTrash2, FiSun, FiActivity, FiHeart, FiHome, FiVolume2, FiClipboard
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import CitizenNav from '../../components/CitizenNav';

const ComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [complaint, setComplaint] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackData, setFeedbackData] = useState({ rating: 0, feedbackText: '' });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const statusConfig = complaintService.getStatusConfig();

  // Category icon mapping using Feather icons
  const getCategoryIcon = (category) => {
    const icons = {
      'Road & Infrastructure': <FiTruck size={24} />,
      'Water Supply': <FiDroplet size={24} />,
      'Electricity': <FiZap size={24} />,
      'Sanitation': <FiTrash2 size={24} />,
      'Street Lights': <FiSun size={24} />,
      'Drainage': <FiActivity size={24} />,
      'Public Health': <FiHeart size={24} />,
      'Encroachment': <FiHome size={24} />,
      'Noise Pollution': <FiVolume2 size={24} />,
      'Other': <FiClipboard size={24} />
    };
    return icons[category] || <FiFileText size={24} />;
  };

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  const fetchComplaintDetails = async () => {
    try {
      setLoading(true);
      const response = await complaintService.getById(id);
      setComplaint(response.complaint);
      setTimeline(response.timeline || []);
      setFeedback(response.feedback);
    } catch (error) {
      console.error('Error fetching complaint:', error);
      toast.error('Failed to load complaint details');
      navigate('/my-complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (feedbackData.rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmittingFeedback(true);
    try {
      await complaintService.submitFeedback(id, feedbackData);
      toast.success('Thank you for your feedback!');
      setShowFeedbackForm(false);
      fetchComplaintDetails();
    } catch (error) {
      toast.error('Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FiClock className="text-gov-blue" size={20} />;
      case 'in_progress': return <FiLoader className="text-gov-blue animate-spin" size={20} />;
      case 'resolved': return <FiCheck className="text-gov-blue" size={20} />;
      case 'rejected': return <FiX className="text-gov-red" size={20} />;
      default: return <FiClock className="text-gov-blue" size={20} />;
    }
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      low: 'bg-gray-100 text-gray-700',
      normal: 'bg-gov-blue/10 text-gov-blue',
      high: 'bg-gov-red/10 text-gov-red',
      urgent: 'bg-gov-red/20 text-gov-red'
    };
    const labels = { low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent' };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[priority] || styles.normal}`}>
        {labels[priority] || priority}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CitizenNav />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-10 h-10 border-4 border-gov-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CitizenNav />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-gray-500">Complaint not found</p>
          <button onClick={() => navigate('/my-complaints')} className="btn-primary mt-4">
            Back to My Complaints
          </button>
        </div>
      </div>
    );
  }

  const currentStatus = statusConfig[complaint.status] || statusConfig.pending;

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenNav />
      
      {/* Header */}
      <div 
        className="relative h-32 sm:h-36 overflow-hidden"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(30, 58, 95, 0.95), rgba(196, 30, 58, 0.85))',
        }}
      >
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <button 
              onClick={() => navigate('/my-complaints')}
              className="flex items-center text-white/80 hover:text-white mb-2 transition-colors"
            >
              <FiArrowLeft className="mr-2" />
              Back to My Complaints
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Complaint Details</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            {/* Status Card */}
            <div className={`rounded-xl border-2 p-4 sm:p-6 ${
              complaint.status === 'rejected' ? 'border-gov-red/30 bg-gov-red/5' :
              'border-gov-blue/30 bg-gov-blue/5'
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(complaint.status)}
                  <div>
                    <p className="text-sm text-gray-600">Current Status</p>
                    <p className={`font-bold text-lg ${currentStatus.textColor}`}>
                      {currentStatus.label}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Tracking ID</p>
                  <p className="font-mono font-bold text-gov-blue">{complaint.tracking_id}</p>
                </div>
              </div>
              
              {complaint.daysSinceCreation !== undefined && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Days since submission:</span>
                    <span className="font-semibold">{complaint.daysSinceCreation} days</span>
                  </div>
                  {complaint.estimated_resolution_days && (
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-600">Expected resolution:</span>
                      <span className="font-semibold">{complaint.estimated_resolution_days} days</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Complaint Details Card */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gov-blue px-4 sm:px-6 py-3">
                <h2 className="text-white font-semibold">Complaint Information</h2>
              </div>
              
              <div className="p-4 sm:p-6 space-y-4">
                {/* Title & Category */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-gov-blue">{getCategoryIcon(complaint.category)}</span>
                    <span className="bg-gov-blue/10 text-gov-blue px-3 py-1 rounded-full text-sm font-medium">
                      {complaint.category}
                    </span>
                    {complaint.priority && getPriorityBadge(complaint.priority)}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gov-blue">{complaint.title}</h3>
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

                {/* Description */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Description</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{complaint.description}</p>
                </div>

                {/* Images */}
                {(complaint.image_url || complaint.image_url_2 || complaint.image_url_3) && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Attached Photos</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[complaint.image_url, complaint.image_url_2, complaint.image_url_3]
                        .filter(Boolean)
                        .map((url, idx) => (
                          <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                            <img 
                              src={url} 
                              alt={`Complaint photo ${idx + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-gray-200 hover:border-gov-blue transition-colors"
                            />
                          </a>
                        ))}
                    </div>
                  </div>
                )}

                {/* Admin Remarks */}
                {complaint.admin_remarks && (
                  <div className="p-4 bg-gov-blue/5 rounded-lg border border-gov-blue/20">
                    <p className="text-xs text-gov-blue uppercase tracking-wide mb-1 font-medium">
                      Admin Remarks
                    </p>
                    <p className="text-gov-blue/80">{complaint.admin_remarks}</p>
                  </div>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 pt-4 border-t">
                  <div className="flex items-center space-x-1">
                    <FiClock size={14} />
                    <span>Submitted: {formatDate(complaint.created_at)}</span>
                  </div>
                  {complaint.updated_at && complaint.updated_at !== complaint.created_at && (
                    <div className="flex items-center space-x-1">
                      <FiClock size={14} />
                      <span>Updated: {formatDate(complaint.updated_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Feedback Section - Only for resolved complaints */}
            {complaint.status === 'resolved' && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                <h3 className="font-semibold text-gov-blue mb-4 flex items-center space-x-2">
                  <FiStar size={18} />
                  <span>Your Feedback</span>
                </h3>
                
                {feedback ? (
                  <div className="bg-gov-blue/5 rounded-lg p-4">
                    <div className="flex items-center space-x-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FiStar 
                          key={star}
                          size={20}
                          className={star <= feedback.rating ? 'fill-gov-blue text-gov-blue' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    {feedback.feedback_text && (
                      <p className="text-gray-700">{feedback.feedback_text}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Submitted on {formatDate(feedback.submitted_at)}
                    </p>
                  </div>
                ) : showFeedbackForm ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Rate your experience:</p>
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFeedbackData(prev => ({ ...prev, rating: star }))}
                            className="focus:outline-none"
                          >
                            <FiStar 
                              size={28}
                              className={`transition-colors ${
                                star <= feedbackData.rating 
                                  ? 'fill-gov-blue text-gov-blue' 
                                  : 'text-gray-300 hover:text-gov-blue'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <textarea
                        value={feedbackData.feedbackText}
                        onChange={(e) => setFeedbackData(prev => ({ ...prev, feedbackText: e.target.value }))}
                        placeholder="Share your experience (optional)"
                        className="input-field min-h-[80px]"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowFeedbackForm(false)}
                        className="btn-secondary text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitFeedback}
                        disabled={submittingFeedback || feedbackData.rating === 0}
                        className="btn-primary text-sm disabled:opacity-50"
                      >
                        {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowFeedbackForm(true)}
                    className="btn-primary"
                  >
                    <FiStar className="mr-2" />
                    Rate Resolution
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Timeline Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-4">
              <div className="bg-gov-blue px-4 py-3">
                <h2 className="text-white font-semibold">Status Timeline</h2>
              </div>
              
              <div className="p-4">
                {timeline.length > 0 ? (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200"></div>
                    
                    <div className="space-y-6">
                      {timeline.map((item, index) => {
                        const isLatest = index === timeline.length - 1;
                        const itemStatus = statusConfig[item.status] || statusConfig.pending;
                        
                        return (
                          <div key={item.id || index} className="relative flex items-start">
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
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FiClock size={32} className="mx-auto mb-2 text-gray-300" />
                    <p>No timeline available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetail;

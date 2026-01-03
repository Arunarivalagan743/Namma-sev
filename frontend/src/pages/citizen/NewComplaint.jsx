import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintService } from '../../services/complaint.service';
import { FiSend, FiMapPin, FiFileText, FiTag } from 'react-icons/fi';
import toast from 'react-hot-toast';
import CitizenNav from '../../components/CitizenNav';
import { useTranslation } from '../../context/TranslationContext';

const NewComplaint = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: ''
  });

  const categories = complaintService.getCategories();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const response = await complaintService.create(formData);
      toast.success(`Complaint submitted! Tracking ID: ${response.complaint.trackingId}`);
      navigate('/my-complaints');
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error(error.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenNav />
      
      {/* Header with Background Image */}
      <div 
        className="relative h-32 sm:h-40 md:h-48 overflow-hidden"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(30, 58, 95, 0.9), rgba(196, 30, 58, 0.8)), url(https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1600&h=400&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-white">{t('fileComplaint')}</h1>
            <p className="text-white/80 mt-1.5 sm:mt-2 text-sm sm:text-base">{t('panchayatName')}</p>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="max-w-2xl mx-auto">

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gov-blue mb-1.5 sm:mb-2">
              <span className="flex items-center space-x-2">
                <FiFileText size={16} />
                <span>{t('issueTitle')} *</span>
              </span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Brief title describing the issue"
              className="input-field text-sm sm:text-base"
              maxLength={200}
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              {formData.title.length}/200 characters
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gov-blue mb-1.5 sm:mb-2">
              <span className="flex items-center space-x-2">
                <FiTag size={16} />
                <span>{t('category')} *</span>
              </span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input-field text-sm sm:text-base"
              required
            >
              <option value="">{t('selectCategory')}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gov-blue mb-1.5 sm:mb-2">
              <span className="flex items-center space-x-2">
                <FiMapPin size={16} />
                <span>{t('location')}</span>
              </span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Street/Area/Landmark where the issue is located"
              className="input-field text-sm sm:text-base"
              maxLength={255}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gov-blue mb-1.5 sm:mb-2">
              {t('detailedDescription')} *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Please provide detailed information about the issue. Include:
- What is the problem?
- When did you first notice it?
- How is it affecting the community?
- Any additional details that might help resolve the issue"
              className="input-field min-h-[140px] sm:min-h-[180px] text-sm sm:text-base"
              required
            />
          </div>

          {/* Guidelines */}
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 sm:p-4">
            <h4 className="font-medium text-gray-800 mb-2 text-sm sm:text-base">Guidelines for submitting complaints:</h4>
            <ul className="text-xs sm:text-sm text-gray-700 space-y-1">
              <li>• Be specific and provide accurate location details</li>
              <li>• Describe the issue clearly and concisely</li>
              <li>• One complaint per issue for efficient tracking</li>
              <li>• Avoid duplicate complaints for the same issue</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary w-full sm:w-auto"
              disabled={loading}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FiSend size={18} />
                  <span>{t('submitComplaint')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
        </div>
      </div>
    </div>
  );
};

export default NewComplaint;

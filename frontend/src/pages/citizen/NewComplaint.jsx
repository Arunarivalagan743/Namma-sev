import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintService } from '../../services/complaint.service';
import { FiSend, FiMapPin, FiFileText, FiTag, FiAlertCircle, FiImage, FiPhone, FiInfo, FiTruck, FiDroplet, FiZap, FiTrash2, FiSun, FiActivity, FiHeart, FiHome, FiVolume2, FiClipboard } from 'react-icons/fi';
import toast from 'react-hot-toast';
import CitizenNav from '../../components/CitizenNav';
import ImageUpload from '../../components/ImageUpload';
import { useTranslation } from '../../context/TranslationContext';
import TranslatedText from '../../components/TranslatedText';

const NewComplaint = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [wards, setWards] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    priority: 'normal',
    wardNumber: '',
    contactPhone: '',
    imageUrls: []
  });

  const categories = complaintService.getCategories();
  const priorities = complaintService.getPriorities();

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

  useEffect(() => {
    // Load wards for Tirupur
    setWards([
      { id: 'W01', name: 'Ward 1 - Avinashi Road' },
      { id: 'W02', name: 'Ward 2 - Kumaran Road' },
      { id: 'W03', name: 'Ward 3 - Palladam Road' },
      { id: 'W04', name: 'Ward 4 - Dharapuram Road' },
      { id: 'W05', name: 'Ward 5 - Kangeyam Road' },
      { id: 'W06', name: 'Ward 6 - Mangalam Road' },
      { id: 'W07', name: 'Ward 7 - Kongu Main Road' },
      { id: 'W08', name: 'Ward 8 - Veerapandi' },
      { id: 'W09', name: 'Ward 9 - Nallur' },
      { id: 'W10', name: 'Ward 10 - Angeripalayam' },
      { id: 'W11', name: 'Ward 11 - Iduvampalayam' },
      { id: 'W12', name: 'Ward 12 - Perumanallur' }
    ]);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImagesChange = (urls) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: urls
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.title.length < 10) {
      toast.error('Title should be at least 10 characters');
      return;
    }

    if (formData.description.length < 30) {
      toast.error('Description should be at least 30 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await complaintService.create(formData);
      toast.success(
        <div>
          <p className="font-semibold">Complaint submitted!</p>
          <p className="text-sm mt-1">Tracking ID: <span className="font-mono font-bold">{response.complaint.trackingId}</span></p>
        </div>,
        { duration: 6000 }
      );
      navigate('/my-complaints');
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error(error.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityStyle = (priority) => {
    const styles = {
      low: 'border-gray-300 bg-gray-50',
      normal: 'border-gov-blue/50 bg-gov-blue/5',
      high: 'border-gov-red/50 bg-gov-red/5',
      urgent: 'border-gov-red bg-gov-red/10'
    };
    return styles[priority] || styles.normal;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenNav />
      
      {/* Header with Background Image */}
      <div 
        className="relative h-36 sm:h-44 md:h-52 overflow-hidden"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(30, 58, 95, 0.95), rgba(196, 30, 58, 0.85)), url(https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1600&h=400&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-white">{t('fileComplaint')}</h1>
            <p className="text-white/80 mt-1.5 sm:mt-2 text-sm sm:text-base">{t('panchayatName')}</p>
            <p className="text-white/60 mt-1 text-xs sm:text-sm"><TranslatedText text="For Verified Residents Only" /></p>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="max-w-3xl mx-auto">
          
          {/* Info Banner */}
          <div className="bg-gov-blue/5 border border-gov-blue/20 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start space-x-3">
              <FiInfo className="text-gov-blue flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-medium text-gov-blue text-sm sm:text-base"><TranslatedText text="Important Information" /></h4>
                <p className="text-gov-blue/80 text-xs sm:text-sm mt-1">
                  <TranslatedText text="After submission, you'll receive a Tracking ID to monitor your complaint status. Share this ID with family members to track without logging in." />
                </p>
              </div>
            </div>
          </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gov-blue px-4 sm:px-6 py-3 sm:py-4">
          <h2 className="text-white font-semibold text-base sm:text-lg"><TranslatedText text="Complaint Details" /></h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 sm:space-y-6">
          
          {/* Category Selection with Icons */}
          <div>
            <label className="block text-sm font-medium text-gov-blue mb-2 sm:mb-3">
              <span className="flex items-center space-x-2">
                <FiTag size={16} />
                <span>{t('selectCategory')} *</span>
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                  className={`p-2 sm:p-3 rounded-lg border-2 text-center transition-all ${
                    formData.category === cat 
                      ? 'border-gov-blue bg-gov-blue/5 text-gov-blue' 
                      : 'border-gray-200 hover:border-gov-blue/30 text-gray-700'
                  }`}
                >
                  <span className={`block mb-1 ${formData.category === cat ? 'text-gov-blue' : 'text-gray-500'}`}>
                    {getCategoryIcon(cat)}
                  </span>
                  <span className="text-xs sm:text-sm font-medium leading-tight block"><TranslatedText text={cat} /></span>
                </button>
              ))}
            </div>
          </div>

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
              placeholder={t('issueTitle')}
              className="input-field text-sm sm:text-base"
              maxLength={200}
              required
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-400"><TranslatedText text="Be specific (min 10 chars)" /></p>
              <p className="text-xs text-gray-400">{formData.title.length}/200</p>
            </div>
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-sm font-medium text-gov-blue mb-2">
              <span className="flex items-center space-x-2">
                <FiAlertCircle size={16} />
                <span>{t('priority')}</span>
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, priority: p.value }))}
                  className={`p-2 sm:p-3 rounded-lg border-2 transition-all ${
                    formData.priority === p.value 
                      ? getPriorityStyle(p.value) + ' ring-2 ring-offset-1' 
                      : 'border-gray-200 hover:border-gov-blue/30'
                  } ${
                    p.value === 'urgent' ? 'ring-gov-red' : 
                    p.value === 'high' ? 'ring-gov-red/70' : 'ring-gov-blue'
                  }`}
                >
                  <span className={`font-semibold text-xs sm:text-sm ${
                    p.value === 'urgent' || p.value === 'high' ? 'text-gov-red' : 
                    formData.priority === p.value ? 'text-gov-blue' : 'text-gray-700'
                  }`}><TranslatedText text={p.label} /></span>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 hidden sm:block"><TranslatedText text={p.description} /></p>
                </button>
              ))}
            </div>
          </div>

          {/* Ward and Phone Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gov-blue mb-1.5 sm:mb-2">
                <TranslatedText text="Ward Number" />
              </label>
              <select
                name="wardNumber"
                value={formData.wardNumber}
                onChange={handleChange}
                className="input-field text-sm sm:text-base"
              >
                <option value="">{t('selectCategory')}</option>
                {wards.map((ward) => (
                  <option key={ward.id} value={ward.id}>{ward.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gov-blue mb-1.5 sm:mb-2">
                <span className="flex items-center space-x-2">
                  <FiPhone size={16} />
                  <span><TranslatedText text="Alternate Contact" /></span>
                </span>
              </label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder={t('phoneNumber')}
                className="input-field text-sm sm:text-base"
                maxLength={15}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gov-blue mb-1.5 sm:mb-2">
              <span className="flex items-center space-x-2">
                <FiMapPin size={16} />
                <span>{t('location')} *</span>
              </span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder={t('location')}
              className="input-field text-sm sm:text-base"
              maxLength={255}
              required
            />
            <p className="text-xs text-gray-400 mt-1"><TranslatedText text="Include street name, landmark, and area" /></p>
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
              placeholder={t('detailedDescription')}
              className="input-field min-h-[140px] sm:min-h-[180px] text-sm sm:text-base"
              required
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-400"><TranslatedText text="Minimum 30 characters" /></p>
              <p className="text-xs text-gray-400">{formData.description.length} chars</p>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gov-blue mb-2">
              <span className="flex items-center space-x-2">
                <FiImage size={16} />
                <span>{t('attachments')}</span>
              </span>
            </label>
            <ImageUpload 
              onImagesChange={handleImagesChange}
              maxImages={3}
              currentImages={formData.imageUrls}
            />
            <p className="text-xs text-gray-400 mt-2">
              <TranslatedText text="Upload up to 3 photos to help identify the issue" />
            </p>
          </div>

          {/* Guidelines */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
            <h4 className="font-medium text-amber-800 mb-2 text-sm sm:text-base flex items-center space-x-2">
              <FiAlertCircle size={16} />
              <span><TranslatedText text="Guidelines" /></span>
            </h4>
            <ul className="text-xs sm:text-sm text-amber-700 space-y-1">
              <li>• <TranslatedText text="Be specific and provide accurate location details" /></li>
              <li>• <TranslatedText text="Upload clear photos if possible" /></li>
              <li>• <TranslatedText text="One complaint per issue for efficient tracking" /></li>
              <li>• <TranslatedText text="Use appropriate priority (urgent for safety issues)" /></li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-4 pt-4 border-t border-gray-200">
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
              disabled={loading || !formData.category || !formData.title || !formData.description || !formData.location}
              className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
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

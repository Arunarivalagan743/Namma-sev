import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import CitizenNav from '../../components/CitizenNav';
import { useTranslation } from '../../context/TranslationContext';

const Profile = () => {
  const { t } = useTranslation();
  const { userProfile, fetchUserProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    phone: userProfile?.phone || '',
    address: userProfile?.address || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.address) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      await api.put('/users/profile', formData);
      await fetchUserProfile();
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: userProfile?.name || '',
      phone: userProfile?.phone || '',
      address: userProfile?.address || ''
    });
    setEditing(false);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenNav />
      
      {/* Profile Header with Background Image */}
      <div 
        className="relative h-32 sm:h-40 md:h-48 overflow-hidden"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(30, 58, 95, 0.9), rgba(196, 30, 58, 0.8)), url(https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1600&h=400&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-14 h-14 sm:w-16 md:w-20 sm:h-16 md:h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <FiUser className="w-7 h-7 sm:w-8 md:w-10 sm:h-8 md:h-10 text-[#1e3a5f]" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-white">{userProfile?.name || t('profile')}</h1>
            <p className="text-white/80 mt-1 text-sm sm:text-base">{t('panchayatName')}</p>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="max-w-2xl mx-auto">

      {/* Profile Card */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gov-blue rounded-t-lg">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-12 h-12 sm:w-14 md:w-16 sm:h-14 md:h-16 bg-gov-gold rounded-full flex items-center justify-center flex-shrink-0">
              <FiUser className="text-gov-blue" size={24} />
            </div>
            <div className="text-white min-w-0">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold truncate">{userProfile?.name}</h2>
              <p className="text-gray-300 text-sm sm:text-base">Panchayat Resident</p>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="p-4 sm:p-6">
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gov-blue mb-1.5 sm:mb-2">
                  {t('fullName')} *
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field pl-10 text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gov-blue mb-1.5 sm:mb-2">
                  {t('phoneNumber')} *
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange({
                      target: {
                        name: 'phone',
                        value: e.target.value.replace(/\D/g, '').slice(0, 10)
                      }
                    })}
                    className="input-field pl-10 text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gov-blue mb-1.5 sm:mb-2">
                  {t('addressField')} *
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="input-field pl-10 min-h-[70px] sm:min-h-[80px] text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-secondary flex items-center justify-center space-x-2 w-full sm:w-auto order-2 sm:order-1"
                  disabled={loading}
                >
                  <FiX size={18} />
                  <span>{t('cancel')}</span>
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto order-1 sm:order-2"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiSave size={18} />
                      <span>{t('saveChanges')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {/* Email */}
              <div className="flex items-start space-x-3">
                <FiMail className="text-gray-400 mt-1 flex-shrink-0" size={18} />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500">{t('emailAddress')}</p>
                  <p className="font-medium text-gov-blue text-sm sm:text-base truncate">{userProfile?.email}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start space-x-3">
                <FiPhone className="text-gray-400 mt-1 flex-shrink-0" size={18} />
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">{t('phoneNumber')}</p>
                  <p className="font-medium text-gov-blue text-sm sm:text-base">{userProfile?.phone}</p>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start space-x-3">
                <FiMapPin className="text-gray-400 mt-1 flex-shrink-0" size={18} />
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">{t('addressField')}</p>
                  <p className="font-medium text-gov-blue text-sm sm:text-base">{userProfile?.address}</p>
                </div>
              </div>

              {/* Panchayat Info */}
              <div className="pt-3 sm:pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Panchayat Code</p>
                    <p className="font-medium text-gov-blue text-sm sm:text-base">{userProfile?.panchayat_code || 'TIRU001'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Member Since</p>
                    <p className="font-medium text-gov-blue text-sm sm:text-base">{formatDate(userProfile?.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <div className="pt-3 sm:pt-4">
                <button
                  onClick={() => setEditing(true)}
                  className="btn-secondary flex items-center justify-center space-x-2 w-full sm:w-auto"
                >
                  <FiEdit2 size={18} />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

          {/* Account Status */}
          <div className="mt-4 sm:mt-6 bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h3 className="font-semibold text-gov-blue mb-3 sm:mb-4 text-sm sm:text-base">Account Status</h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium w-fit ${
                userProfile?.status === 'approved' 
                  ? 'bg-gray-100 text-gray-800' 
                  : userProfile?.status === 'pending'
                  ? 'bg-gray-200 text-gray-700'
                  : 'bg-gray-300 text-gray-800'
              }`}>
                {userProfile?.status?.charAt(0).toUpperCase() + userProfile?.status?.slice(1) || 'Unknown'}
              </span>
              <span className="text-gray-500 text-xs sm:text-sm">
                {userProfile?.status === 'approved' 
                  ? 'Your account is verified and active'
                  : userProfile?.status === 'pending'
                  ? 'Waiting for admin approval'
                  : 'Please contact admin for assistance'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

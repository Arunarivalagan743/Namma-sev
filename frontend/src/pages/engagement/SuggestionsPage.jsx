import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import { useNavigate } from 'react-router-dom';
import CitizenNav from '../../components/CitizenNav';
import TranslatedText from '../../components/TranslatedText';
import ImageUpload from '../../components/ImageUpload';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SuggestionsPage = () => {
  const { currentUser, userProfile } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [userUpvotes, setUserUpvotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'development',
    location: '',
    image_url: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const categories = ['all', 'development', 'infrastructure', 'environment', 'education', 'health', 'other'];

  // Auto-refresh every 30 seconds for real-time suggestions
  useEffect(() => {
    fetchSuggestions();
    const interval = setInterval(() => {
      fetchSuggestions(true); // silent refresh
    }, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchSuggestions = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let url = '/engagement/suggestions';
      if (filter !== 'all') {
        url += `?category=${filter}`;
      }
      const response = await api.get(url);
      if (response.data.success) {
        setSuggestions(response.data.data || []);
        setUserUpvotes(response.data.userUpvotes || []);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      if (!silent) toast.error('Failed to load suggestions');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleUpvote = async (suggestionId) => {
    if (!currentUser) {
      toast.error('Please login to upvote');
      navigate('/login');
      return;
    }

    // Check if user is approved
    if (!userProfile || userProfile.status !== 'approved') {
      if (userProfile?.status === 'pending') {
        toast.error('Your account is pending approval. Please wait for admin to approve your registration.');
        navigate('/pending-approval', { replace: true });
      } else {
        toast.error('You need an approved account to upvote');
      }
      return;
    }

    try {
      const response = await api.post(`/engagement/suggestions/${suggestionId}/upvote`);
      if (response.data.success) {
        // Update local state immediately for better UX
        if (response.data.action === 'added') {
          setUserUpvotes(prev => [...prev, suggestionId]);
          toast.success('Thanks for your vote!');
        } else {
          setUserUpvotes(prev => prev.filter(id => id !== suggestionId));
          toast.success('Vote removed');
        }
        // Update suggestion upvotes count
        setSuggestions(prev => prev.map(s => 
          s.id === suggestionId ? { ...s, upvotes: response.data.upvotes } : s
        ));
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to upvote. Please try again.';
      toast.error(errorMessage);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Please login to submit a suggestion');
      navigate('/login');
      return;
    }

    // Check if user is approved
    if (!userProfile || userProfile.status !== 'approved') {
      if (userProfile?.status === 'pending') {
        toast.error('Your account is pending approval. Please wait for admin to approve your registration.');
        navigate('/pending-approval', { replace: true });
      } else {
        toast.error('You need an approved account to submit suggestions');
      }
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/engagement/suggestions', formData);
      if (response.data.success) {
        toast.success('Suggestion submitted successfully!');
        setShowForm(false);
        setFormData({ title: '', description: '', category: 'development', location: '', image_url: '' });
        fetchSuggestions();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to submit suggestion';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-700',
      under_review: 'bg-[#c41e3a]/10 text-[#c41e3a]',
      approved: 'bg-gray-100 text-gray-800',
      implemented: 'bg-[#1e3a5f]/10 text-[#1e3a5f]',
      rejected: 'bg-gray-300 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryColor = (category) => {
    const colors = {
      development: 'bg-[#1e3a5f]/10 text-[#1e3a5f]',
      infrastructure: 'bg-[#c41e3a]/10 text-[#c41e3a]',
      environment: 'bg-gray-100 text-gray-700',
      education: 'bg-[#1e3a5f]/10 text-[#1e3a5f]',
      health: 'bg-[#c41e3a]/10 text-[#c41e3a]',
      other: 'bg-gray-100 text-gray-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  // Category-specific default images for suggestions
  const getCategoryDefaultImage = (category) => {
    const categoryImages = {
      development: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=250&fit=crop', // Construction/development
      infrastructure: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=250&fit=crop', // Infrastructure
      environment: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=250&fit=crop', // Nature/environment
      education: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=250&fit=crop', // Education
      health: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=250&fit=crop', // Health
      other: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400&h=250&fit=crop' // General community
    };
    return categoryImages[category] || categoryImages.other;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenNav />
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-gray-800 mb-1 sm:mb-2">{t('communitySuggestions')}</h1>
            <p className="text-sm sm:text-base text-gray-600">{t('shareIdeasForDevelopment')}</p>
          </div>
          <button
            onClick={() => currentUser ? setShowForm(true) : navigate('/login')}
            className="bg-[#c41e3a] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-[#a01830] transition-colors font-medium flex items-center text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('addSuggestion')}
          </button>
        </div>

        {/* Submission Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg max-w-lg w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Share Your Idea</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Brief title for your suggestion"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent"
                  >
                    {categories.filter(c => c !== 'all').map(cat => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location (Optional)</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Specific location if applicable"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your idea in detail..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent"
                    required
                  />
                </div>

                <ImageUpload
                  label="Add Image (Optional)"
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  required={false}
                />

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-[#c41e3a] text-white py-2 rounded-lg hover:bg-[#a01830] transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Idea'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors capitalize ${
                filter === cat 
                  ? 'bg-[#c41e3a] text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Suggestions List */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-lg p-4 sm:p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : suggestions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {suggestions.map(suggestion => (
              <div key={suggestion.id} className="bg-white rounded-lg overflow-hidden transition-all shadow-sm">
                {/* Suggestion Image - show uploaded or category default */}
                <div className="relative">
                  <img 
                    src={suggestion.image_url || getCategoryDefaultImage(suggestion.category)} 
                    alt={suggestion.title}
                    className="w-full h-32 sm:h-36 md:h-40 object-cover"
                  />
                  {/* Maroon Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#c41e3a]/40 via-transparent to-transparent"></div>
                </div>
                <div className="p-3 sm:p-4 md:p-6">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${getCategoryColor(suggestion.category)}`}>
                      {suggestion.category}
                    </span>
                    <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium ${getStatusBadge(suggestion.status)}`}>
                      {suggestion.status?.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <TranslatedText text={suggestion.title} className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-1.5 sm:mb-2" as="h3" />
                  <TranslatedText text={suggestion.description} className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3" as="p" />
                  
                  {suggestion.location && (
                    <p className="text-gray-500 text-xs sm:text-sm mb-2 sm:mb-3 flex items-center">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {suggestion.location}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 sm:pt-4 border-t">
                    <span className="text-xs sm:text-sm text-gray-500">by {suggestion.user_name || 'Anonymous'}</span>
                    <button
                      onClick={() => handleUpvote(suggestion.id)}
                      className={`flex items-center space-x-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full transition-colors ${
                        userUpvotes.includes(suggestion.id)
                          ? 'bg-[#c41e3a] text-white hover:bg-[#a01830]'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                      title={userUpvotes.includes(suggestion.id) ? 'Click to remove your vote' : 'Click to upvote'}
                    >
                      <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${userUpvotes.includes(suggestion.id) ? 'text-white' : 'text-[#c41e3a]'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                      <span className="font-medium">{suggestion.upvotes || 0}</span>
                    </button>
                  </div>

                  {suggestion.admin_remarks && (
                    <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs sm:text-sm text-gray-700">
                        <span className="font-medium">Admin Response: </span>
                        <TranslatedText text={suggestion.admin_remarks} />
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 bg-white rounded-lg">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="text-base sm:text-lg font-medium text-gray-600 mb-1.5 sm:mb-2">No Suggestions Yet</h3>
            <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4">Be the first to share an idea for our community!</p>
            <button
              onClick={() => currentUser ? setShowForm(true) : navigate('/login')}
              className="bg-[#c41e3a] text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-[#a01830] transition-colors text-sm sm:text-base"
            >
              Share Your Idea
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuggestionsPage;

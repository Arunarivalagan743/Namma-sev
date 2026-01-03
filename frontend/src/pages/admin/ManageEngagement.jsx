import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ImageUpload from '../../components/ImageUpload';

const ManageEngagement = () => {
  const [activeTab, setActiveTab] = useState('news');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const tabs = [
    { id: 'news', label: 'News & Updates', icon: '📰' },
    { id: 'meetings', label: 'Gram Sabha', icon: '🏛️' },
    { id: 'schemes', label: 'Schemes', icon: '📋' },
    { id: 'events', label: 'Events', icon: '📅' },
    { id: 'works', label: 'Works', icon: '🏗️' },
    { id: 'polls', label: 'Polls', icon: '📊' },
    { id: 'alerts', label: 'Alerts', icon: '🚨' },
    { id: 'faqs', label: 'FAQs', icon: '❓' },
    { id: 'suggestions', label: 'Suggestions', icon: '💡' },
    { id: 'budget', label: 'Budget', icon: '💰' }
  ];

  // Auto-refresh every 30 seconds for real-time admin updates
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData(true); // silent refresh
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await api.get(`/engagement/${activeTab}`);
      if (response.data.success) {
        setData(response.data[activeTab] || response.data.data || []);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (!silent) toast.error('Failed to load data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditItem(null);
    setFormData(getDefaultFormData());
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/engagement/admin/${activeTab}/${id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required image for specific tabs (admin must provide image)
    const tabsRequiringImage = ['news', 'meetings', 'schemes', 'events', 'works', 'polls', 'alerts'];
    if (tabsRequiringImage.includes(activeTab) && !formData.image_url) {
      toast.error('Please upload an image before saving');
      return;
    }
    
    try {
      if (editItem) {
        await api.put(`/engagement/admin/${activeTab}/${editItem.id}`, formData);
        toast.success('Updated successfully');
      } else {
        await api.post(`/engagement/admin/${activeTab}`, formData);
        toast.success('Created successfully');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const getDefaultFormData = () => {
    switch (activeTab) {
      case 'news':
        return { title: '', content: '', category: 'general', is_featured: false, image_url: '' };
      case 'meetings':
        return { title: '', description: '', meeting_date: '', meeting_time: '', venue: '', agenda: '', image_url: '' };
      case 'schemes':
        return { name: '', description: '', category: 'central', eligibility: '', benefits: '', documents_required: '', application_link: '', image_url: '' };
      case 'events':
        return { title: '', description: '', event_type: 'cultural', event_date: '', start_time: '', end_time: '', venue: '', organizer: '', image_url: '' };
      case 'works':
        return { title: '', description: '', work_type: 'road', location: '', budget_amount: 0, contractor: '', start_date: '', expected_completion: '', status: 'planned', progress_percentage: 0, image_url: '' };
      case 'polls':
        return { question: '', description: '', end_date: '', options: ['', ''], image_url: '' };
      case 'alerts':
        return { title: '', message: '', severity: 'info', is_active: true, image_url: '' };
      case 'faqs':
        return { question: '', answer: '', category: 'general', image_url: '' };
      case 'suggestions':
        return {};
      case 'budget':
        return { category_id: '', allocated: 0, spent: 0, fiscal_year: new Date().getFullYear().toString() };
      default:
        return {};
    }
  };

  const renderForm = () => {
    switch (activeTab) {
      case 'news':
        return (
          <>
            <ImageUpload
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              required={true}
              label="News Image"
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={formData.category || 'general'} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="general">General</option>
                <option value="announcement">Announcement</option>
                <option value="development">Development</option>
                <option value="event">Event</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea value={formData.content || ''} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={4} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div className="mb-4">
              <label className="flex items-center">
                <input type="checkbox" checked={formData.is_featured || false} onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })} className="mr-2" />
                <span className="text-sm">Featured on Homepage</span>
              </label>
            </div>
          </>
        );

      case 'meetings':
        return (
          <>
            <ImageUpload
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              required={true}
              label="Meeting Banner"
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={formData.meeting_date?.split('T')[0] || ''} onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input type="time" value={formData.meeting_time || ''} onChange={(e) => setFormData({ ...formData, meeting_time: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <input type="text" value={formData.venue || ''} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Agenda</label>
              <textarea value={formData.agenda || ''} onChange={(e) => setFormData({ ...formData, agenda: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" placeholder="Enter agenda items..." />
            </div>
          </>
        );

      case 'schemes':
        return (
          <>
            <ImageUpload
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              required={true}
              label="Scheme Banner"
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheme Name</label>
              <input type="text" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={formData.category || 'central'} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="central">Central Government</option>
                <option value="state">State Government</option>
                <option value="local">Local Panchayat</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility</label>
              <textarea value={formData.eligibility || ''} onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Benefits</label>
              <textarea value={formData.benefits || ''} onChange={(e) => setFormData({ ...formData, benefits: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Documents Required</label>
              <textarea value={formData.documents_required || ''} onChange={(e) => setFormData({ ...formData, documents_required: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Application Link</label>
              <input type="url" value={formData.application_link || ''} onChange={(e) => setFormData({ ...formData, application_link: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </>
        );

      case 'events':
        return (
          <>
            <ImageUpload
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              required={true}
              label="Event Poster"
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
              <input type="text" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
              <select value={formData.event_type || 'cultural'} onChange={(e) => setFormData({ ...formData, event_type: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="cultural">Cultural</option>
                <option value="sports">Sports</option>
                <option value="health">Health Camp</option>
                <option value="educational">Educational</option>
                <option value="religious">Religious</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={formData.event_date?.split('T')[0] || ''} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input type="time" value={formData.start_time || ''} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input type="time" value={formData.end_time || ''} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <input type="text" value={formData.venue || ''} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Organizer</label>
              <input type="text" value={formData.organizer || ''} onChange={(e) => setFormData({ ...formData, organizer: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </>
        );

      case 'works':
        return (
          <>
            <ImageUpload
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              required={true}
              label="Work Photo"
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Title</label>
              <input type="text" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Type</label>
                <select value={formData.work_type || 'road'} onChange={(e) => setFormData({ ...formData, work_type: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="road">Road</option>
                  <option value="water">Water Supply</option>
                  <option value="sanitation">Sanitation</option>
                  <option value="electricity">Electricity</option>
                  <option value="building">Building</option>
                  <option value="park">Park/Garden</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={formData.status || 'planned'} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" value={formData.location || ''} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget Amount (₹)</label>
                <input type="number" value={formData.budget_amount || 0} onChange={(e) => setFormData({ ...formData, budget_amount: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contractor</label>
                <input type="text" value={formData.contractor || ''} onChange={(e) => setFormData({ ...formData, contractor: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" value={formData.start_date?.split('T')[0] || ''} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Completion</label>
                <input type="date" value={formData.expected_completion?.split('T')[0] || ''} onChange={(e) => setFormData({ ...formData, expected_completion: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Progress: {formData.progress_percentage || 0}%</label>
              <input type="range" min="0" max="100" value={formData.progress_percentage || 0} onChange={(e) => setFormData({ ...formData, progress_percentage: parseInt(e.target.value) })} className="w-full" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </>
        );

      case 'polls':
        return (
          <>
            <ImageUpload
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              required={true}
              label="Poll Image"
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
              <input type="text" value={formData.question || ''} onChange={(e) => setFormData({ ...formData, question: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" value={formData.end_date?.split('T')[0] || ''} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
              {(formData.options || ['', '']).map((opt, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input type="text" value={opt} onChange={(e) => {
                    const newOptions = [...(formData.options || ['', ''])];
                    newOptions[idx] = e.target.value;
                    setFormData({ ...formData, options: newOptions });
                  }} className="flex-1 px-3 py-2 border rounded-lg" placeholder={`Option ${idx + 1}`} />
                  {idx > 1 && (
                    <button type="button" onClick={() => {
                      const newOptions = formData.options.filter((_, i) => i !== idx);
                      setFormData({ ...formData, options: newOptions });
                    }} className="px-3 py-2 bg-red-100 text-red-600 rounded-lg">×</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setFormData({ ...formData, options: [...(formData.options || ['', '']), ''] })} className="text-blue-600 text-sm">+ Add Option</button>
            </div>
          </>
        );

      case 'alerts':
        return (
          <>
            <ImageUpload
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              required={true}
              label="Alert Image"
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select value={formData.severity || 'info'} onChange={(e) => setFormData({ ...formData, severity: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="danger">Danger</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea value={formData.message || ''} onChange={(e) => setFormData({ ...formData, message: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div className="mb-4">
              <label className="flex items-center">
                <input type="checkbox" checked={formData.is_active !== false} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="mr-2" />
                <span className="text-sm">Active</span>
              </label>
            </div>
          </>
        );

      case 'faqs':
        return (
          <>
            <ImageUpload
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              required={false}
              label="FAQ Image (Optional)"
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={formData.category || 'general'} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="general">General</option>
                <option value="services">Services</option>
                <option value="documents">Documents</option>
                <option value="complaints">Complaints</option>
                <option value="taxes">Taxes</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
              <input type="text" value={formData.question || ''} onChange={(e) => setFormData({ ...formData, question: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
              <textarea value={formData.answer || ''} onChange={(e) => setFormData({ ...formData, answer: e.target.value })} rows={4} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
          </>
        );

      case 'suggestions':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={formData.status || 'pending'} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="implemented">Implemented</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Remarks</label>
              <textarea value={formData.admin_remarks || ''} onChange={(e) => setFormData({ ...formData, admin_remarks: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </>
        );

      case 'budget':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year</label>
              <select value={formData.fiscal_year || new Date().getFullYear().toString()} onChange={(e) => setFormData({ ...formData, fiscal_year: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="2026">2026-27</option>
                <option value="2025">2025-26</option>
                <option value="2024">2024-25</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={formData.category_id || ''} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="1">Infrastructure</option>
                <option value="2">Education</option>
                <option value="3">Healthcare</option>
                <option value="4">Sanitation</option>
                <option value="5">Street Lighting</option>
                <option value="6">Agriculture</option>
                <option value="7">Social Welfare</option>
                <option value="8">Administration</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allocated (₹)</label>
                <input type="number" value={formData.allocated || 0} onChange={(e) => setFormData({ ...formData, allocated: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Spent (₹)</label>
                <input type="number" value={formData.spent || 0} onChange={(e) => setFormData({ ...formData, spent: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const renderTable = () => {
    if (loading) {
      return (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-200 rounded"></div>)}
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p>No {activeTab} found. Click "Add New" to create one.</p>
        </div>
      );
    }

    const getColumns = () => {
      switch (activeTab) {
        case 'news': return ['title', 'category', 'is_featured', 'created_at'];
        case 'meetings': return ['title', 'meeting_date', 'venue', 'status'];
        case 'schemes': return ['name', 'category', 'is_active'];
        case 'events': return ['title', 'event_type', 'event_date', 'venue'];
        case 'works': return ['title', 'work_type', 'status', 'progress_percentage'];
        case 'polls': return ['question', 'end_date', 'is_active'];
        case 'alerts': return ['title', 'severity', 'is_active'];
        case 'faqs': return ['question', 'category'];
        case 'suggestions': return ['title', 'category', 'status', 'upvotes'];
        case 'budget': return ['name', 'allocated', 'spent'];
        default: return [];
      }
    };

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {getColumns().map(col => (
                <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {col.replace(/_/g, ' ')}
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                {getColumns().map(col => (
                  <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {col === 'is_featured' || col === 'is_active' ? (
                      <span className={`px-2 py-1 rounded-full text-xs ${item[col] ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {item[col] ? 'Yes' : 'No'}
                      </span>
                    ) : col === 'status' ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 capitalize">
                        {item[col]?.replace(/_/g, ' ')}
                      </span>
                    ) : col === 'progress_percentage' ? (
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${item[col]}%` }}></div>
                        </div>
                        <span>{item[col]}%</span>
                      </div>
                    ) : col === 'allocated' || col === 'spent' ? (
                      `₹${(item[col] || 0).toLocaleString('en-IN')}`
                    ) : col.includes('date') ? (
                      new Date(item[col]).toLocaleDateString('en-IN')
                    ) : (
                      String(item[col] || '-').substring(0, 50)
                    )}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                  {activeTab !== 'suggestions' && activeTab !== 'budget' && (
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Manage Engagement Content</h1>
        {activeTab !== 'suggestions' && (
          <button onClick={handleAdd} className="bg-[#c41e3a] text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-[#a01830] flex items-center text-sm sm:text-base w-full sm:w-auto justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-4 sm:mb-6 border-b overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
        <div className="flex space-x-0.5 sm:space-x-1 min-w-max pb-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#1e3a5f] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="mr-1 sm:mr-2">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6">
        {renderTable()}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-lg sm:text-xl font-bold">{editItem ? 'Edit' : 'Add New'} {tabs.find(t => t.id === activeTab)?.label}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6">
              {renderForm()}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50 text-sm sm:text-base">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-[#1e3a5f] text-white py-2 rounded-lg hover:bg-[#2a4a6f] text-sm sm:text-base">
                  {editItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageEngagement;

import { useState, useEffect } from 'react';
import { announcementService } from '../../services/announcement.service';
import ImageUpload from '../../components/ImageUpload';
import { 
  FiBell, 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiX,
  FiCalendar,
  FiImage
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const ManageAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    image_url: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await announcementService.getAll({ limit: 50 });
      setAnnouncements(response.announcements || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        await announcementService.update(editing.id, formData);
        toast.success('Announcement updated');
      } else {
        await announcementService.create(formData);
        toast.success('Announcement created');
      }
      closeModal();
      fetchAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error('Failed to save announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      await announcementService.delete(id);
      toast.success('Announcement deleted');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  const openModal = (announcement = null) => {
    if (announcement) {
      setEditing(announcement);
      setFormData({
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        image_url: announcement.image_url || ''
      });
    } else {
      setEditing(null);
      setFormData({ title: '', content: '', priority: 'normal', image_url: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setFormData({ title: '', content: '', priority: 'normal', image_url: '' });
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

  const getPriorityBadge = (priority) => {
    const styles = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      normal: 'bg-blue-100 text-blue-800',
      low: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="section-title text-xl sm:text-2xl">Manage Announcements</h1>
          <p className="text-sm sm:text-base text-gray-600">Create and manage public announcements</p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center justify-center space-x-2 text-sm sm:text-base"
        >
          <FiPlus size={16} />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Announcements List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-48 sm:h-64">
            <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-gov-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : announcements.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4">
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                      <FiBell className="text-gov-gold flex-shrink-0" size={18} />
                      <h3 className="font-semibold text-gov-blue text-sm sm:text-base">{announcement.title}</h3>
                      {getPriorityBadge(announcement.priority)}
                    </div>
                    <p className="text-gray-600 text-xs sm:text-sm mt-2 sm:mt-3 ml-6 sm:ml-8 whitespace-pre-wrap line-clamp-3 sm:line-clamp-none">
                      {announcement.content}
                    </p>
                    <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3 ml-6 sm:ml-8">
                      <FiCalendar size={12} />
                      <span>{formatDate(announcement.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 sm:space-x-2 ml-6 sm:ml-8 lg:ml-0">
                    <button
                      onClick={() => openModal(announcement)}
                      className="p-1.5 sm:p-2 text-gov-blue hover:bg-gov-blue hover:bg-opacity-10 rounded transition-colors"
                      title="Edit"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 sm:p-12 text-center text-gray-500">
            <FiBell size={40} className="mx-auto mb-3 sm:mb-4 text-gray-300" />
            <p className="text-base sm:text-lg">No announcements yet</p>
            <button
              onClick={() => openModal()}
              className="text-gov-blue hover:underline mt-1.5 sm:mt-2 text-sm sm:text-base"
            >
              Create your first announcement
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gov-blue text-sm sm:text-base">
                {editing ? 'Edit Announcement' : 'New Announcement'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gov-blue mb-1.5 sm:mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="input-field text-sm sm:text-base"
                  placeholder="Announcement title"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gov-blue mb-1.5 sm:mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="input-field text-sm sm:text-base"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gov-blue mb-1.5 sm:mb-2">
                  Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="input-field min-h-[120px] sm:min-h-[150px] text-sm sm:text-base"
                  placeholder="Write your announcement content here..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gov-blue mb-1.5 sm:mb-2">
                  <FiImage className="inline mr-1" /> Image (Optional)
                </label>
                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                  folder="announcements"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 sm:space-x-3 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex items-center space-x-2 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
                >
                  {submitting ? (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{editing ? 'Update' : 'Create'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAnnouncements;

const { Announcement } = require('../models');
const { v4: uuidv4 } = require('uuid');

/**
 * Get all announcements
 */
const getAnnouncements = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const announcements = await Announcement.find({ isActive: true })
      .select('_id title content priority createdAt updatedAt')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Announcement.countDocuments({ isActive: true });

    // Transform to match expected format
    const formattedAnnouncements = announcements.map(announcement => ({
      id: announcement._id,
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      created_at: announcement.createdAt,
      updated_at: announcement.updatedAt
    }));

    res.json({
      announcements: formattedAnnouncements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Failed to get announcements' });
  }
};

/**
 * Get single announcement
 */
const getAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findOne({ 
      _id: id, 
      isActive: true 
    }).lean();

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json({
      announcement: {
        id: announcement._id,
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        created_at: announcement.createdAt,
        updated_at: announcement.updatedAt
      }
    });

  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({ error: 'Failed to get announcement' });
  }
};

/**
 * Create announcement (Admin only)
 */
const createAnnouncement = async (req, res) => {
  try {
    const { title, content, priority = 'normal', image_url } = req.body;

    if (!title || !content) {
      return res.status(400).json({ 
        error: 'Title and content are required' 
      });
    }

    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ 
        error: 'Invalid priority',
        validPriorities 
      });
    }

    const announcementId = uuidv4();

    const newAnnouncement = new Announcement({
      _id: announcementId,
      title,
      content,
      priority,
      imageUrl: image_url || null,
      isActive: true,
      createdBy: req.user.id
    });

    await newAnnouncement.save();

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      announcement: {
        id: announcementId,
        title,
        content,
        priority,
        image_url: image_url || null,
        createdAt: new Date()
      }
    });

  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
};

/**
 * Update announcement (Admin only)
 */
const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, priority, isActive, image_url } = req.body;

    const updateData = {};

    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (priority) updateData.priority = priority;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (image_url !== undefined) updateData.imageUrl = image_url || null;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No update data provided' });
    }

    await Announcement.findByIdAndUpdate(id, updateData);

    res.json({
      success: true,
      message: 'Announcement updated successfully'
    });

  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
};

/**
 * Delete announcement (Admin only)
 */
const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    await Announcement.findByIdAndUpdate(id, { isActive: false });

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });

  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
};

module.exports = {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};

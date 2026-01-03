const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Get all announcements
 */
const getAnnouncements = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [announcements] = await pool.query(
      `SELECT id, title, content, priority, created_at, updated_at
       FROM announcements 
       WHERE is_active = true
       ORDER BY priority DESC, created_at DESC
       LIMIT ${limit} OFFSET ${offset}`
    );

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM announcements WHERE is_active = true'
    );

    res.json({
      announcements,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
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

    const [announcements] = await pool.execute(
      'SELECT * FROM announcements WHERE id = ? AND is_active = true',
      [id]
    );

    if (announcements.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json({ announcement: announcements[0] });

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

    await pool.execute(
      `INSERT INTO announcements (id, title, content, priority, image_url, is_active, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, true, ?, NOW())`,
      [announcementId, title, content, priority, image_url || null, req.user.id]
    );

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

    const updates = [];
    const values = [];

    if (title) {
      updates.push('title = ?');
      values.push(title);
    }
    if (content) {
      updates.push('content = ?');
      values.push(content);
    }
    if (priority) {
      updates.push('priority = ?');
      values.push(priority);
    }
    if (typeof isActive === 'boolean') {
      updates.push('is_active = ?');
      values.push(isActive);
    }
    if (image_url !== undefined) {
      updates.push('image_url = ?');
      values.push(image_url || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No update data provided' });
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    await pool.execute(
      `UPDATE announcements SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

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

    await pool.execute(
      'UPDATE announcements SET is_active = false, updated_at = NOW() WHERE id = ?',
      [id]
    );

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

const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const COMPLAINT_CATEGORIES = [
  'Road & Infrastructure',
  'Water Supply',
  'Electricity',
  'Sanitation',
  'Street Lights',
  'Drainage',
  'Public Health',
  'Encroachment',
  'Noise Pollution',
  'Other'
];

/**
 * Create new complaint
 */
const createComplaint = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, category, location } = req.body;

    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Title, description, and category are required' 
      });
    }

    // Validate category
    if (!COMPLAINT_CATEGORIES.includes(category)) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Invalid category',
        validCategories: COMPLAINT_CATEGORIES
      });
    }

    // Generate complaint ID
    const complaintId = uuidv4();
    const trackingId = `CMP-${Date.now().toString(36).toUpperCase()}`;

    await pool.execute(
      `INSERT INTO complaints (id, tracking_id, user_id, title, description, category, location, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [complaintId, trackingId, userId, title, description, category, location || null]
    );

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint: {
        id: complaintId,
        trackingId,
        title,
        category,
        status: 'pending',
        createdAt: new Date()
      }
    });

  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
};

/**
 * Get user's complaints
 */
const getUserComplaints = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, tracking_id, title, description, category, location, status, 
             admin_remarks, created_at, updated_at
      FROM complaints 
      WHERE user_id = ?
    `;
    const params = [userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [complaints] = await pool.query(query, params);

    // Get total count
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM complaints WHERE user_id = ?',
      [userId]
    );

    res.json({
      complaints,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ error: 'Failed to get complaints' });
  }
};

/**
 * Get single complaint
 */
const getComplaint = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [complaints] = await pool.execute(
      `SELECT c.*, u.name as user_name
       FROM complaints c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ? AND c.user_id = ?`,
      [id, userId]
    );

    if (complaints.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Get status history
    const [history] = await pool.execute(
      `SELECT status, remarks, created_at 
       FROM complaint_history 
       WHERE complaint_id = ? 
       ORDER BY created_at DESC`,
      [id]
    );

    res.json({
      complaint: complaints[0],
      history
    });

  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({ error: 'Failed to get complaint' });
  }
};

module.exports = {
  createComplaint,
  getUserComplaints,
  getComplaint,
  COMPLAINT_CATEGORIES
};

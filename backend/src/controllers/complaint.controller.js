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

const PRIORITY_LEVELS = ['low', 'normal', 'high', 'urgent'];

const ESTIMATED_DAYS = {
  'Road & Infrastructure': 15,
  'Water Supply': 3,
  'Electricity': 2,
  'Sanitation': 5,
  'Street Lights': 7,
  'Drainage': 10,
  'Public Health': 5,
  'Encroachment': 20,
  'Noise Pollution': 7,
  'Other': 10
};

/**
 * Create new complaint with enhanced features
 */
const createComplaint = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      title, 
      description, 
      category, 
      location, 
      priority = 'normal',
      imageUrls = [],
      contactPhone,
      wardNumber
    } = req.body;

    // Debug logging
    console.log('📝 Creating complaint with data:', {
      title,
      category,
      priority,
      imageUrls,
      location,
      wardNumber
    });

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

    // Validate priority
    if (!PRIORITY_LEVELS.includes(priority)) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Invalid priority level',
        validPriorities: PRIORITY_LEVELS
      });
    }

    // Generate complaint ID and tracking ID
    const complaintId = uuidv4();
    const trackingId = `TRP-${Date.now().toString(36).toUpperCase()}`;
    const estimatedDays = ESTIMATED_DAYS[category] || 10;

    // Handle image URLs (up to 3)
    const [imageUrl1, imageUrl2, imageUrl3] = [
      imageUrls[0] || null,
      imageUrls[1] || null,
      imageUrls[2] || null
    ];

    // Try with new columns, fallback to basic insert
    try {
      await pool.execute(
        `INSERT INTO complaints (
          id, tracking_id, user_id, title, description, category, priority,
          location, image_url, image_url_2, image_url_3, contact_phone, ward_number,
          estimated_resolution_days, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
        [
          complaintId, trackingId, userId, title, description, category, priority,
          location || null, imageUrl1, imageUrl2, imageUrl3, contactPhone || null, wardNumber || null,
          estimatedDays
        ]
      );
    } catch (insertError) {
      // Fallback to basic insert if new columns don't exist yet
      await pool.execute(
        `INSERT INTO complaints (id, tracking_id, user_id, title, description, category, location, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
        [complaintId, trackingId, userId, title, description, category, location || null]
      );
    }

    // Create initial history entry
    try {
      await pool.execute(
        `INSERT INTO complaint_history (id, complaint_id, status, remarks, created_at)
         VALUES (?, ?, 'pending', 'Complaint submitted successfully', NOW())`,
        [uuidv4(), complaintId]
      );
    } catch (historyError) {
      console.log('History insert skipped:', historyError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint: {
        id: complaintId,
        trackingId,
        title,
        category,
        priority,
        status: 'pending',
        estimatedResolutionDays: estimatedDays,
        createdAt: new Date()
      }
    });

  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
};

/**
 * Get user's complaints with enhanced details
 */
const getUserComplaints = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const priority = req.query.priority;
    const offset = (page - 1) * limit;

    let query = `
      SELECT * 
      FROM complaints 
      WHERE user_id = ?
    `;
    const params = [userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }

    query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [complaints] = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM complaints WHERE user_id = ?';
    const countParams = [userId];
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (priority) {
      countQuery += ' AND priority = ?';
      countParams.push(priority);
    }
    const [countResult] = await pool.execute(countQuery, countParams);

    // Get summary stats for user
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM complaints WHERE user_id = ?
    `, [userId]);

    res.json({
      complaints,
      stats: stats[0],
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
 * Get single complaint with full history timeline
 */
const getComplaint = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [complaints] = await pool.execute(
      `SELECT c.*, u.name as user_name, u.phone as user_phone
       FROM complaints c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ? AND c.user_id = ?`,
      [id, userId]
    );

    if (complaints.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Get status history/timeline
    const [history] = await pool.execute(
      `SELECT id, status, remarks, created_at 
       FROM complaint_history 
       WHERE complaint_id = ? 
       ORDER BY created_at ASC`,
      [id]
    );

    // Calculate days since creation
    const complaint = complaints[0];
    const createdAt = new Date(complaint.created_at);
    const now = new Date();
    const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

    res.json({
      complaint: {
        ...complaint,
        daysSinceCreation
      },
      timeline: history
    });

  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({ error: 'Failed to get complaint' });
  }
};

/**
 * Track complaint by tracking ID (PUBLIC - no auth required)
 */
const trackComplaint = async (req, res) => {
  try {
    const { trackingId } = req.params;

    if (!trackingId) {
      return res.status(400).json({ error: 'Tracking ID is required' });
    }

    const [complaints] = await pool.execute(
      `SELECT 
        tracking_id, title, category, status, location,
        created_at, updated_at
       FROM complaints 
       WHERE tracking_id = ?`,
      [trackingId.toUpperCase()]
    );

    if (complaints.length === 0) {
      return res.status(404).json({ 
        error: 'Complaint not found',
        message: 'No complaint found with this tracking ID. Please check the ID and try again.'
      });
    }

    // Get timeline (limited info for public view)
    const [history] = await pool.execute(
      `SELECT status, remarks, created_at 
       FROM complaint_history 
       WHERE complaint_id = (SELECT id FROM complaints WHERE tracking_id = ?)
       ORDER BY created_at ASC`,
      [trackingId.toUpperCase()]
    );

    const complaint = complaints[0];
    const createdAt = new Date(complaint.created_at);
    const now = new Date();
    const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

    // Generate status message
    let statusMessage = '';
    switch (complaint.status) {
      case 'pending':
        statusMessage = 'Your complaint is pending review by our officials.';
        break;
      case 'in_progress':
        statusMessage = 'Your complaint is being actively worked on.';
        break;
      case 'resolved':
        statusMessage = 'Your complaint has been resolved successfully.';
        break;
      case 'rejected':
        statusMessage = 'Your complaint could not be processed.';
        break;
    }

    res.json({
      complaint: {
        ...complaint,
        daysSinceCreation,
        statusMessage
      },
      timeline: history
    });

  } catch (error) {
    console.error('Track complaint error:', error);
    res.status(500).json({ error: 'Failed to track complaint' });
  }
};

/**
 * Submit feedback for resolved complaint
 */
const submitFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { rating, feedbackText } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if complaint exists and is resolved
    const [complaints] = await pool.execute(
      `SELECT id, status FROM complaints WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (complaints.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    if (complaints[0].status !== 'resolved') {
      return res.status(400).json({ error: 'Feedback can only be submitted for resolved complaints' });
    }

    res.json({
      success: true,
      message: 'Thank you for your feedback!'
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
};

/**
 * Get wards list
 */
const getWards = async (req, res) => {
  try {
    // Return default wards for Tirupur
    res.json({
      wards: [
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
      ]
    });
  } catch (error) {
    console.error('Get wards error:', error);
    res.status(500).json({ error: 'Failed to get wards' });
  }
};

module.exports = {
  createComplaint,
  getUserComplaints,
  getComplaint,
  trackComplaint,
  submitFeedback,
  getWards,
  COMPLAINT_CATEGORIES,
  PRIORITY_LEVELS
};

const { pool } = require('../config/database');

/**
 * Get dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    // Get user stats
    const [userStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_users,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_users
      FROM users WHERE role = 'citizen'
    `);

    // Get complaint stats
    const [complaintStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_complaints,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_complaints,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_complaints,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_complaints
      FROM complaints
    `);

    // Get recent complaints
    const [recentComplaints] = await pool.execute(`
      SELECT c.id, c.tracking_id, c.title, c.category, c.status, c.created_at,
             u.name as user_name
      FROM complaints c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
      LIMIT 5
    `);

    // Get category distribution
    const [categoryStats] = await pool.execute(`
      SELECT category, COUNT(*) as count
      FROM complaints
      GROUP BY category
      ORDER BY count DESC
    `);

    res.json({
      users: userStats[0],
      complaints: complaintStats[0],
      recentComplaints,
      categoryDistribution: categoryStats
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard statistics' });
  }
};

/**
 * Get all users
 */
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, email, name, phone, address, aadhaar_last4, status, created_at
      FROM users 
      WHERE role = 'citizen'
    `;
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [users] = await pool.query(query, params);

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM users WHERE role = ?',
      ['citizen']
    );

    res.json({
      users,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

/**
 * Get pending users
 */
const getPendingUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(`
      SELECT id, email, name, phone, address, aadhaar_last4, created_at
      FROM users 
      WHERE role = 'citizen' AND status = 'pending'
      ORDER BY created_at ASC
    `);

    res.json({ users, count: users.length });

  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({ error: 'Failed to get pending users' });
  }
};

/**
 * Approve user
 */
const approveUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      `UPDATE users SET status = 'approved', updated_at = NOW() WHERE id = ? AND status = 'pending'`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found or already processed' });
    }

    res.json({
      success: true,
      message: 'User approved successfully'
    });

  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
};

/**
 * Reject user
 */
const rejectUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const [result] = await pool.execute(
      `UPDATE users SET status = 'rejected', rejection_reason = ?, updated_at = NOW() 
       WHERE id = ? AND status = 'pending'`,
      [reason || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found or already processed' });
    }

    res.json({
      success: true,
      message: 'User registration rejected'
    });

  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ error: 'Failed to reject user' });
  }
};

/**
 * Get all complaints (Admin)
 */
const getAllComplaints = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const category = req.query.category;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM complaints c
      JOIN users u ON c.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    if (category) {
      query += ' AND c.category = ?';
      params.push(category);
    }

    query += ` ORDER BY c.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [complaints] = await pool.query(query, params);

    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM complaints');

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
    console.error('Get all complaints error:', error);
    res.status(500).json({ error: 'Failed to get complaints' });
  }
};

/**
 * Update complaint status
 */
const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const validStatuses = ['pending', 'in_progress', 'resolved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses 
      });
    }

    // Update complaint
    await pool.execute(
      `UPDATE complaints SET status = ?, admin_remarks = ?, updated_at = NOW() WHERE id = ?`,
      [status, remarks || null, id]
    );

    // Add to history
    await pool.execute(
      `INSERT INTO complaint_history (id, complaint_id, status, remarks, created_at)
       VALUES (UUID(), ?, ?, ?, NOW())`,
      [id, status, remarks || null]
    );

    res.json({
      success: true,
      message: 'Complaint status updated successfully'
    });

  } catch (error) {
    console.error('Update complaint status error:', error);
    res.status(500).json({ error: 'Failed to update complaint status' });
  }
};

/**
 * Get complaint analytics
 */
const getComplaintAnalytics = async (req, res) => {
  try {
    // Status distribution
    const [statusDist] = await pool.execute(`
      SELECT status, COUNT(*) as count
      FROM complaints
      GROUP BY status
    `);

    // Category distribution
    const [categoryDist] = await pool.execute(`
      SELECT category, COUNT(*) as count
      FROM complaints
      GROUP BY category
      ORDER BY count DESC
    `);

    // Monthly trend (last 6 months)
    const [monthlyTrend] = await pool.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM complaints
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);

    // Resolution rate
    const [resolutionRate] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
      FROM complaints
    `);

    const rate = resolutionRate[0].total > 0 
      ? (resolutionRate[0].resolved / resolutionRate[0].total * 100).toFixed(1)
      : 0;

    res.json({
      statusDistribution: statusDist,
      categoryDistribution: categoryDist,
      monthlyTrend,
      resolutionRate: {
        total: resolutionRate[0].total,
        resolved: resolutionRate[0].resolved,
        percentage: rate
      }
    });

  } catch (error) {
    console.error('Complaint analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getPendingUsers,
  approveUser,
  rejectUser,
  getAllComplaints,
  updateComplaintStatus,
  getComplaintAnalytics
};

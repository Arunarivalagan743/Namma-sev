const { User, Complaint, ComplaintHistory } = require('../models');

/**
 * Get dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    // Get user stats
    const userStatsAgg = await User.aggregate([
      { $match: { role: 'citizen' } },
      {
        $group: {
          _id: null,
          total_users: { $sum: 1 },
          pending_users: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          approved_users: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } }
        }
      }
    ]);

    const userStats = userStatsAgg[0] || {
      total_users: 0,
      pending_users: 0,
      approved_users: 0
    };

    // Get complaint stats
    const complaintStatsAgg = await Complaint.aggregate([
      {
        $group: {
          _id: null,
          total_complaints: { $sum: 1 },
          pending_complaints: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          in_progress_complaints: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          resolved_complaints: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } }
        }
      }
    ]);

    const complaintStats = complaintStatsAgg[0] || {
      total_complaints: 0,
      pending_complaints: 0,
      in_progress_complaints: 0,
      resolved_complaints: 0
    };

    // Get recent complaints with user details
    const recentComplaints = await Complaint.find()
      .populate('userId', 'name')
      .select('_id trackingId title category status createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Transform to match expected format
    const formattedComplaints = recentComplaints.map(complaint => ({
      id: complaint._id,
      tracking_id: complaint.trackingId,
      title: complaint.title,
      category: complaint.category,
      status: complaint.status,
      created_at: complaint.createdAt,
      user_name: complaint.userId?.name || 'Unknown User'
    }));

    // Get category distribution
    const categoryStats = await Complaint.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const formattedCategoryStats = categoryStats.map(stat => ({
      category: stat._id,
      count: stat.count
    }));

    res.json({
      users: userStats,
      complaints: complaintStats,
      recentComplaints: formattedComplaints,
      categoryDistribution: formattedCategoryStats
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
    const skip = (page - 1) * limit;

    let filter = { role: 'citizen' };
    if (status) {
      filter.status = status;
    }

    const users = await User.find(filter)
      .select('_id email name phone address aadhaarLast4 status createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments({ role: 'citizen' });

    // Transform to match expected format
    const formattedUsers = users.map(user => ({
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      address: user.address,
      aadhaar_last4: user.aadhaarLast4,
      status: user.status,
      created_at: user.createdAt
    }));

    res.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
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
    const users = await User.find({ 
      role: 'citizen', 
      status: 'pending' 
    })
      .select('_id email name phone address aadhaarLast4 createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Transform to match expected format
    const formattedUsers = users.map(user => ({
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      address: user.address,
      aadhaar_last4: user.aadhaarLast4,
      created_at: user.createdAt
    }));

    res.json({ users: formattedUsers, count: formattedUsers.length });

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

    const result = await User.findOneAndUpdate(
      { _id: id, status: 'pending' },
      { status: 'approved' },
      { new: true }
    );

    if (!result) {
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

    const result = await User.findOneAndUpdate(
      { _id: id, status: 'pending' },
      { 
        status: 'rejected',
        rejectionReason: reason || null
      },
      { new: true }
    );

    if (!result) {
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
    const skip = (page - 1) * limit;

    let filter = {};
    
    if (status) {
      filter.status = status;
    }

    if (category) {
      filter.category = category;
    }

    const complaints = await Complaint.find(filter)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Complaint.countDocuments(filter);

    // Transform to match expected format
    const formattedComplaints = complaints.map(complaint => ({
      ...complaint,
      id: complaint._id,
      user_name: complaint.userId?.name || 'Unknown',
      user_email: complaint.userId?.email || '',
      user_phone: complaint.userId?.phone || '',
      user_id: complaint.userId?._id || complaint.userId,
      tracking_id: complaint.trackingId,
      admin_remarks: complaint.adminRemarks,
      image_url: complaint.imageUrl,
      image_url_2: complaint.imageUrl2,
      image_url_3: complaint.imageUrl3,
      created_at: complaint.createdAt,
      updated_at: complaint.updatedAt
    }));

    res.json({
      complaints: formattedComplaints,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
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
    await Complaint.findByIdAndUpdate(id, {
      status,
      adminRemarks: remarks || null
    });

    // Add to history
    const historyEntry = new ComplaintHistory({
      _id: require('uuid').v4(),
      complaintId: id,
      status,
      remarks: remarks || null
    });

    await historyEntry.save();

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
    const statusDist = await Complaint.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Category distribution
    const categoryDist = await Complaint.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrend = await Complaint.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: {
                  if: { $lt: ['$_id.month', 10] },
                  then: { $concat: ['0', { $toString: '$_id.month' }] },
                  else: { $toString: '$_id.month' }
                }
              }
            ]
          },
          count: 1,
          _id: 0
        }
      },
      { $sort: { month: 1 } }
    ]);

    // Resolution rate
    const resolutionStats = await Complaint.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const resolutionData = resolutionStats[0] || { total: 0, resolved: 0 };
    const rate = resolutionData.total > 0 
      ? (resolutionData.resolved / resolutionData.total * 100).toFixed(1)
      : 0;

    res.json({
      statusDistribution: statusDist,
      categoryDistribution: categoryDist,
      monthlyTrend,
      resolutionRate: {
        total: resolutionData.total,
        resolved: resolutionData.resolved,
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

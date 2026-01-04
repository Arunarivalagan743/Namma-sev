const { User } = require('../models');

/**
 * Get user profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .select('_id email name phone address aadhaarLast4 panchayatCode role status createdAt updatedAt')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Transform to match expected format
    const formattedUser = {
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      address: user.address,
      aadhaar_last4: user.aadhaarLast4,
      panchayat_code: user.panchayatCode,
      role: user.role,
      status: user.status,
      created_at: user.createdAt,
      updated_at: user.updatedAt
    };

    res.json({ user: formattedUser });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, address } = req.body;

    // Validate
    if (!name && !phone && !address) {
      return res.status(400).json({ 
        error: 'No update data provided' 
      });
    }

    // Build update object
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('_id email name phone address role status').lean();

    // Transform to match expected format
    const formattedUser = {
      id: updatedUser._id,
      email: updatedUser.email,
      name: updatedUser.name,
      phone: updatedUser.phone,
      address: updatedUser.address,
      role: updatedUser.role,
      status: updatedUser.status
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: formattedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

module.exports = {
  getProfile,
  updateProfile
};

const { pool } = require('../config/database');

// Helper function to format dates for MySQL (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS)
const formatDateForMySQL = (dateString, includeTime = false) => {
  if (!dateString || dateString.trim() === '') return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    if (includeTime) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    return `${year}-${month}-${day}`;
  } catch (e) {
    return null;
  }
};

const engagementController = {
  // ============ NEWS/UPDATES ============
  getNews: async (req, res) => {
    try {
      const { page = 1, limit = 10, category, featured } = req.query;
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE is_published = TRUE';
      const params = [];
      
      if (category) {
        whereClause += ' AND category = ?';
        params.push(category);
      }
      if (featured === 'true') {
        whereClause += ' AND is_featured = TRUE';
      }
      
      const [news] = await pool.query(
        `SELECT n.*, u.name as author_name 
         FROM news_updates n 
         LEFT JOIN users u ON n.created_by = u.id 
         ${whereClause} 
         ORDER BY n.published_at DESC, n.created_at DESC 
         LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
        params
      );
      
      const [[{ total }]] = await pool.query(
        `SELECT COUNT(*) as total FROM news_updates ${whereClause}`,
        params
      );
      
      res.json({
        success: true,
        news,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching news:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch news' });
    }
  },

  createNews: async (req, res) => {
    try {
      const { title, content, summary, category, image_url, is_featured } = req.body;
      
      const [result] = await pool.execute(
        `INSERT INTO news_updates (title, content, summary, category, image_url, is_featured, is_published, published_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?, TRUE, NOW(), ?)`,
        [title, content, summary, category || 'general', image_url, is_featured || false, req.user.uid]
      );
      
      res.status(201).json({
        success: true,
        message: 'News created successfully',
        newsId: result.insertId
      });
    } catch (error) {
      console.error('Error creating news:', error);
      res.status(500).json({ success: false, message: 'Failed to create news' });
    }
  },

  updateNews: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content, summary, category, image_url, is_featured, is_published } = req.body;
      
      await pool.execute(
        `UPDATE news_updates SET title = ?, content = ?, summary = ?, category = ?, 
         image_url = ?, is_featured = ?, is_published = ? WHERE id = ?`,
        [title, content, summary, category, image_url, is_featured, is_published, id]
      );
      
      res.json({ success: true, message: 'News updated successfully' });
    } catch (error) {
      console.error('Error updating news:', error);
      res.status(500).json({ success: false, message: 'Failed to update news' });
    }
  },

  deleteNews: async (req, res) => {
    try {
      const { id } = req.params;
      await pool.execute('DELETE FROM news_updates WHERE id = ?', [id]);
      res.json({ success: true, message: 'News deleted successfully' });
    } catch (error) {
      console.error('Error deleting news:', error);
      res.status(500).json({ success: false, message: 'Failed to delete news' });
    }
  },

  // ============ GRAM SABHA MEETINGS ============
  getMeetings: async (req, res) => {
    try {
      const { status, upcoming } = req.query;
      const userId = req.user?.id; // Get current user's ID if authenticated
      
      let whereClause = '1=1';
      const params = [];
      
      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      }
      if (upcoming === 'true') {
        whereClause += ' AND meeting_date >= NOW()';
      }
      
      const [meetings] = await pool.query(
        `SELECT m.*, 
         (SELECT COUNT(*) FROM meeting_rsvp WHERE meeting_id = m.id AND will_attend = 'yes') as rsvp_yes,
         (SELECT COUNT(*) FROM meeting_rsvp WHERE meeting_id = m.id AND will_attend = 'no') as rsvp_no
         FROM gram_sabha_meetings m 
         WHERE ${whereClause} 
         ORDER BY meeting_date DESC`,
        params
      );
      
      // Get user's RSVP for each meeting if authenticated
      if (userId) {
        for (let meeting of meetings) {
          const [[userRsvp]] = await pool.query(
            `SELECT will_attend FROM meeting_rsvp WHERE meeting_id = ? AND user_id = ?`,
            [meeting.id, userId]
          );
          meeting.userRsvp = userRsvp?.will_attend || null;
        }
      }
      
      res.json({ success: true, meetings });
    } catch (error) {
      console.error('Error fetching meetings:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch meetings' });
    }
  },

  createMeeting: async (req, res) => {
    try {
      const { title, meeting_date, venue, agenda, status, image_url } = req.body;
      
      const meetingDateVal = formatDateForMySQL(meeting_date, true);
      
      const [result] = await pool.execute(
        `INSERT INTO gram_sabha_meetings (title, meeting_date, venue, agenda, status, image_url, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [title, meetingDateVal, venue, agenda, status || 'upcoming', image_url, req.user.uid]
      );
      
      res.status(201).json({
        success: true,
        message: 'Meeting created successfully',
        meetingId: result.insertId
      });
    } catch (error) {
      console.error('Error creating meeting:', error);
      res.status(500).json({ success: false, message: 'Failed to create meeting' });
    }
  },

  updateMeeting: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, meeting_date, venue, agenda, status, minutes_pdf_url, decisions, image_url } = req.body;
      
      const meetingDateVal = formatDateForMySQL(meeting_date, true);
      
      await pool.execute(
        `UPDATE gram_sabha_meetings SET title = ?, meeting_date = ?, venue = ?, agenda = ?, 
         status = ?, minutes_pdf_url = ?, decisions = ?, image_url = ? WHERE id = ?`,
        [title, meetingDateVal, venue, agenda, status, minutes_pdf_url, decisions, image_url, id]
      );
      
      res.json({ success: true, message: 'Meeting updated successfully' });
    } catch (error) {
      console.error('Error updating meeting:', error);
      res.status(500).json({ success: false, message: 'Failed to update meeting' });
    }
  },

  deleteMeeting: async (req, res) => {
    try {
      const { id } = req.params;
      // Delete related RSVPs first
      await pool.execute('DELETE FROM meeting_rsvp WHERE meeting_id = ?', [id]);
      await pool.execute('DELETE FROM gram_sabha_meetings WHERE id = ?', [id]);
      res.json({ success: true, message: 'Meeting deleted successfully' });
    } catch (error) {
      console.error('Error deleting meeting:', error);
      res.status(500).json({ success: false, message: 'Failed to delete meeting' });
    }
  },

  rsvpMeeting: async (req, res) => {
    try {
      const { id } = req.params;
      const { will_attend } = req.body;
      const userId = req.user.id;
      
      await pool.execute(
        `INSERT INTO meeting_rsvp (meeting_id, user_id, will_attend) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE will_attend = ?`,
        [id, userId, will_attend, will_attend]
      );
      
      res.json({ success: true, message: 'RSVP recorded successfully' });
    } catch (error) {
      console.error('Error recording RSVP:', error);
      res.status(500).json({ success: false, message: 'Failed to record RSVP' });
    }
  },

  // ============ GOVERNMENT SCHEMES ============
  getSchemes: async (req, res) => {
    try {
      const { category, active } = req.query;
      
      let whereClause = '1=1';
      const params = [];
      
      if (category) {
        whereClause += ' AND category = ?';
        params.push(category);
      }
      if (active !== 'false') {
        whereClause += ' AND is_active = TRUE';
      }
      
      const [schemes] = await pool.query(
        `SELECT * FROM government_schemes WHERE ${whereClause} ORDER BY created_at DESC`,
        params
      );
      
      res.json({ success: true, schemes });
    } catch (error) {
      console.error('Error fetching schemes:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch schemes' });
    }
  },

  createScheme: async (req, res) => {
    try {
      const { name, description, eligibility, required_documents, benefits, last_date, category, application_link, image_url } = req.body;
      
      const lastDateVal = formatDateForMySQL(last_date);
      
      const [result] = await pool.execute(
        `INSERT INTO government_schemes (name, description, eligibility, required_documents, benefits, last_date, category, application_link, image_url, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, description, eligibility, required_documents, benefits, lastDateVal, category || 'other', application_link, image_url, req.user.uid]
      );
      
      res.status(201).json({
        success: true,
        message: 'Scheme created successfully',
        schemeId: result.insertId
      });
    } catch (error) {
      console.error('Error creating scheme:', error);
      res.status(500).json({ success: false, message: 'Failed to create scheme' });
    }
  },

  updateScheme: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, eligibility, required_documents, benefits, last_date, category, application_link, is_active, image_url } = req.body;
      
      const lastDateVal = formatDateForMySQL(last_date);
      
      await pool.execute(
        `UPDATE government_schemes SET name = ?, description = ?, eligibility = ?, required_documents = ?, 
         benefits = ?, last_date = ?, category = ?, application_link = ?, is_active = ?, image_url = ? WHERE id = ?`,
        [name, description, eligibility, required_documents, benefits, lastDateVal, category, application_link, is_active, image_url, id]
      );
      
      res.json({ success: true, message: 'Scheme updated successfully' });
    } catch (error) {
      console.error('Error updating scheme:', error);
      res.status(500).json({ success: false, message: 'Failed to update scheme' });
    }
  },

  deleteScheme: async (req, res) => {
    try {
      const { id } = req.params;
      // Delete related bookmarks first
      await pool.execute('DELETE FROM scheme_bookmarks WHERE scheme_id = ?', [id]);
      await pool.execute('DELETE FROM government_schemes WHERE id = ?', [id]);
      res.json({ success: true, message: 'Scheme deleted successfully' });
    } catch (error) {
      console.error('Error deleting scheme:', error);
      res.status(500).json({ success: false, message: 'Failed to delete scheme' });
    }
  },

  bookmarkScheme: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      await pool.execute(
        `INSERT INTO scheme_bookmarks (scheme_id, user_id) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE created_at = NOW()`,
        [id, userId]
      );
      
      res.json({ success: true, message: 'Scheme bookmarked successfully' });
    } catch (error) {
      console.error('Error bookmarking scheme:', error);
      res.status(500).json({ success: false, message: 'Failed to bookmark scheme' });
    }
  },

  // ============ EMERGENCY ALERTS ============
  getAlerts: async (req, res) => {
    try {
      const { active } = req.query;
      
      let whereClause = '1=1';
      if (active !== 'false') {
        whereClause += ' AND is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW())';
      }
      
      const [alerts] = await pool.query(
        `SELECT * FROM emergency_alerts WHERE ${whereClause} ORDER BY severity DESC, created_at DESC`
      );
      
      res.json({ success: true, alerts });
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch alerts' });
    }
  },

  createAlert: async (req, res) => {
    try {
      const { title, message, alert_type, severity, expires_at, affected_areas, instructions, image_url } = req.body;
      
      const expiresAtVal = formatDateForMySQL(expires_at, true);
      
      const [result] = await pool.execute(
        `INSERT INTO emergency_alerts (title, message, alert_type, severity, expires_at, affected_areas, instructions, image_url, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, message, alert_type, severity || 'medium', expiresAtVal, affected_areas, instructions, image_url, req.user.uid]
      );
      
      res.status(201).json({
        success: true,
        message: 'Alert created successfully',
        alertId: result.insertId
      });
    } catch (error) {
      console.error('Error creating alert:', error);
      res.status(500).json({ success: false, message: 'Failed to create alert' });
    }
  },

  updateAlert: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, message, alert_type, severity, is_active, expires_at, affected_areas, instructions, image_url } = req.body;
      
      const expiresAtVal = formatDateForMySQL(expires_at, true);
      
      await pool.execute(
        `UPDATE emergency_alerts SET title = ?, message = ?, alert_type = ?, severity = ?, 
         is_active = ?, expires_at = ?, affected_areas = ?, instructions = ?, image_url = ? WHERE id = ?`,
        [title, message, alert_type, severity, is_active, expiresAtVal, affected_areas, instructions, image_url, id]
      );
      
      res.json({ success: true, message: 'Alert updated successfully' });
    } catch (error) {
      console.error('Error updating alert:', error);
      res.status(500).json({ success: false, message: 'Failed to update alert' });
    }
  },

  deleteAlert: async (req, res) => {
    try {
      const { id } = req.params;
      await pool.execute('DELETE FROM emergency_alerts WHERE id = ?', [id]);
      res.json({ success: true, message: 'Alert deleted successfully' });
    } catch (error) {
      console.error('Error deleting alert:', error);
      res.status(500).json({ success: false, message: 'Failed to delete alert' });
    }
  },

  // ============ POLLS ============
  getPolls: async (req, res) => {
    try {
      const { status } = req.query;
      const userId = req.user?.id; // Get current user's ID if authenticated
      
      let whereClause = '1=1';
      const params = [];
      
      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      } else {
        whereClause += " AND status = 'active'";
      }
      
      const [polls] = await pool.query(
        `SELECT p.*, 
         (SELECT COUNT(DISTINCT user_id) FROM poll_votes WHERE poll_id = p.id) as total_votes
         FROM polls p WHERE ${whereClause} ORDER BY created_at DESC`,
        params
      );
      
      // Get options for each poll and user's vote
      for (let poll of polls) {
        const [options] = await pool.query(
          `SELECT * FROM poll_options WHERE poll_id = ? ORDER BY display_order`,
          [poll.id]
        );
        poll.options = options;
        
        // Get user's vote if authenticated
        if (userId) {
          const [[userVote]] = await pool.query(
            `SELECT option_id FROM poll_votes WHERE poll_id = ? AND user_id = ?`,
            [poll.id, userId]
          );
          poll.userVotedOptionId = userVote?.option_id || null;
        }
      }
      
      res.json({ success: true, polls });
    } catch (error) {
      console.error('Error fetching polls:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch polls' });
    }
  },

  createPoll: async (req, res) => {
    try {
      const { question, description, poll_type, starts_at, ends_at, options, image_url } = req.body;
      
      const startsAtVal = formatDateForMySQL(starts_at, true);
      const endsAtVal = formatDateForMySQL(ends_at, true);
      
      const [result] = await pool.execute(
        `INSERT INTO polls (question, description, poll_type, starts_at, ends_at, status, image_url, created_by)
         VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`,
        [question, description, poll_type || 'single_choice', startsAtVal, endsAtVal, image_url, req.user.uid]
      );
      
      const pollId = result.insertId;
      
      // Insert options
      if (options && options.length > 0) {
        for (let i = 0; i < options.length; i++) {
          await pool.execute(
            `INSERT INTO poll_options (poll_id, option_text, display_order) VALUES (?, ?, ?)`,
            [pollId, options[i], i]
          );
        }
      }
      
      res.status(201).json({
        success: true,
        message: 'Poll created successfully',
        pollId
      });
    } catch (error) {
      console.error('Error creating poll:', error);
      res.status(500).json({ success: false, message: 'Failed to create poll' });
    }
  },

  updatePoll: async (req, res) => {
    try {
      const { id } = req.params;
      const { question, description, poll_type, starts_at, ends_at, status, image_url } = req.body;
      
      const startsAtVal = formatDateForMySQL(starts_at, true);
      const endsAtVal = formatDateForMySQL(ends_at, true);
      
      await pool.execute(
        `UPDATE polls SET question = ?, description = ?, poll_type = ?, starts_at = ?, ends_at = ?, status = ?, image_url = ? WHERE id = ?`,
        [question, description, poll_type, startsAtVal, endsAtVal, status, image_url, id]
      );
      
      res.json({ success: true, message: 'Poll updated successfully' });
    } catch (error) {
      console.error('Error updating poll:', error);
      res.status(500).json({ success: false, message: 'Failed to update poll' });
    }
  },

  deletePoll: async (req, res) => {
    try {
      const { id } = req.params;
      // Delete related votes and options first
      await pool.execute('DELETE FROM poll_votes WHERE poll_id = ?', [id]);
      await pool.execute('DELETE FROM poll_options WHERE poll_id = ?', [id]);
      await pool.execute('DELETE FROM polls WHERE id = ?', [id]);
      res.json({ success: true, message: 'Poll deleted successfully' });
    } catch (error) {
      console.error('Error deleting poll:', error);
      res.status(500).json({ success: false, message: 'Failed to delete poll' });
    }
  },

  votePoll: async (req, res) => {
    try {
      const { id } = req.params;
      const { option_id } = req.body;
      const userId = req.user.id;
      
      // Check if already voted
      const [[existing]] = await pool.query(
        'SELECT id, option_id FROM poll_votes WHERE poll_id = ? AND user_id = ?',
        [id, userId]
      );
      
      if (existing) {
        // User is changing their vote
        const oldOptionId = existing.option_id;
        
        if (oldOptionId === option_id) {
          // Same option, no change needed
          return res.json({ success: true, message: 'Vote unchanged', changed: false });
        }
        
        // Update the vote to new option
        await pool.execute(
          'UPDATE poll_votes SET option_id = ?, created_at = NOW() WHERE poll_id = ? AND user_id = ?',
          [option_id, id, userId]
        );
        
        // Decrease old option count
        await pool.execute(
          'UPDATE poll_options SET vote_count = GREATEST(0, vote_count - 1) WHERE id = ?',
          [oldOptionId]
        );
        
        // Increase new option count
        await pool.execute(
          'UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = ?',
          [option_id]
        );
        
        return res.json({ success: true, message: 'Vote changed successfully', changed: true });
      }
      
      // New vote
      await pool.execute(
        `INSERT INTO poll_votes (poll_id, option_id, user_id) VALUES (?, ?, ?)`,
        [id, option_id, userId]
      );
      
      // Update vote count
      await pool.execute(
        'UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = ?',
        [option_id]
      );
      
      res.json({ success: true, message: 'Vote recorded successfully', changed: false });
    } catch (error) {
      console.error('Error voting:', error);
      res.status(500).json({ success: false, message: 'Failed to record vote' });
    }
  },

  // ============ PUBLIC SUGGESTIONS ============
  getSuggestions: async (req, res) => {
    try {
      const { status, category } = req.query;
      const userId = req.user?.id; // Get current user ID if logged in
      
      let whereClause = '1=1';
      const params = [];
      
      if (status) {
        whereClause += ' AND s.status = ?';
        params.push(status);
      }
      if (category) {
        whereClause += ' AND s.category = ?';
        params.push(category);
      }
      
      const [suggestions] = await pool.query(
        `SELECT s.*, u.name as user_name 
         FROM public_suggestions s 
         LEFT JOIN users u ON s.user_id = u.id 
         WHERE ${whereClause} 
         ORDER BY s.upvotes DESC, s.created_at DESC`,
        params
      );
      
      // Get user's upvotes if logged in
      let userUpvotes = [];
      if (userId) {
        const [upvotes] = await pool.query(
          'SELECT suggestion_id FROM suggestion_upvotes WHERE user_id = ?',
          [userId]
        );
        userUpvotes = upvotes.map(u => u.suggestion_id);
      }
      
      res.json({ success: true, suggestions, userUpvotes });
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch suggestions' });
    }
  },

  createSuggestion: async (req, res) => {
    try {
      const { title, description, category, location, image_url } = req.body;
      
      // Check if user is registered and has a valid ID
      if (!req.user || !req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'You must be a registered user to submit suggestions. Please complete your registration first.' 
        });
      }
      
      const userId = req.user.id;
      
      // Check if user is approved
      if (req.user.status !== 'approved') {
        return res.status(403).json({ 
          success: false, 
          message: 'Your account is pending approval. Please wait for admin approval to submit suggestions.' 
        });
      }
      
      const [result] = await pool.execute(
        `INSERT INTO public_suggestions (user_id, title, description, category, location)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, title, description, category || 'other', location || null]
      );
      
      res.status(201).json({
        success: true,
        message: 'Suggestion submitted successfully',
        suggestionId: result.insertId
      });
    } catch (error) {
      console.error('Error creating suggestion:', error);
      res.status(500).json({ success: false, message: 'Failed to submit suggestion' });
    }
  },

  upvoteSuggestion: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if user is registered
      if (!req.user.isRegistered || !req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'You must be a registered and approved user to upvote. Please complete your registration first.' 
        });
      }
      
      // Check if user is approved
      if (req.user.status !== 'approved') {
        return res.status(403).json({ 
          success: false, 
          message: 'Your account is pending approval. Please wait for admin approval to upvote.' 
        });
      }
      
      const userId = req.user.id;
      
      // Check if user already upvoted
      const [existingUpvote] = await pool.query(
        'SELECT id FROM suggestion_upvotes WHERE suggestion_id = ? AND user_id = ?',
        [id, userId]
      );
      
      let message;
      let action;
      
      if (existingUpvote.length > 0) {
        // Remove upvote (toggle off)
        await pool.execute(
          'DELETE FROM suggestion_upvotes WHERE suggestion_id = ? AND user_id = ?',
          [id, userId]
        );
        message = 'Upvote removed';
        action = 'removed';
      } else {
        // Add upvote
        await pool.execute(
          'INSERT INTO suggestion_upvotes (suggestion_id, user_id) VALUES (?, ?)',
          [id, userId]
        );
        message = 'Upvoted successfully';
        action = 'added';
      }
      
      // Update upvotes count
      await pool.execute(
        'UPDATE public_suggestions SET upvotes = (SELECT COUNT(*) FROM suggestion_upvotes WHERE suggestion_id = ?) WHERE id = ?',
        [id, id]
      );
      
      // Get updated count
      const [result] = await pool.query(
        'SELECT upvotes FROM public_suggestions WHERE id = ?',
        [id]
      );
      
      res.json({ 
        success: true, 
        message, 
        action,
        upvotes: result[0]?.upvotes || 0 
      });
    } catch (error) {
      console.error('Error upvoting:', error);
      res.status(500).json({ success: false, message: 'Failed to upvote' });
    }
  },

  updateSuggestionStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, admin_remarks } = req.body;
      
      await pool.execute(
        'UPDATE public_suggestions SET status = ?, admin_remarks = ? WHERE id = ?',
        [status, admin_remarks, id]
      );
      
      res.json({ success: true, message: 'Suggestion status updated' });
    } catch (error) {
      console.error('Error updating suggestion:', error);
      res.status(500).json({ success: false, message: 'Failed to update suggestion' });
    }
  },

  // ============ COMMUNITY EVENTS ============
  getEvents: async (req, res) => {
    try {
      const { status, event_type, upcoming } = req.query;
      
      let whereClause = '1=1';
      const params = [];
      
      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      }
      if (event_type) {
        whereClause += ' AND event_type = ?';
        params.push(event_type);
      }
      if (upcoming === 'true') {
        whereClause += ' AND event_date >= NOW()';
      }
      
      const [events] = await pool.query(
        `SELECT * FROM community_events WHERE ${whereClause} ORDER BY event_date ASC`,
        params
      );
      
      res.json({ success: true, events });
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch events' });
    }
  },

  createEvent: async (req, res) => {
    try {
      const { title, description, event_type, event_date, end_date, venue, organizer, contact_info, image_url, is_free, registration_required, max_participants } = req.body;
      
      const eventDateVal = formatDateForMySQL(event_date, true);
      const endDateVal = formatDateForMySQL(end_date, true);
      
      const [result] = await pool.execute(
        `INSERT INTO community_events (title, description, event_type, event_date, end_date, venue, organizer, contact_info, image_url, is_free, registration_required, max_participants, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, description, event_type, eventDateVal, endDateVal, venue, organizer, contact_info, image_url, is_free !== false, registration_required || false, max_participants, req.user.uid]
      );
      
      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        eventId: result.insertId
      });
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ success: false, message: 'Failed to create event' });
    }
  },

  updateEvent: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, event_type, event_date, end_date, venue, organizer, contact_info, image_url, is_free, registration_required, max_participants, status } = req.body;
      
      const eventDateVal = formatDateForMySQL(event_date, true);
      const endDateVal = formatDateForMySQL(end_date, true);
      
      await pool.execute(
        `UPDATE community_events SET title = ?, description = ?, event_type = ?, event_date = ?, end_date = ?, 
         venue = ?, organizer = ?, contact_info = ?, image_url = ?, is_free = ?, registration_required = ?, 
         max_participants = ?, status = ? WHERE id = ?`,
        [title, description, event_type, eventDateVal, endDateVal, venue, organizer, contact_info, image_url, is_free, registration_required, max_participants, status, id]
      );
      
      res.json({ success: true, message: 'Event updated successfully' });
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ success: false, message: 'Failed to update event' });
    }
  },

  deleteEvent: async (req, res) => {
    try {
      const { id } = req.params;
      await pool.execute('DELETE FROM community_events WHERE id = ?', [id]);
      res.json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ success: false, message: 'Failed to delete event' });
    }
  },

  // ============ PANCHAYAT WORKS ============
  getWorks: async (req, res) => {
    try {
      const { status, work_type } = req.query;
      
      let whereClause = '1=1';
      const params = [];
      
      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      }
      if (work_type) {
        whereClause += ' AND work_type = ?';
        params.push(work_type);
      }
      
      const [works] = await pool.query(
        `SELECT * FROM panchayat_works WHERE ${whereClause} ORDER BY start_date DESC`,
        params
      );
      
      res.json({ success: true, works });
    } catch (error) {
      console.error('Error fetching works:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch works' });
    }
  },

  createWork: async (req, res) => {
    try {
      const { title, description, work_type, location, contractor, budget_amount, start_date, expected_completion, status, image_url } = req.body;
      
      // Convert empty strings to null and format dates for MySQL
      const startDateVal = formatDateForMySQL(start_date);
      const expectedCompletionVal = formatDateForMySQL(expected_completion);
      const budgetVal = budget_amount && budget_amount !== '' ? budget_amount : null;
      
      const [result] = await pool.execute(
        `INSERT INTO panchayat_works (title, description, work_type, location, contractor, budget_amount, start_date, expected_completion, status, image_url, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, description, work_type, location, contractor || null, budgetVal, startDateVal, expectedCompletionVal, status || 'planned', image_url || null, req.user.uid]
      );
      
      res.status(201).json({
        success: true,
        message: 'Work created successfully',
        workId: result.insertId
      });
    } catch (error) {
      console.error('Error creating work:', error);
      res.status(500).json({ success: false, message: 'Failed to create work' });
    }
  },

  updateWork: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, work_type, location, contractor, budget_amount, start_date, expected_completion, actual_completion, progress_percentage, status, image_url } = req.body;
      
      // Convert empty strings to null and format dates for MySQL
      const startDateVal = formatDateForMySQL(start_date);
      const expectedCompletionVal = formatDateForMySQL(expected_completion);
      const actualCompletionVal = formatDateForMySQL(actual_completion);
      const budgetVal = budget_amount && budget_amount !== '' ? budget_amount : null;
      const progressVal = progress_percentage !== undefined && progress_percentage !== '' ? progress_percentage : 0;
      
      await pool.execute(
        `UPDATE panchayat_works SET title = ?, description = ?, work_type = ?, location = ?, contractor = ?, 
         budget_amount = ?, start_date = ?, expected_completion = ?, actual_completion = ?, 
         progress_percentage = ?, status = ?, image_url = ? WHERE id = ?`,
        [title, description, work_type, location, contractor || null, budgetVal, startDateVal, expectedCompletionVal, actualCompletionVal, progressVal, status, image_url || null, id]
      );
      
      res.json({ success: true, message: 'Work updated successfully' });
    } catch (error) {
      console.error('Error updating work:', error);
      res.status(500).json({ success: false, message: 'Failed to update work' });
    }
  },

  deleteWork: async (req, res) => {
    try {
      const { id } = req.params;
      // Delete related progress updates first
      await pool.execute('DELETE FROM work_progress_updates WHERE work_id = ?', [id]);
      await pool.execute('DELETE FROM panchayat_works WHERE id = ?', [id]);
      res.json({ success: true, message: 'Work deleted successfully' });
    } catch (error) {
      console.error('Error deleting work:', error);
      res.status(500).json({ success: false, message: 'Failed to delete work' });
    }
  },

  addWorkProgress: async (req, res) => {
    try {
      const { id } = req.params;
      const { update_text, progress_percentage, image_url } = req.body;
      
      await pool.execute(
        `INSERT INTO work_progress_updates (work_id, update_text, progress_percentage, image_url, updated_by)
         VALUES (?, ?, ?, ?, ?)`,
        [id, update_text, progress_percentage, image_url, req.user.uid]
      );
      
      if (progress_percentage) {
        await pool.execute(
          'UPDATE panchayat_works SET progress_percentage = ? WHERE id = ?',
          [progress_percentage, id]
        );
      }
      
      res.json({ success: true, message: 'Progress update added' });
    } catch (error) {
      console.error('Error adding progress:', error);
      res.status(500).json({ success: false, message: 'Failed to add progress update' });
    }
  },

  // ============ BUDGET ============
  getBudget: async (req, res) => {
    try {
      const { fiscal_year } = req.query;
      const year = fiscal_year || new Date().getFullYear().toString();
      
      const [budget] = await pool.query(
        `SELECT bc.name, bc.icon, bc.color, 
         COALESCE(be.allocated_amount, 0) as allocated,
         COALESCE(be.spent_amount, 0) as spent
         FROM budget_categories bc
         LEFT JOIN budget_entries be ON bc.id = be.category_id AND be.fiscal_year = ?
         ORDER BY bc.display_order`,
        [year]
      );
      
      const [[totals]] = await pool.query(
        `SELECT 
         COALESCE(SUM(allocated_amount), 0) as total_allocated,
         COALESCE(SUM(spent_amount), 0) as total_spent
         FROM budget_entries WHERE fiscal_year = ?`,
        [year]
      );
      
      res.json({ 
        success: true, 
        budget,
        totals,
        fiscal_year: year
      });
    } catch (error) {
      console.error('Error fetching budget:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch budget' });
    }
  },

  updateBudget: async (req, res) => {
    try {
      const { fiscal_year, category_id, allocated_amount, spent_amount, description } = req.body;
      
      await pool.execute(
        `INSERT INTO budget_entries (fiscal_year, category_id, allocated_amount, spent_amount, description, created_by)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE allocated_amount = ?, spent_amount = ?, description = ?`,
        [fiscal_year, category_id, allocated_amount, spent_amount, description, req.user.uid, allocated_amount, spent_amount, description]
      );
      
      res.json({ success: true, message: 'Budget updated successfully' });
    } catch (error) {
      console.error('Error updating budget:', error);
      res.status(500).json({ success: false, message: 'Failed to update budget' });
    }
  },

  deleteBudget: async (req, res) => {
    try {
      const { id } = req.params;
      await pool.execute('DELETE FROM budget_entries WHERE id = ?', [id]);
      res.json({ success: true, message: 'Budget entry deleted successfully' });
    } catch (error) {
      console.error('Error deleting budget:', error);
      res.status(500).json({ success: false, message: 'Failed to delete budget entry' });
    }
  },

  // ============ FAQ ============
  getFaqs: async (req, res) => {
    try {
      const { category } = req.query;
      
      let whereClause = 'is_active = TRUE';
      const params = [];
      
      if (category) {
        whereClause += ' AND category = ?';
        params.push(category);
      }
      
      const [faqs] = await pool.query(
        `SELECT * FROM faqs WHERE ${whereClause} ORDER BY display_order, created_at`,
        params
      );
      
      res.json({ success: true, faqs });
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch FAQs' });
    }
  },

  createFaq: async (req, res) => {
    try {
      const { question, answer, category, display_order, image_url } = req.body;
      
      const [result] = await pool.execute(
        `INSERT INTO faqs (question, answer, category, display_order, image_url, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [question, answer, category || 'general', display_order || 0, image_url, req.user.uid]
      );
      
      res.status(201).json({
        success: true,
        message: 'FAQ created successfully',
        faqId: result.insertId
      });
    } catch (error) {
      console.error('Error creating FAQ:', error);
      res.status(500).json({ success: false, message: 'Failed to create FAQ' });
    }
  },

  updateFaq: async (req, res) => {
    try {
      const { id } = req.params;
      const { question, answer, category, display_order, is_active, image_url } = req.body;
      
      await pool.execute(
        'UPDATE faqs SET question = ?, answer = ?, category = ?, display_order = ?, is_active = ?, image_url = ? WHERE id = ?',
        [question, answer, category, display_order, is_active, image_url, id]
      );
      
      res.json({ success: true, message: 'FAQ updated successfully' });
    } catch (error) {
      console.error('Error updating FAQ:', error);
      res.status(500).json({ success: false, message: 'Failed to update FAQ' });
    }
  },

  deleteFaq: async (req, res) => {
    try {
      const { id } = req.params;
      await pool.execute('DELETE FROM faqs WHERE id = ?', [id]);
      res.json({ success: true, message: 'FAQ deleted successfully' });
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      res.status(500).json({ success: false, message: 'Failed to delete FAQ' });
    }
  },

  // ============ HOME PAGE DATA ============
  getHomeData: async (req, res) => {
    try {
      // Get latest news (4 items)
      const [news] = await pool.query(
        `SELECT id, title, summary, category, image_url, published_at, created_at 
         FROM news_updates WHERE is_published = TRUE 
         ORDER BY is_featured DESC, published_at DESC LIMIT 4`
      );
      
      // Get active alerts
      const [alerts] = await pool.query(
        `SELECT id, title, message, alert_type, severity 
         FROM emergency_alerts 
         WHERE is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW())
         ORDER BY severity DESC LIMIT 3`
      );
      
      // Get latest announcements (5 items)
      const [announcements] = await pool.query(
        `SELECT id, title, content, priority, created_at 
         FROM announcements 
         WHERE is_active = TRUE 
         ORDER BY priority DESC, created_at DESC LIMIT 5`
      );
      
      // Get upcoming events (3 items)
      const [events] = await pool.query(
        `SELECT id, title, event_type, event_date, venue 
         FROM community_events 
         WHERE event_date >= NOW() AND status = 'upcoming'
         ORDER BY event_date ASC LIMIT 3`
      );
      
      // Get upcoming meeting
      const [[nextMeeting]] = await pool.query(
        `SELECT id, title, meeting_date, venue, image_url 
         FROM gram_sabha_meetings 
         WHERE meeting_date >= NOW() AND status = 'upcoming'
         ORDER BY meeting_date ASC LIMIT 1`
      );
      
      // Get active polls (1 featured)
      const [[activePoll]] = await pool.query(
        `SELECT p.id, p.question, p.image_url,
         (SELECT COUNT(DISTINCT user_id) FROM poll_votes WHERE poll_id = p.id) as total_votes
         FROM polls p WHERE status = 'active' 
         ORDER BY created_at DESC LIMIT 1`
      );
      
      if (activePoll) {
        const [options] = await pool.query(
          'SELECT id, option_text, vote_count FROM poll_options WHERE poll_id = ? ORDER BY display_order',
          [activePoll.id]
        );
        activePoll.options = options;
      }
      
      // Get ongoing works (3 items)
      const [works] = await pool.query(
        `SELECT id, title, work_type, location, progress_percentage, status, image_url 
         FROM panchayat_works 
         WHERE status IN ('in_progress', 'planned')
         ORDER BY start_date DESC LIMIT 3`
      );
      
      // Get latest schemes (3 items)
      const [schemes] = await pool.query(
        `SELECT id, name, category, last_date, benefits, image_url 
         FROM government_schemes 
         WHERE is_active = TRUE 
         ORDER BY created_at DESC LIMIT 3`
      );
      
      // Get top suggestions (3 items)
      const [suggestions] = await pool.query(
        `SELECT s.id, s.title, s.category, s.upvotes, s.status, s.image_url, u.name as user_name
         FROM public_suggestions s 
         LEFT JOIN users u ON s.user_id = u.id
         WHERE s.status != 'rejected'
         ORDER BY s.upvotes DESC, s.created_at DESC LIMIT 3`
      );
      
      res.json({
        success: true,
        data: {
          news,
          alerts,
          announcements,
          events,
          nextMeeting,
          activePoll,
          works,
          schemes,
          suggestions
        }
      });
    } catch (error) {
      console.error('Error fetching home data:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch home data' });
    }
  }
};

module.exports = engagementController;

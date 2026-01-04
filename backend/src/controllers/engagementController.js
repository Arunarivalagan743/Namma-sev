// Engagement Controller - MongoDB Version
const { FAQ, NewsUpdate } = require('../models/FAQ');
const { GramSabhaMeeting, MeetingRsvp } = require('../models/Meeting');
const { GovernmentScheme, SchemeBookmark } = require('../models/Scheme');
const { Poll, PollOption, PollVote } = require('../models/Poll');
const { BudgetCategory, BudgetEntry } = require('../models/Budget');
const { CommunityEvent } = require('../models/CommunityEvent');
const { PanchayatWork, WorkProgressUpdate } = require('../models/PanchayatWork');
const { EmergencyAlert } = require('../models/EmergencyAlert');
const { PublicSuggestion, SuggestionUpvote } = require('../models/Suggestion');
const User = require('../models/User');

// ============ HOME DATA ============
const getHomeData = async (req, res) => {
  try {
    const [news, meetings, schemes, polls, events, alerts, works, suggestions] = await Promise.all([
      NewsUpdate.find({ isPublished: true }).sort({ createdAt: -1 }).limit(5),
      GramSabhaMeeting.find({ status: 'upcoming' }).sort({ meetingDate: 1 }).limit(3),
      GovernmentScheme.find({ isActive: true }).sort({ createdAt: -1 }).limit(5),
      Poll.find({ status: 'active' }).sort({ createdAt: -1 }).limit(3),
      CommunityEvent.find({ eventDate: { $gte: new Date() } }).sort({ eventDate: 1 }).limit(5),
      EmergencyAlert.find({ isActive: true }).sort({ createdAt: -1 }).limit(5),
      PanchayatWork.find().sort({ createdAt: -1 }).limit(5),
      PublicSuggestion.find().sort({ createdAt: -1 }).limit(5)
    ]);
    
    // Transform news with proper field names
    const transformedNews = news.map(n => ({
      ...n.toObject(),
      id: n._id,
      created_at: n.createdAt,
      published_at: n.publishDate || n.createdAt,
      image_url: n.imageUrl
    }));
    
    // Transform alerts with proper field names
    const transformedAlerts = alerts.map(a => ({
      ...a.toObject(),
      id: a._id,
      created_at: a.createdAt,
      alert_type: a.alertType,
      is_active: a.isActive
    }));
    
    // Transform works with proper field names
    const transformedWorks = works.map(w => ({
      ...w.toObject(),
      id: w._id,
      progress_percentage: w.progressPercentage || 0,
      budget_amount: w.budgetAmount || 0,
      start_date: w.startDate,
      expected_completion: w.expectedCompletion,
      created_at: w.createdAt
    }));
    
    // Transform schemes with proper field names
    const transformedSchemes = schemes.map(s => ({
      ...s.toObject(),
      id: s._id,
      last_date: s.lastDate,
      created_at: s.createdAt
    }));
    
    // Transform events with proper field names  
    const transformedEvents = events.map(e => ({
      ...e.toObject(),
      id: e._id,
      event_date: e.eventDate,
      event_type: e.eventType,
      is_free: e.isFree,
      created_at: e.createdAt
    }));
    
    // Transform suggestions with proper field names - fetch user names
    const suggestionUserIds = [...new Set(suggestions.map(s => s.userId))];
    const suggestionUsers = await User.find({ _id: { $in: suggestionUserIds } }).lean();
    const suggestionUserMap = {};
    suggestionUsers.forEach(u => { suggestionUserMap[u._id] = u; });
    
    const transformedSuggestions = suggestions.map(s => {
      const user = suggestionUserMap[s.userId];
      return {
        ...s.toObject(),
        id: s._id,
        user_name: user?.name || 'குடிமக்கள்',
        created_at: s.createdAt,
        image_url: s.imageUrl,
        admin_remarks: s.adminRemarks
      };
    });

    // Transform meetings with proper field names
    const transformedMeetings = meetings.map(m => ({
      ...m.toObject(),
      id: m._id,
      meeting_date: m.meetingDate,
      meeting_time: m.meetingTime,
      created_at: m.createdAt
    }));

    // Get next upcoming meeting
    const nextMeeting = meetings.length > 0 ? { 
      ...meetings[0].toObject(), 
      id: meetings[0]._id,
      meeting_date: meetings[0].meetingDate,
      meeting_time: meetings[0].meetingTime
    } : null;
    
    // Get active poll with options
    let activePoll = null;
    if (polls.length > 0) {
      const poll = polls[0];
      const options = await PollOption.find({ pollId: poll._id });
      const totalVotes = options.reduce((sum, opt) => sum + (opt.voteCount || 0), 0);
      activePoll = {
        ...poll.toObject(),
        id: poll._id,
        options: options.map(opt => ({ 
          ...opt.toObject(), 
          id: opt._id, 
          option_text: opt.optionText,
          vote_count: opt.voteCount || 0 
        })),
        total_votes: totalVotes
      };
    }

    res.json({
      success: true,
      data: { 
        news: transformedNews, 
        meetings: transformedMeetings, 
        schemes: transformedSchemes, 
        polls: polls.map(p => ({ ...p.toObject(), id: p._id })), 
        events: transformedEvents, 
        alerts: transformedAlerts,
        works: transformedWorks,
        suggestions: transformedSuggestions,
        nextMeeting,
        activePoll,
        announcements: transformedNews // Use news as announcements too
      }
    });
  } catch (error) {
    console.error('Error fetching home data:', error.message, error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch home data',
      error: error.message 
    });
  }
};

// ============ NEWS ============
const getNews = async (req, res) => {
  try {
    const news = await NewsUpdate.find({ isPublished: true }).sort({ createdAt: -1 });
    // Add proper field names for frontend compatibility
    const transformedNews = news.map(n => ({ 
      ...n.toObject(), 
      id: n._id,
      created_at: n.createdAt,
      published_at: n.publishDate || n.createdAt,
      image_url: n.imageUrl
    }));
    res.json({ success: true, data: transformedNews });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch news' });
  }
};

const createNews = async (req, res) => {
  try {
    const { title, content, category, isUrgent } = req.body;
    const news = new NewsUpdate({
      title,
      content,
      category: category || 'announcement',
      isUrgent: isUrgent || false,
      isActive: true,
      createdBy: req.user.id
    });
    await news.save();
    res.status(201).json({ success: true, data: news, message: 'News created successfully' });
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({ success: false, message: 'Failed to create news' });
  }
};

const updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await NewsUpdate.findByIdAndUpdate(id, req.body, { new: true });
    if (!news) {
      return res.status(404).json({ success: false, message: 'News not found' });
    }
    res.json({ success: true, data: news, message: 'News updated successfully' });
  } catch (error) {
    console.error('Error updating news:', error);
    res.status(500).json({ success: false, message: 'Failed to update news' });
  }
};

const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    await NewsUpdate.findByIdAndDelete(id);
    res.json({ success: true, message: 'News deleted successfully' });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({ success: false, message: 'Failed to delete news' });
  }
};

// ============ MEETINGS ============
const getMeetings = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const meetings = await GramSabhaMeeting.find().sort({ meetingDate: -1 });
    
    // Get user's RSVPs if logged in
    let userRsvps = [];
    if (userId) {
      userRsvps = await MeetingRsvp.find({ userId });
    }
    
    // Transform fields for frontend compatibility
    const transformedMeetings = meetings.map(m => {
      const obj = m.toObject();
      const userRsvp = userRsvps.find(r => r.meetingId === m._id || r.meetingId === m._id.toString());
      return {
        ...obj,
        id: m._id,
        meeting_date: obj.meetingDate, // Frontend expects meeting_date
        meeting_time: obj.meetingTime, // Frontend expects meeting_time
        rsvp_yes: obj.attendanceCount || 0,
        rsvp_no: 0,
        user_rsvp: userRsvp ? userRsvp.willAttend : null
      };
    });
    res.json({ success: true, data: transformedMeetings });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch meetings' });
  }
};

const createMeeting = async (req, res) => {
  try {
    const { title, description, meetingDate, meetingTime, venue, agenda } = req.body;
    const meeting = new GramSabhaMeeting({
      title,
      description,
      meetingDate,
      meetingTime,
      venue,
      agenda,
      status: 'upcoming',
      createdBy: req.user.id
    });
    await meeting.save();
    res.status(201).json({ success: true, data: meeting, message: 'Meeting created successfully' });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ success: false, message: 'Failed to create meeting' });
  }
};

const updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await GramSabhaMeeting.findByIdAndUpdate(id, req.body, { new: true });
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    res.json({ success: true, data: meeting, message: 'Meeting updated successfully' });
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ success: false, message: 'Failed to update meeting' });
  }
};

const deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    await GramSabhaMeeting.findByIdAndDelete(id);
    res.json({ success: true, message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ success: false, message: 'Failed to delete meeting' });
  }
};

const rsvpMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;
    const { willAttend } = req.body;
    
    const meeting = await GramSabhaMeeting.findById(id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    
    // Check if user already RSVP'd
    const existingRsvp = await MeetingRsvp.findOne({ meetingId: id, userId });
    
    if (existingRsvp) {
      // Update existing RSVP
      const oldResponse = existingRsvp.willAttend;
      existingRsvp.willAttend = willAttend || 'yes';
      await existingRsvp.save();
      
      // Update attendance count if response changed
      if (oldResponse === 'yes' && willAttend !== 'yes') {
        meeting.attendanceCount = Math.max(0, (meeting.attendanceCount || 0) - 1);
        await meeting.save();
      } else if (oldResponse !== 'yes' && willAttend === 'yes') {
        meeting.attendanceCount = (meeting.attendanceCount || 0) + 1;
        await meeting.save();
      }
      
      return res.json({ success: true, message: 'RSVP updated successfully', alreadyRegistered: true });
    }
    
    // Create new RSVP
    const rsvp = new MeetingRsvp({
      meetingId: id,
      userId,
      willAttend: willAttend || 'yes'
    });
    await rsvp.save();
    
    // Increment attendance count for 'yes' responses
    if (willAttend === 'yes' || !willAttend) {
      meeting.attendanceCount = (meeting.attendanceCount || 0) + 1;
      await meeting.save();
    }
    
    res.json({ success: true, message: 'RSVP successful' });
  } catch (error) {
    console.error('Error processing RSVP:', error);
    res.status(500).json({ success: false, message: 'Failed to process RSVP' });
  }
};

// ============ SCHEMES ============
const getSchemes = async (req, res) => {
  try {
    const schemes = await GovernmentScheme.find({ isActive: true }).sort({ createdAt: -1 });
    // Add 'id' field for frontend compatibility
    const transformedSchemes = schemes.map(s => ({ ...s.toObject(), id: s._id }));
    res.json({ success: true, data: transformedSchemes });
  } catch (error) {
    console.error('Error fetching schemes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch schemes' });
  }
};

const createScheme = async (req, res) => {
  try {
    const { name, description, eligibility, documentsRequired, benefits, lastDate, category } = req.body;
    const scheme = new GovernmentScheme({
      name,
      description,
      eligibility,
      documentsRequired,
      benefits,
      lastDate,
      category,
      isActive: true,
      createdBy: req.user.id
    });
    await scheme.save();
    res.status(201).json({ success: true, data: scheme, message: 'Scheme created successfully' });
  } catch (error) {
    console.error('Error creating scheme:', error);
    res.status(500).json({ success: false, message: 'Failed to create scheme' });
  }
};

const updateScheme = async (req, res) => {
  try {
    const { id } = req.params;
    const scheme = await GovernmentScheme.findByIdAndUpdate(id, req.body, { new: true });
    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Scheme not found' });
    }
    res.json({ success: true, data: scheme, message: 'Scheme updated successfully' });
  } catch (error) {
    console.error('Error updating scheme:', error);
    res.status(500).json({ success: false, message: 'Failed to update scheme' });
  }
};

const deleteScheme = async (req, res) => {
  try {
    const { id } = req.params;
    await GovernmentScheme.findByIdAndDelete(id);
    res.json({ success: true, message: 'Scheme deleted successfully' });
  } catch (error) {
    console.error('Error deleting scheme:', error);
    res.status(500).json({ success: false, message: 'Failed to delete scheme' });
  }
};

const bookmarkScheme = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const existing = await SchemeBookmark.findOne({ schemeId: id, userId });
    if (existing) {
      await SchemeBookmark.deleteOne({ schemeId: id, userId });
      return res.json({ success: true, message: 'Bookmark removed' });
    }
    
    const bookmark = new SchemeBookmark({ schemeId: id, userId });
    await bookmark.save();
    res.json({ success: true, message: 'Scheme bookmarked successfully' });
  } catch (error) {
    console.error('Error bookmarking scheme:', error);
    res.status(500).json({ success: false, message: 'Failed to bookmark scheme' });
  }
};

// ============ ALERTS ============
const getAlerts = async (req, res) => {
  try {
    const alerts = await EmergencyAlert.find({ isActive: true }).sort({ createdAt: -1 });
    // Add 'id' field for frontend compatibility
    const transformedAlerts = alerts.map(a => ({ ...a.toObject(), id: a._id }));
    res.json({ success: true, data: transformedAlerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch alerts' });
  }
};

const createAlert = async (req, res) => {
  try {
    const { title, message, alertType, severity, expiresAt } = req.body;
    const alert = new EmergencyAlert({
      title,
      message,
      alertType: alertType || 'general',
      severity: severity || 'medium',
      expiresAt,
      isActive: true,
      createdBy: req.user.id
    });
    await alert.save();
    res.status(201).json({ success: true, data: alert, message: 'Alert created successfully' });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ success: false, message: 'Failed to create alert' });
  }
};

const updateAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await EmergencyAlert.findByIdAndUpdate(id, req.body, { new: true });
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }
    res.json({ success: true, data: alert, message: 'Alert updated successfully' });
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ success: false, message: 'Failed to update alert' });
  }
};

const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    await EmergencyAlert.findByIdAndDelete(id);
    res.json({ success: true, message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ success: false, message: 'Failed to delete alert' });
  }
};

// ============ POLLS ============
const getPolls = async (req, res) => {
  try {
    const polls = await Poll.find({ status: 'active' }).sort({ createdAt: -1 });
    
    const pollsWithOptions = await Promise.all(polls.map(async (poll) => {
      const options = await PollOption.find({ pollId: poll._id });
      const totalVotes = options.reduce((sum, opt) => sum + (opt.voteCount || 0), 0);
      
      // Transform options to include 'id' field and snake_case fields for frontend compatibility
      const transformedOptions = options.map(opt => ({
        ...opt.toObject(),
        id: opt._id,
        option_text: opt.optionText,
        vote_count: opt.voteCount || 0
      }));
      
      return { 
        ...poll.toObject(), 
        id: poll._id,
        options: transformedOptions,
        total_votes: totalVotes
      };
    }));
    
    res.json({ success: true, data: pollsWithOptions });
  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch polls' });
  }
};

const createPoll = async (req, res) => {
  try {
    const { question, description, options, endsAt, allowMultiple } = req.body;
    
    const poll = new Poll({
      question,
      description,
      status: 'active',
      allowMultiple: allowMultiple || false,
      endsAt,
      createdBy: req.user.id
    });
    await poll.save();
    
    if (options && options.length > 0) {
      for (const optionText of options) {
        const option = new PollOption({
          pollId: poll._id,
          optionText,
          voteCount: 0
        });
        await option.save();
      }
    }
    
    res.status(201).json({ success: true, data: poll, message: 'Poll created successfully' });
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ success: false, message: 'Failed to create poll' });
  }
};

const updatePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const poll = await Poll.findByIdAndUpdate(id, req.body, { new: true });
    if (!poll) {
      return res.status(404).json({ success: false, message: 'Poll not found' });
    }
    res.json({ success: true, data: poll, message: 'Poll updated successfully' });
  } catch (error) {
    console.error('Error updating poll:', error);
    res.status(500).json({ success: false, message: 'Failed to update poll' });
  }
};

const deletePoll = async (req, res) => {
  try {
    const { id } = req.params;
    await PollOption.deleteMany({ pollId: id });
    await PollVote.deleteMany({ pollId: id });
    await Poll.findByIdAndDelete(id);
    res.json({ success: true, message: 'Poll deleted successfully' });
  } catch (error) {
    console.error('Error deleting poll:', error);
    res.status(500).json({ success: false, message: 'Failed to delete poll' });
  }
};

const votePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const optionId = req.body.optionId || req.body.option_id;
    const userId = req.user.id || req.user._id;
    
    if (!optionId) {
      return res.status(400).json({ success: false, message: 'Option ID is required' });
    }
    
    const existingVote = await PollVote.findOne({ pollId: id, userId });
    if (existingVote) {
      return res.status(400).json({ success: false, message: 'You have already voted' });
    }
    
    const vote = new PollVote({
      pollId: id,
      optionId,
      userId
    });
    await vote.save();
    
    await PollOption.findByIdAndUpdate(optionId, { $inc: { voteCount: 1 } });
    
    res.json({ success: true, message: 'Vote recorded successfully' });
  } catch (error) {
    console.error('Error voting:', error);
    res.status(500).json({ success: false, message: 'Failed to record vote' });
  }
};

// ============ EVENTS ============
const getEvents = async (req, res) => {
  try {
    const { upcoming, event_type } = req.query;
    let query = {};
    
    if (upcoming === 'true') {
      query.eventDate = { $gte: new Date() };
    }
    
    if (event_type && event_type !== 'all') {
      query.eventType = event_type;
    }
    
    const events = await CommunityEvent.find(query).sort({ eventDate: 1 });
    // Add 'id' field and transform field names for frontend compatibility
    const transformedEvents = events.map(e => ({
      ...e.toObject(),
      id: e._id,
      event_date: e.eventDate,
      start_time: e.startTime,
      end_time: e.endTime,
      end_date: e.endDate,
      event_type: e.eventType,
      image_url: e.imageUrl,
      is_free: e.isFree,
      registration_required: e.registrationRequired,
      max_participants: e.maxParticipants,
      current_participants: e.currentParticipants,
      contact_info: e.contactInfo
    }));
    res.json({ success: true, data: transformedEvents });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
};

const createEvent = async (req, res) => {
  try {
    const { title, description, eventDate, eventTime, venue, category, imageUrl } = req.body;
    const event = new CommunityEvent({
      title,
      description,
      eventDate,
      eventTime,
      venue,
      category: category || 'general',
      imageUrl,
      isActive: true,
      createdBy: req.user.id
    });
    await event.save();
    res.status(201).json({ success: true, data: event, message: 'Event created successfully' });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ success: false, message: 'Failed to create event' });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await CommunityEvent.findByIdAndUpdate(id, req.body, { new: true });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, data: event, message: 'Event updated successfully' });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ success: false, message: 'Failed to update event' });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    await CommunityEvent.findByIdAndDelete(id);
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ success: false, message: 'Failed to delete event' });
  }
};

// ============ WORKS ============
const getWorks = async (req, res) => {
  try {
    const { status, work_type } = req.query;
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (work_type && work_type !== 'all') {
      query.workType = work_type;
    }
    
    const works = await PanchayatWork.find(query).sort({ createdAt: -1 });
    // Transform field names for frontend compatibility
    const transformedWorks = works.map(w => ({
      ...w.toObject(),
      id: w._id,
      work_type: w.workType,
      start_date: w.startDate,
      expected_completion: w.expectedCompletion,
      actual_completion: w.actualCompletion,
      budget_amount: w.budgetAmount,
      spent_amount: w.spentAmount,
      progress_percentage: w.progressPercentage,
      image_url: w.imageUrl
    }));
    res.json({ success: true, data: transformedWorks });
  } catch (error) {
    console.error('Error fetching works:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch works' });
  }
};

const createWork = async (req, res) => {
  try {
    const { title, description, location, estimatedCost, startDate, expectedEndDate, contractor, category } = req.body;
    const work = new PanchayatWork({
      title,
      description,
      location,
      estimatedCost,
      startDate,
      expectedEndDate,
      contractor,
      category: category || 'infrastructure',
      status: 'planned',
      progressPercentage: 0,
      isActive: true,
      createdBy: req.user.id
    });
    await work.save();
    res.status(201).json({ success: true, data: work, message: 'Work created successfully' });
  } catch (error) {
    console.error('Error creating work:', error);
    res.status(500).json({ success: false, message: 'Failed to create work' });
  }
};

const updateWork = async (req, res) => {
  try {
    const { id } = req.params;
    const work = await PanchayatWork.findByIdAndUpdate(id, req.body, { new: true });
    if (!work) {
      return res.status(404).json({ success: false, message: 'Work not found' });
    }
    res.json({ success: true, data: work, message: 'Work updated successfully' });
  } catch (error) {
    console.error('Error updating work:', error);
    res.status(500).json({ success: false, message: 'Failed to update work' });
  }
};

const deleteWork = async (req, res) => {
  try {
    const { id } = req.params;
    await PanchayatWork.findByIdAndDelete(id);
    res.json({ success: true, message: 'Work deleted successfully' });
  } catch (error) {
    console.error('Error deleting work:', error);
    res.status(500).json({ success: false, message: 'Failed to delete work' });
  }
};

const addWorkProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progressPercentage, description, imageUrl } = req.body;
    
    const work = await PanchayatWork.findById(id);
    if (!work) {
      return res.status(404).json({ success: false, message: 'Work not found' });
    }
    
    work.progressPercentage = progressPercentage;
    if (progressPercentage >= 100) {
      work.status = 'completed';
    } else if (progressPercentage > 0) {
      work.status = 'in_progress';
    }
    
    await work.save();
    res.json({ success: true, data: work, message: 'Progress updated successfully' });
  } catch (error) {
    console.error('Error adding work progress:', error);
    res.status(500).json({ success: false, message: 'Failed to add work progress' });
  }
};

// ============ BUDGET ============
const getBudget = async (req, res) => {
  try {
    const { fiscal_year } = req.query;
    const categories = await BudgetCategory.find().sort({ displayOrder: 1 });
    
    // Build query for entries
    const entriesQuery = {};
    if (fiscal_year) {
      entriesQuery.fiscalYear = fiscal_year;
    }
    const entries = await BudgetEntry.find(entriesQuery).sort({ fiscalYear: -1 });
    
    const budgetData = categories.map(cat => {
      // Compare ObjectIds properly using toString()
      const catEntries = entries.filter(e => e.categoryId.toString() === cat._id.toString());
      const totalAllocated = catEntries.reduce((sum, e) => sum + (e.allocatedAmount || 0), 0);
      const totalSpent = catEntries.reduce((sum, e) => sum + (e.spentAmount || 0), 0);
      return {
        ...cat.toObject(),
        id: cat._id,
        name: cat.name,
        allocatedAmount: totalAllocated,
        spentAmount: totalSpent,
        entries: catEntries.map(e => ({ ...e.toObject(), id: e._id }))
      };
    });
    
    res.json({ success: true, data: budgetData });
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch budget' });
  }
};

const updateBudget = async (req, res) => {
  try {
    const { categoryId, allocatedAmount, spentAmount, fiscalYear, description } = req.body;
    
    let entry = await BudgetEntry.findOne({ categoryId, fiscalYear });
    if (entry) {
      entry.allocatedAmount = allocatedAmount;
      entry.spentAmount = spentAmount;
      entry.description = description;
    } else {
      entry = new BudgetEntry({
        categoryId,
        allocatedAmount,
        spentAmount: spentAmount || 0,
        fiscalYear,
        description,
        createdBy: req.user.id
      });
    }
    await entry.save();
    
    res.json({ success: true, data: entry, message: 'Budget updated successfully' });
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ success: false, message: 'Failed to update budget' });
  }
};

const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    await BudgetEntry.findByIdAndDelete(id);
    res.json({ success: true, message: 'Budget entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ success: false, message: 'Failed to delete budget entry' });
  }
};

// ============ FAQS ============
const getFaqs = async (req, res) => {
  try {
    const { category } = req.query;
    const query = { isActive: true };
    if (category && category !== 'all') {
      query.category = category;
    }
    const faqs = await FAQ.find(query).sort({ displayOrder: 1 });
    // Add 'id' field for frontend compatibility
    const transformedFaqs = faqs.map(f => ({ ...f.toObject(), id: f._id }));
    res.json({ success: true, data: transformedFaqs });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch FAQs' });
  }
};

const createFaq = async (req, res) => {
  try {
    const { question, answer, category, displayOrder } = req.body;
    const faq = new FAQ({
      question,
      answer,
      category: category || 'general',
      displayOrder: displayOrder || 0,
      isActive: true,
      createdBy: req.user.id
    });
    await faq.save();
    res.status(201).json({ success: true, data: faq, message: 'FAQ created successfully' });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ success: false, message: 'Failed to create FAQ' });
  }
};

const updateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await FAQ.findByIdAndUpdate(id, req.body, { new: true });
    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }
    res.json({ success: true, data: faq, message: 'FAQ updated successfully' });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ success: false, message: 'Failed to update FAQ' });
  }
};

const deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;
    await FAQ.findByIdAndDelete(id);
    res.json({ success: true, message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ success: false, message: 'Failed to delete FAQ' });
  }
};

// ============ SUGGESTIONS ============
const getSuggestions = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { category } = req.query;
    
    let query = {};
    if (category && category !== 'all') {
      query.category = category;
    }
    
    const suggestions = await PublicSuggestion.find(query).sort({ createdAt: -1 });
    
    // Get all unique user IDs
    const userIds = [...new Set(suggestions.map(s => s.userId))];
    
    // Fetch all users at once
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = {};
    users.forEach(u => {
      userMap[u._id] = u;
    });
    
    // Get user's upvotes if logged in
    let userUpvoteIds = [];
    if (userId) {
      const userUpvotes = await SuggestionUpvote.find({ userId });
      userUpvoteIds = userUpvotes.map(u => String(u.suggestionId));
    }
    
    // Transform for frontend compatibility
    const transformedSuggestions = suggestions.map(s => {
      const obj = s.toObject();
      const user = userMap[obj.userId];
      const hasUpvoted = userUpvoteIds.includes(String(s._id));
      return {
        ...obj,
        id: s._id,
        user_name: user?.name || 'குடிமக்கள்',
        user_email: user?.email || '',
        image_url: obj.imageUrl,
        admin_remarks: obj.adminRemarks,
        created_at: obj.createdAt,
        user_upvoted: hasUpvoted
      };
    });
    res.json({ 
      success: true, 
      data: transformedSuggestions,
      userUpvotes: userUpvoteIds // Array of suggestion IDs the user has upvoted
    });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch suggestions' });
  }
};

const createSuggestion = async (req, res) => {
  try {
    const { title, description, category, location, image_url, imageUrl } = req.body;
    const suggestion = new PublicSuggestion({
      title,
      description,
      category: category || 'other',
      location,
      imageUrl: imageUrl || image_url,
      status: 'pending',
      upvotes: 0,
      userId: req.user.id || req.user._id
    });
    await suggestion.save();
    res.status(201).json({ success: true, data: suggestion, message: 'Suggestion submitted successfully' });
  } catch (error) {
    console.error('Error creating suggestion:', error);
    res.status(500).json({ success: false, message: 'Failed to submit suggestion' });
  }
};

const upvoteSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Login required to upvote' });
    }
    
    // Check if user has already upvoted
    const existingUpvote = await SuggestionUpvote.findOne({ suggestionId: id, userId });
    
    if (existingUpvote) {
      // User already upvoted - remove the upvote (toggle off)
      await SuggestionUpvote.deleteOne({ _id: existingUpvote._id });
      const suggestion = await PublicSuggestion.findByIdAndUpdate(
        id,
        { $inc: { upvotes: -1 } },
        { new: true }
      );
      return res.json({ 
        success: true, 
        action: 'removed',
        upvotes: suggestion.upvotes,
        data: { ...suggestion.toObject(), id: suggestion._id, user_upvoted: false },
        message: 'Upvote removed' 
      });
    }
    
    // Create new upvote
    const upvote = new SuggestionUpvote({
      suggestionId: id,
      userId
    });
    await upvote.save();
    
    const suggestion = await PublicSuggestion.findByIdAndUpdate(
      id,
      { $inc: { upvotes: 1 } },
      { new: true }
    );
    
    if (!suggestion) {
      return res.status(404).json({ success: false, message: 'Suggestion not found' });
    }
    
    res.json({ 
      success: true, 
      action: 'added',
      upvotes: suggestion.upvotes,
      data: { ...suggestion.toObject(), id: suggestion._id, user_upvoted: true },
      message: 'Upvote recorded' 
    });
  } catch (error) {
    console.error('Error upvoting suggestion:', error);
    res.status(500).json({ success: false, message: 'Failed to upvote suggestion' });
  }
};

const updateSuggestionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminResponse } = req.body;
    const suggestion = await PublicSuggestion.findByIdAndUpdate(
      id,
      { status, adminResponse, respondedAt: new Date() },
      { new: true }
    );
    if (!suggestion) {
      return res.status(404).json({ success: false, message: 'Suggestion not found' });
    }
    res.json({ success: true, data: suggestion, message: 'Suggestion status updated' });
  } catch (error) {
    console.error('Error updating suggestion status:', error);
    res.status(500).json({ success: false, message: 'Failed to update suggestion status' });
  }
};

module.exports = {
  getHomeData,
  getNews, createNews, updateNews, deleteNews,
  getMeetings, createMeeting, updateMeeting, deleteMeeting, rsvpMeeting,
  getSchemes, createScheme, updateScheme, deleteScheme, bookmarkScheme,
  getAlerts, createAlert, updateAlert, deleteAlert,
  getPolls, createPoll, updatePoll, deletePoll, votePoll,
  getEvents, createEvent, updateEvent, deleteEvent,
  getWorks, createWork, updateWork, deleteWork, addWorkProgress,
  getBudget, updateBudget, deleteBudget,
  getFaqs, createFaq, updateFaq, deleteFaq,
  getSuggestions, createSuggestion, upvoteSuggestion, updateSuggestionStatus
};

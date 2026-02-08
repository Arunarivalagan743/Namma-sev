// Export all models
const User = require('./User');
const Complaint = require('./Complaint');
const ComplaintHistory = require('./ComplaintHistory');
const Announcement = require('./Announcement');
const News = require('./News');

// Import engagement models
const { GramSabhaMeeting, MeetingRsvp } = require('./Meeting');
const { Poll, PollOption, PollVote } = require('./Poll');
const { GovernmentScheme, SchemeBookmark } = require('./Scheme');
const { EmergencyAlert } = require('./EmergencyAlert');
const { PublicSuggestion, SuggestionUpvote } = require('./Suggestion');
const { CommunityEvent } = require('./CommunityEvent');
const { PanchayatWork, WorkProgressUpdate } = require('./PanchayatWork');
const { BudgetCategory, BudgetEntry } = require('./Budget');
const { FAQ, NewsUpdate } = require('./FAQ');

// Phase 4: Multi-tenant models
const Tenant = require('./Tenant');
const TenantConfig = require('./TenantConfig');
const SuperAdmin = require('./SuperAdmin');
const TenantAuditLog = require('./TenantAuditLog');
const TenantBilling = require('./TenantBilling');

module.exports = {
  User,
  Complaint,
  ComplaintHistory,
  Announcement,
  News,
  GramSabhaMeeting,
  MeetingRsvp,
  Poll,
  PollOption,
  PollVote,
  GovernmentScheme,
  SchemeBookmark,
  EmergencyAlert,
  PublicSuggestion,
  SuggestionUpvote,
  CommunityEvent,
  PanchayatWork,
  WorkProgressUpdate,
  BudgetCategory,
  BudgetEntry,
  FAQ,
  NewsUpdate,
  // Phase 4: Multi-tenant models
  Tenant,
  TenantConfig,
  SuperAdmin,
  TenantAuditLog,
  TenantBilling
};
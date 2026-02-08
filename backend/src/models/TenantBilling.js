// filepath: /home/cykosynergy/projects/Namma-sev/backend/src/models/TenantBilling.js
const mongoose = require('mongoose');

/**
 * Tenant Billing Schema
 * Tracks usage metrics per tenant for cost allocation and billing
 */
const tenantBillingSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => require('uuid').v4()
  },

  // Tenant reference
  tenantId: {
    type: String,
    required: true,
    ref: 'Tenant',
    index: true
  },
  tenantCode: {
    type: String,
    required: true,
    index: true
  },

  // Billing period
  period: {
    year: { type: Number, required: true },
    month: { type: Number, required: true, min: 1, max: 12 }
  },

  // API Usage
  apiUsage: {
    totalRequests: { type: Number, default: 0 },
    authRequests: { type: Number, default: 0 },
    complaintRequests: { type: Number, default: 0 },
    announcementRequests: { type: Number, default: 0 },
    adminRequests: { type: Number, default: 0 },
    otherRequests: { type: Number, default: 0 }
  },

  // AI Inference Usage
  aiUsage: {
    classificationCalls: { type: Number, default: 0 },
    priorityCalls: { type: Number, default: 0 },
    duplicateCalls: { type: Number, default: 0 },
    searchCalls: { type: Number, default: 0 },
    templateCalls: { type: Number, default: 0 },
    trendsCalls: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 }
  },

  // Storage Usage (in bytes)
  storageUsage: {
    documents: { type: Number, default: 0 },
    images: { type: Number, default: 0 },
    backups: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },

  // Resource counts
  resourceCounts: {
    activeUsers: { type: Number, default: 0 },
    totalComplaints: { type: Number, default: 0 },
    totalAnnouncements: { type: Number, default: 0 },
    totalMeetings: { type: Number, default: 0 },
    totalPolls: { type: Number, default: 0 }
  },

  // Bandwidth (in bytes)
  bandwidth: {
    inbound: { type: Number, default: 0 },
    outbound: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },

  // Notifications sent
  notifications: {
    emails: { type: Number, default: 0 },
    sms: { type: Number, default: 0 },
    push: { type: Number, default: 0 }
  },

  // Cost calculation (in INR paise for precision)
  costs: {
    api: { type: Number, default: 0 },
    ai: { type: Number, default: 0 },
    storage: { type: Number, default: 0 },
    bandwidth: { type: Number, default: 0 },
    notifications: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },

  // Subscription details snapshot
  subscriptionSnapshot: {
    plan: { type: String },
    maxUsers: { type: Number },
    maxComplaints: { type: Number },
    maxStorageMB: { type: Number }
  },

  // Billing status
  status: {
    type: String,
    enum: ['draft', 'finalized', 'invoiced', 'paid', 'overdue'],
    default: 'draft'
  },

  // Invoice reference
  invoiceId: { type: String },
  invoiceDate: { type: Date },
  paidDate: { type: Date },

  // Notes
  notes: { type: String }

}, {
  timestamps: true,
  collection: 'tenant_billing'
});

// Compound indexes
tenantBillingSchema.index({ tenantId: 1, 'period.year': 1, 'period.month': 1 }, { unique: true });
tenantBillingSchema.index({ 'period.year': 1, 'period.month': 1 });
tenantBillingSchema.index({ status: 1 });

// Methods
tenantBillingSchema.methods.incrementApiUsage = async function(category = 'otherRequests', count = 1) {
  const update = {};
  update[`apiUsage.${category}`] = count;
  update['apiUsage.totalRequests'] = count;

  await this.updateOne({ $inc: update });
};

tenantBillingSchema.methods.incrementAIUsage = async function(category, count = 1, tokens = 0) {
  const update = {
    [`aiUsage.${category}`]: count
  };
  if (tokens > 0) {
    update['aiUsage.totalTokens'] = tokens;
  }

  await this.updateOne({ $inc: update });
};

tenantBillingSchema.methods.updateStorageUsage = async function(storageData) {
  const total = (storageData.documents || 0) +
                (storageData.images || 0) +
                (storageData.backups || 0);

  await this.updateOne({
    $set: {
      'storageUsage.documents': storageData.documents || this.storageUsage.documents,
      'storageUsage.images': storageData.images || this.storageUsage.images,
      'storageUsage.backups': storageData.backups || this.storageUsage.backups,
      'storageUsage.total': total
    }
  });
};

tenantBillingSchema.methods.calculateCosts = async function(rates) {
  // Default rates (in paise per unit)
  const defaultRates = {
    apiPerThousand: 10,           // ₹0.10 per 1000 API calls
    aiPerThousand: 100,           // ₹1.00 per 1000 AI calls
    storagePerGBMonth: 500,       // ₹5.00 per GB/month
    bandwidthPerGB: 100,          // ₹1.00 per GB
    emailPerThousand: 50,         // ₹0.50 per 1000 emails
    smsEach: 25,                  // ₹0.25 per SMS
    ...rates
  };

  const costs = {
    api: Math.ceil((this.apiUsage.totalRequests / 1000) * defaultRates.apiPerThousand),
    ai: Math.ceil(
      ((this.aiUsage.classificationCalls +
        this.aiUsage.priorityCalls +
        this.aiUsage.duplicateCalls +
        this.aiUsage.searchCalls +
        this.aiUsage.templateCalls +
        this.aiUsage.trendsCalls) / 1000) * defaultRates.aiPerThousand
    ),
    storage: Math.ceil((this.storageUsage.total / (1024 * 1024 * 1024)) * defaultRates.storagePerGBMonth),
    bandwidth: Math.ceil((this.bandwidth.total / (1024 * 1024 * 1024)) * defaultRates.bandwidthPerGB),
    notifications:
      Math.ceil((this.notifications.emails / 1000) * defaultRates.emailPerThousand) +
      (this.notifications.sms * defaultRates.smsEach)
  };

  costs.total = costs.api + costs.ai + costs.storage + costs.bandwidth + costs.notifications;

  this.costs = costs;
  return this.save();
};

tenantBillingSchema.methods.finalize = async function() {
  await this.calculateCosts();
  this.status = 'finalized';
  return this.save();
};

// Statics
tenantBillingSchema.statics.getOrCreateCurrent = async function(tenantId, tenantCode) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  let billing = await this.findOne({
    tenantId,
    'period.year': year,
    'period.month': month
  });

  if (!billing) {
    billing = new this({
      tenantId,
      tenantCode,
      period: { year, month }
    });
    await billing.save();
  }

  return billing;
};

tenantBillingSchema.statics.incrementUsage = async function(tenantId, tenantCode, category, subcategory, count = 1) {
  const billing = await this.getOrCreateCurrent(tenantId, tenantCode);

  const update = {};
  update[`${category}.${subcategory}`] = count;
  if (category === 'apiUsage') {
    update['apiUsage.totalRequests'] = count;
  }

  await this.updateOne(
    { _id: billing._id },
    { $inc: update }
  );
};

tenantBillingSchema.statics.getTenantHistory = function(tenantId, months = 12) {
  return this.find({ tenantId })
    .sort({ 'period.year': -1, 'period.month': -1 })
    .limit(months);
};

tenantBillingSchema.statics.getPlatformSummary = async function(year, month) {
  return this.aggregate([
    {
      $match: {
        'period.year': year,
        'period.month': month
      }
    },
    {
      $group: {
        _id: null,
        totalTenants: { $sum: 1 },
        totalApiRequests: { $sum: '$apiUsage.totalRequests' },
        totalAICalls: {
          $sum: {
            $add: [
              '$aiUsage.classificationCalls',
              '$aiUsage.priorityCalls',
              '$aiUsage.duplicateCalls',
              '$aiUsage.searchCalls'
            ]
          }
        },
        totalStorage: { $sum: '$storageUsage.total' },
        totalCost: { $sum: '$costs.total' }
      }
    }
  ]);
};

module.exports = mongoose.model('TenantBilling', tenantBillingSchema);


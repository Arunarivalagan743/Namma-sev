const mongoose = require('mongoose');

// Budget Category Schema
const budgetCategorySchema = new mongoose.Schema({
  _id: {
    type: Number,
    default: () => Math.floor(Math.random() * 1000000)
  },
  name: {
    type: String,
    required: true,
    maxLength: 100
  },
  icon: {
    type: String,
    maxLength: 50
  },
  color: {
    type: String,
    maxLength: 20
  },
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: false,
  collection: 'budget_categories'
});

// Budget Entry Schema
const budgetEntrySchema = new mongoose.Schema({
  _id: {
    type: Number,
    default: () => Math.floor(Math.random() * 1000000)
  },
  fiscalYear: {
    type: String,
    required: true,
    maxLength: 10
  },
  categoryId: {
    type: Number,
    required: true,
    ref: 'BudgetCategory'
  },
  allocatedAmount: {
    type: Number,
    required: true
  },
  spentAmount: {
    type: Number,
    default: 0
  },
  description: {
    type: String
  },
  createdBy: {
    type: String,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'budget_entries'
});

const BudgetCategory = mongoose.model('BudgetCategory', budgetCategorySchema);
const BudgetEntry = mongoose.model('BudgetEntry', budgetEntrySchema);

module.exports = {
  BudgetCategory,
  BudgetEntry
};
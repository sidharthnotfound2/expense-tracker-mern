const mongoose = require('mongoose');

const CATEGORIES = ['Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Education', 'Other'];

const expenseSchema = new mongoose.Schema(
  {
    // reference to the owner, so every query can be limited to one user
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: String, enum: CATEGORIES, default: 'Other' },
    date: { type: Date, default: Date.now },
    note: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

// most queries list one user's expenses newest first
expenseSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
module.exports.CATEGORIES = CATEGORIES;

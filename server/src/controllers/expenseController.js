const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const { CATEGORIES } = Expense;
const { validateExpense } = require('../utils/validators');

const MAX_LIMIT = 50;

// Builds the filter for list and summary: always limited to the logged-in user
function buildFilter(req) {
  const filter = { user: req.userId };

  const { category, month } = req.query;
  if (typeof category === 'string' && CATEGORIES.includes(category)) {
    filter.category = category;
  }
  // month looks like 2026-10
  if (typeof month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    const [year, mon] = month.split('-').map(Number);
    filter.date = { $gte: new Date(Date.UTC(year, mon - 1, 1)), $lt: new Date(Date.UTC(year, mon, 1)) };
  }
  return filter;
}

// POST /api/expenses
async function createExpense(req, res, next) {
  try {
    const error = validateExpense(req.body);
    if (error) return res.status(400).json({ message: error });

    const { title, amount, category, date, note } = req.body;
    const expense = await Expense.create({
      user: req.userId,
      title: title.trim(),
      amount: Number(amount),
      category,
      date: date || undefined,
      note,
    });
    res.status(201).json(expense);
  } catch (err) {
    next(err);
  }
}

// GET /api/expenses?page=1&limit=10&category=Food&month=2026-10
async function listExpenses(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), MAX_LIMIT);
    const filter = buildFilter(req);

    const [items, total] = await Promise.all([
      Expense.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Expense.countDocuments(filter),
    ]);

    res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

// GET /api/expenses/summary  -> total spent and total per category
async function summary(req, res, next) {
  try {
    const filter = buildFilter(req);
    filter.user = new mongoose.Types.ObjectId(req.userId);

    const rows = await Expense.aggregate([
      { $match: filter },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    const byCategory = rows.map((r) => ({
      category: r._id,
      total: Math.round(r.total * 100) / 100,
      count: r.count,
    }));
    const grandTotal = Math.round(byCategory.reduce((sum, r) => sum + r.total, 0) * 100) / 100;

    res.json({ total: grandTotal, byCategory });
  } catch (err) {
    next(err);
  }
}

// GET /api/expenses/:id
async function getExpense(req, res, next) {
  try {
    // filtering by user means other people's expenses look like "not found"
    const expense = await Expense.findOne({ _id: req.params.id, user: req.userId });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  } catch (err) {
    next(err);
  }
}

// PUT /api/expenses/:id
async function updateExpense(req, res, next) {
  try {
    const error = validateExpense(req.body);
    if (error) return res.status(400).json({ message: error });

    const { title, amount, category, date, note } = req.body;
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { title: title.trim(), amount: Number(amount), category, date: date || undefined, note },
      { new: true, runValidators: true }
    );
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/expenses/:id
async function deleteExpense(req, res, next) {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { createExpense, listExpenses, summary, getExpense, updateExpense, deleteExpense };

const { CATEGORIES } = require('../models/Expense');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Each function returns an error message string, or null when the input is fine.

function validateRegister(body) {
  const { name, email, password } = body || {};
  if (typeof name !== 'string' || name.trim().length < 2) return 'Name must be at least 2 characters';
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) return 'Enter a valid email address';
  if (typeof password !== 'string' || password.length < 8) return 'Password must be at least 8 characters';
  return null;
}

function validateLogin(body) {
  const { email, password } = body || {};
  // typeof checks also stop NoSQL operator injection such as { "$gt": "" }
  if (typeof email !== 'string' || typeof password !== 'string') return 'Email and password are required';
  if (!email.trim() || !password) return 'Email and password are required';
  return null;
}

function validateExpense(body) {
  const { title, amount, category, date, note } = body || {};
  if (typeof title !== 'string' || !title.trim()) return 'Title is required';
  if (title.trim().length > 100) return 'Title must be 100 characters or less';

  const amt = Number(amount);
  if (amount === undefined || amount === '' || Number.isNaN(amt) || amt <= 0) {
    return 'Amount must be a number greater than 0';
  }

  if (category !== undefined && !CATEGORIES.includes(category)) return 'Invalid category';

  if (date !== undefined && date !== '' && Number.isNaN(new Date(date).getTime())) {
    return 'Invalid date';
  }

  if (note !== undefined && (typeof note !== 'string' || note.length > 300)) {
    return 'Note must be text up to 300 characters';
  }
  return null;
}

module.exports = { validateRegister, validateLogin, validateExpense };

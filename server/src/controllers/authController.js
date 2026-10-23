const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateRegister, validateLogin } = require('../utils/validators');

function createToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email };
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const error = validateRegister(req.body);
    if (error) return res.status(400).json({ message: error });

    const email = req.body.email.trim().toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email is already registered' });

    const hashed = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({ name: req.body.name.trim(), email, password: hashed });

    res.status(201).json({ token: createToken(user._id), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const error = validateLogin(req.body);
    if (error) return res.status(400).json({ message: error });

    const user = await User.findOne({ email: req.body.email.trim().toLowerCase() });
    const ok = user && (await bcrypt.compare(req.body.password, user.password));
    // same message for wrong email and wrong password
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

    res.json({ token: createToken(user._id), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
async function me(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ message: 'Please log in again' });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };

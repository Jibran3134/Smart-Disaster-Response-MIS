// ============================================================
// routes/auth.js — Login & Register Routes
// ============================================================
// This file handles user registration and login.
//
// POST /api/auth/register — Create a new user account
// POST /api/auth/login    — Login and get a JWT token
// GET  /api/auth/me       — Get current user info (requires token)
//
// Uses:
//   - bcryptjs to hash passwords
//   - jsonwebtoken to create JWT tokens
//   - mssql to run SQL queries against SQL Server
// ============================================================

const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { getPool, sql } = require('../config/db');

const router = express.Router();


// ════════════════════════════════════════════════════════════
// POST /api/auth/register
// ════════════════════════════════════════════════════════════
// Creates a new user. Expects JSON body:
// {
//   "full_name": "Ali Khan",
//   "email": "ali@example.com",
//   "password": "mypassword",
//   "role_name": "Field Officer",
//   "phone_number": "0345-1234567"   (optional)
// }
router.post('/register', async (req, res) => {
  try {
    // ── Step 1: Get data from request body ──
    const { full_name, email, password, role_name, phone_number } = req.body;

    // ── Step 2: Validate required fields ──
    if (!full_name || !email || !password || !role_name) {
      return res.status(400).json({
        error: 'full_name, email, password, and role_name are required.'
      });
    }

    const pool = getPool();

    // ── Step 3: Check if email already exists ──
    const emailCheck = await pool.request()
      .input('email', sql.VarChar(100), email)
      .query('SELECT COUNT(*) AS cnt FROM Users WHERE email = @email');

    if (emailCheck.recordset[0].cnt > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // ── Step 4: Look up the role_id from the Role table ──
    // The role_name must match exactly: 'Administrator', 'Emergency Operator',
    // 'Field Officer', 'Warehouse Manager', or 'Finance Officer'
    const roleResult = await pool.request()
      .input('role_name', sql.VarChar(50), role_name)
      .query('SELECT role_id FROM Role WHERE role_name = @role_name');

    if (roleResult.recordset.length === 0) {
      return res.status(400).json({
        error: 'Invalid role. Must be one of: Administrator, Emergency Operator, Field Officer, Warehouse Manager, Finance Officer'
      });
    }

    const role_id = roleResult.recordset[0].role_id;

    // ── Step 5: Hash the password ──
    // bcrypt.hash(password, 10) → 10 is the salt rounds (higher = slower but safer)
    const password_hash = await bcrypt.hash(password, 10);

    // ── Step 6: Insert the new user into the database ──
    const insertResult = await pool.request()
      .input('role_id',       sql.Int,          role_id)
      .input('full_name',     sql.VarChar(100),  full_name)
      .input('email',         sql.VarChar(100),  email)
      .input('password_hash', sql.VarChar(255),  password_hash)
      .input('phone_number',  sql.VarChar(20),   phone_number || null)
      .query(`
        INSERT INTO Users (role_id, full_name, email, password_hash, status, phone_number)
        VALUES (@role_id, @full_name, @email, @password_hash, 'Active', @phone_number);

        SELECT CAST(SCOPE_IDENTITY() AS INT) AS user_id;
      `);

    const user_id = insertResult.recordset[0].user_id;

    // ── Step 7: Return success ──
    return res.status(201).json({
      message: 'Registration successful.',
      user_id: user_id
    });

  } catch (err) {
    console.error('Register error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// ════════════════════════════════════════════════════════════
// POST /api/auth/login
// ════════════════════════════════════════════════════════════
// Validates email + password and returns a JWT token.
// Expects JSON body:
// {
//   "email": "ali@example.com",
//   "password": "mypassword"
// }
router.post('/login', async (req, res) => {
  try {
    // ── Step 1: Get email and password from request body ──
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required.' });
    }

    const pool = getPool();

    // ── Step 2: Find the user in the database ──
    // We JOIN with Role table to get the role_name
    const result = await pool.request()
      .input('email', sql.VarChar(100), email)
      .query(`
        SELECT u.user_id, u.full_name, u.email, u.password_hash,
               u.status, u.phone_number, r.role_name
        FROM Users u
        JOIN Role r ON u.role_id = r.role_id
        WHERE u.email = @email
      `);

    const user = result.recordset[0];

    // ── Step 3: Check if user exists ──
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // ── Step 4: Check if account is active ──
    if (user.status !== 'Active') {
      return res.status(403).json({ error: 'Account is not active.' });
    }

    // ── Step 5: Compare password with stored hash ──
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // ── Step 6: Generate JWT token ──
    const token = generateJwt(user);

    // ── Step 7: Return token and user info ──
    return res.json({
      message: 'Login successful.',
      token: token,
      user: {
        user_id:   user.user_id,
        full_name: user.full_name,
        email:     user.email,
        role:      user.role_name,      // e.g. "Administrator"
        phone:     user.phone_number
      }
    });

  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// ════════════════════════════════════════════════════════════
// GET /api/auth/me
// ════════════════════════════════════════════════════════════
// Returns the currently logged-in user's info.
// Requires a valid JWT token in the Authorization header.
router.get('/me', async (req, res) => {
  try {
    // The auth middleware already decoded the token and put user info in req.user
    const userId = req.user && req.user.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const pool = getPool();

    // Get fresh user data from the database
    const result = await pool.request()
      .input('user_id', sql.Int, parseInt(userId))
      .query(`
        SELECT u.user_id, u.full_name, u.email, u.status,
               u.phone_number, r.role_name
        FROM Users u
        JOIN Role r ON u.role_id = r.role_id
        WHERE u.user_id = @user_id
      `);

    const user = result.recordset[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json(user);

  } catch (err) {
    console.error('Me error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// ════════════════════════════════════════════════════════════
// Helper: Generate a JWT token
// ════════════════════════════════════════════════════════════
// The token contains: userId, email, role, fullName
// It expires after JWT_EXPIRY_MINUTES (default: 480 = 8 hours)
function generateJwt(user) {
  // What data to store in the token
  const payload = {
    userId:   user.user_id.toString(),
    email:    user.email,
    role:     user.role_name,    // e.g. "Administrator", "Field Officer"
    fullName: user.full_name,
  };

  // Token expiry time (from .env, default 480 minutes = 8 hours)
  const expiryMinutes = parseInt(process.env.JWT_EXPIRY_MINUTES || '480', 10);

  // Create and return the signed token
  return jwt.sign(payload, process.env.JWT_SECRET, {
    issuer:    process.env.JWT_ISSUER,
    audience:  process.env.JWT_AUDIENCE,
    expiresIn: expiryMinutes * 60,  // jwt expects seconds
  });
}


module.exports = router;

const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { getPool, sql } = require('../config/db');

const router = express.Router();

// ── POST /api/auth/register ──
router.post('/register', async (req, res) => {
  try {
    const { FullName, Email, Password, Role = 'Responder', Phone = null } = req.body;
    const pool = getPool();

    // Check if email exists
    const check = await pool.request()
      .input('Email', sql.NVarChar, Email)
      .query('SELECT COUNT(*) AS cnt FROM Users WHERE Email = @Email');

    if (check.recordset[0].cnt > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const hash = await bcrypt.hash(Password, 10);

    const result = await pool.request()
      .input('FullName',     sql.NVarChar, FullName)
      .input('Email',        sql.NVarChar, Email)
      .input('PasswordHash', sql.NVarChar, hash)
      .input('Role',         sql.NVarChar, Role)
      .input('Phone',        sql.NVarChar, Phone)
      .query(`INSERT INTO Users (FullName, Email, PasswordHash, Role, Phone)
              VALUES (@FullName, @Email, @PasswordHash, @Role, @Phone);
              SELECT CAST(SCOPE_IDENTITY() AS INT) AS userId;`);

    const userId = result.recordset[0].userId;
    return res.json({ userId, message: 'Registration successful.' });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/auth/login ──
router.post('/login', async (req, res) => {
  try {
    const { Email, Password } = req.body;
    const pool = getPool();

    const result = await pool.request()
      .input('Email', sql.NVarChar, Email)
      .query('SELECT * FROM Users WHERE Email = @Email AND IsActive = 1');

    const user = result.recordset[0];
    if (!user || !(await bcrypt.compare(Password, user.PasswordHash))) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = generateJwt(user);
    return res.json({
      token,
      user: { UserId: user.UserId, FullName: user.FullName, Email: user.Email, Role: user.Role },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/auth/me ──
router.get('/me', async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const pool = getPool();
    const result = await pool.request()
      .input('UserId', sql.Int, parseInt(userId))
      .query('SELECT UserId, FullName, Email, Role, Phone, IsActive FROM Users WHERE UserId = @UserId');

    const user = result.recordset[0];
    return user ? res.json(user) : res.status(404).json({ error: 'Not found.' });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── Helper ──
function generateJwt(user) {
  const payload = {
    userId:   user.UserId.toString(),
    email:    user.Email,
    role:     user.Role,
    fullName: user.FullName,
  };

  const expiryMinutes = parseInt(process.env.JWT_EXPIRY_MINUTES || '480', 10);

  return jwt.sign(payload, process.env.JWT_SECRET, {
    issuer:    process.env.JWT_ISSUER,
    audience:  process.env.JWT_AUDIENCE,
    expiresIn: expiryMinutes * 60, // seconds
  });
}

module.exports = router;

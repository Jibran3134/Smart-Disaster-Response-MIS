// Handle registration and login.
//
// POST   /api/auth/register    — Create a new user account
// POST   /api/auth/login       — Login and get a JWT token
// GET    /api/auth/me          — Get current user info (requires token)
// GET    /api/auth/users       — List all users (Admin only)
// DELETE /api/auth/users/:id   — Remove a user (Admin only, sets status to Inactive)



const express = require('express');
const bcrypt  = require('bcryptjs');// used for hashing
const jwt     = require('jsonwebtoken');
const { getPool, sql } = require('../config/db');
const { requireRoles } = require('../middleware/rbac');

const router = express.Router();


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

    const emailCheck = await pool.request()
      .input('email', sql.VarChar(100), email)
      .query('SELECT COUNT(*) AS cnt FROM Users WHERE email = @email');

    if (emailCheck.recordset[0].cnt > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const roleResult = await pool.request()
      .input('role_name', sql.VarChar(50), role_name)
      .query('SELECT role_id FROM Role WHERE role_name = @role_name');

    if (roleResult.recordset.length === 0) {
      return res.status(400).json({
        error: 'Invalid role. Must be one of: Administrator, Emergency Operator, Field Officer, Warehouse Manager, Finance Officer'
      });
    }

    const role_id = roleResult.recordset[0].role_id;

    const password_hash = await bcrypt.hash(password, 10);

    // Insert the new user into the database 
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

    // Return success
    return res.status(201).json({
      message: 'Registration successful.',
      user_id: user_id
    });

  } catch (err) {
    console.error('Register error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// login

// Validates email + password and returns a JWT token.
// Expects JSON body:
// {
//   "email": "ali@example.com",
//   "password": "mypassword"
// }
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required.' });
    }

    const pool = getPool();

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

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (user.status !== 'Active') {
      return res.status(403).json({ error: 'Account is not active.' });
    }

    // Compare password with stored hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateJwt(user);

    return res.json({
      message: 'Login successful.',
      token: token,
      user: {
        user_id:   user.user_id,
        full_name: user.full_name,
        email:     user.email,
        role:      user.role_name,     
        phone:     user.phone_number
      }
    });

  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});



// Returns the currently logged-in user's info.
// Requires a valid JWT token in the Authorization header.
router.get('/me', async (req, res) => {
  try {
    const userId = req.user && req.user.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const pool = getPool();

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

// GET /api/auth/users
// List all users (Administrator only)
router.get('/users', requireRoles('Administrator'), async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .query(`
        SELECT u.user_id, u.full_name, u.email, u.status,
               u.phone_number, r.role_name, u.created_at
        FROM Users u
        JOIN Role r ON u.role_id = r.role_id
        ORDER BY u.user_id
      `);

    return res.json(result.recordset);

  } catch (err) {
    console.error('Get users error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// DELETE /api/auth/users/:id
// Remove a user (Administrator only)
// Sets status to 'Inactive' instead of deleting the row
// because other tables (reports, allocations, etc.) reference this user
router.delete('/users/:id', requireRoles('Administrator'), async (req, res) => {
  try {
    const pool = getPool();
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (parseInt(userId) === parseInt(req.user.userId)) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    // Check user exists
    const check = await pool.request()
      .input('id', sql.Int, userId)
      .query('SELECT user_id, status FROM Users WHERE user_id = @id');

    if (check.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (check.recordset[0].status === 'Inactive') {
      return res.status(400).json({ error: 'User is already inactive.' });
    }

    // Soft delete — set status to Inactive
    await pool.request()
      .input('id', sql.Int, userId)
      .query("UPDATE Users SET status = 'Inactive' WHERE user_id = @id");

    return res.json({
      message: 'User removed (set to Inactive).',
      user_id: parseInt(userId)
    });

  } catch (err) {
    console.error('Delete user error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


function generateJwt(user) {
  
  const payload = {
    userId:   user.user_id.toString(),
    email:    user.email,
    role:     user.role_name,   
    fullName: user.full_name,
  };

  const expiryMinutes = parseInt(process.env.JWT_EXPIRY_MINUTES || '480', 10);

  return jwt.sign(payload, process.env.JWT_SECRET, {
    issuer:    process.env.JWT_ISSUER,
    audience:  process.env.JWT_AUDIENCE,
    expiresIn: expiryMinutes * 60,  // jwt expects seconds
  });
}


module.exports = router;

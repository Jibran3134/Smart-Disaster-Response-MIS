
const express = require('express');
const cors = require('cors');//allow frontend to call the API
require('dotenv').config();

const { connectDB } = require('./config/db');

// ── Middleware ──
const { authMiddleware } = require('./middleware/auth');
const { rbacMiddleware } = require('./middleware/rbac');

// ── Route modules ──
const authRoutes         = require('./routes/auth');
const emergenciesRoutes  = require('./routes/emergencies');
const teamsRoutes        = require('./routes/teams');
const resourcesRoutes    = require('./routes/resources');
const hospitalsRoutes    = require('./routes/hospitals');
const financeRoutes      = require('./routes/finance');
const approvalsRoutes    = require('./routes/approvals');
const transactionsRoutes = require('./routes/transactions');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware Pipeline — every request passes through these in order:
// 1. express.json() parses incoming JSON body
// 2. cors allows cross-origin requests from the frontend
// 3. authMiddleware verifies JWT (authentication)
// 4. rbacMiddleware checks role permissions (authorization)
// This ensures ALL requests are authenticated + authorized before reaching route handlers
app.use(express.json());

// ── CORS ──
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use('/api', authMiddleware);
app.use('/api', rbacMiddleware);

// ── Routes ──
app.use('/api/auth',         authRoutes);
app.use('/api/emergencies',  emergenciesRoutes);
app.use('/api/teams',        teamsRoutes);
app.use('/api/resources',    resourcesRoutes);
app.use('/api/hospitals',    hospitalsRoutes);
app.use('/api/finance',      financeRoutes);
app.use('/api/approvals',    approvalsRoutes);
app.use('/api/transactions', transactionsRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Start ──
async function start() {
  try {
    await connectDB();
    console.log(' Connected to SQL Server');
  } catch (err) {
    console.warn(' Could not connect to SQL Server:', err.message);
    console.warn(' The server will start, but DB-dependent routes will fail until SQL Server is available.');
  }

  app.listen(PORT, () => console.log(` API running on http://localhost:${PORT}`));
}

start();

// Method: POST
// URL:    http://localhost:5000/api/auth/register

// {
//   "full_name": "Jibran Admin",
//   "email": "admin@test.com",
//   "password": "admin123",
//   "role_name": "Administrator"
// }

// Login
// Method: POST
// URL:    http://localhost:5000/api/auth/login
// Body tab 
// {
//   "email": "admin@test.com",
//   "password": "admin123"
// }
// go to Headers tab and add:

// Key:   Authorization
// Value: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Method: GET
// URL:    http://localhost:5000/api/auth/me
// Authorization: Bearer <your_token>

  


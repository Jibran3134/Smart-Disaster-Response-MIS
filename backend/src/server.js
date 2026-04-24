// ============================================================
// server.js — Main Entry Point
// ============================================================
// Wires up all middleware and routes for the Disaster Response API.
//
// Middleware order:
//   1. express.json()    → parse JSON request bodies
//   2. cors              → allow frontend to call the API
//   3. authMiddleware    → verify JWT token (skips login/register)
//   4. rbacMiddleware    → check role-based access (skips login/register)
//
// Routes:
//   /api/auth            → Login, Register, Profile
//   /api/emergencies     → Disaster Events & Emergency Reports
//   /api/teams           → Rescue Teams & Assignments
//   /api/resources       → Resources, Warehouses, Inventory, Allocations
//   /api/hospitals       → Hospitals & Patients
//   /api/finance         → Financial Transactions, Donors, Budgets
//   /api/approvals       → Approval Workflow
//   /api/transactions    → Multi-step DB Transactions (ACID)
// ============================================================

const express = require('express');
const cors = require('cors');
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

// ── Body parsing ──
app.use(express.json());

// ── CORS ──
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// ── Auth + RBAC middleware (applied to all /api/* routes) ──
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

// ── Health check (no auth needed) ──
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Start ──
async function start() {
  try {
    await connectDB();
    console.log('✅ Connected to SQL Server');
  } catch (err) {
    console.warn('⚠️  Could not connect to SQL Server:', err.message);
    console.warn('   The server will start, but DB-dependent routes will fail until SQL Server is available.');
  }

  app.listen(PORT, () => console.log(`🚀 API running on http://localhost:${PORT}`));
}

start();

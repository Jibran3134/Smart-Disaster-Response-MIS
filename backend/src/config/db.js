// ============================================================
// db.js — Database Connection (SQL Server using mssql package)
// ============================================================
// This file connects to SQL Server and exports helper functions.
// We use a connection pool so the app reuses one connection.
// ============================================================

const sql = require('mssql');

// ── Parse server name ──
// Your .env might say "JIBRAN-PC\SQLEXPRESS"
// We need to split that into server + instance
const serverRaw = process.env.DB_SERVER || 'localhost';
const parts = serverRaw.split('\\');
const serverName = parts[0];                           // e.g. "JIBRAN-PC"
const instanceName = parts.length > 1 ? parts[1] : undefined; // e.g. "SQLEXPRESS"

// ── Connection config ──
const config = {
  server:   serverName,
  database: process.env.DB_NAME || 'DisasterResponseDB',
  options: {
    encrypt: false,                    // Not needed for local dev
    trustServerCertificate: true,      // Trust self-signed certs
    instanceName: instanceName,        // e.g. "SQLEXPRESS"
  },
  // If using a named instance, let SQL Browser handle the port
  port: instanceName ? undefined : 1433,
};

// ── Authentication ──
// Use Windows Auth or SQL login based on .env
if (process.env.DB_TRUSTED_CONNECTION === 'true') {
  config.options.trustedConnection = true;
} else {
  config.user     = process.env.DB_USER;
  config.password = process.env.DB_PASSWORD;
}

// ── Connection pool (we only create one) ──
let pool;

/**
 * Connect to the database. Call this once when the server starts.
 */
async function connectDB() {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}

/**
 * Get the connection pool. Must call connectDB() first.
 */
function getPool() {
  if (!pool) throw new Error('Database not connected. Call connectDB() first.');
  return pool;
}

module.exports = { connectDB, getPool, sql };

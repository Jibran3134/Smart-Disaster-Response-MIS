const sql = require('mssql');

// Parse server\instance format (e.g. "Jibran-PC\SQLEXPRESS")
const serverRaw = process.env.DB_SERVER || 'localhost';
const parts = serverRaw.split('\\');
const serverName = parts[0];
const instanceName = parts.length > 1 ? parts[1] : undefined;

const config = {
  server:   serverName,
  database: process.env.DB_NAME || 'DisasterResponseDB',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: instanceName,  // e.g. "SQLEXPRESS"
  },
  port: instanceName ? undefined : 1433,  // Let SQL Browser handle port for named instances
};

// Use Windows Authentication (trusted) or SQL login
if (process.env.DB_TRUSTED_CONNECTION === 'true') {
  config.options.trustedConnection = true;
} else {
  config.user     = process.env.DB_USER;
  config.password = process.env.DB_PASSWORD;
}

let pool;

/**
 * Initialise and cache the connection pool.
 * @returns {Promise<sql.ConnectionPool>}
 */
async function connectDB() {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}

/**
 * Get the cached pool (must call connectDB first).
 * @returns {sql.ConnectionPool}
 */
function getPool() {
  if (!pool) throw new Error('Database not connected. Call connectDB() first.');
  return pool;
}

module.exports = { connectDB, getPool, sql };

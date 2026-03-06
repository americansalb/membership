const { Pool } = require('pg');

// Determine SSL configuration based on DATABASE_URL
const dbUrl = process.env.DATABASE_URL || '';
const requiresSSL = dbUrl.includes('sslmode=require') || dbUrl.includes('render.com');
const sslConfig = requiresSSL ? { rejectUnauthorized: false } : false;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
  // Connection pool settings for Render.com free tier (max 5 connections)
  max: 5, // Maximum connections in pool - reduced for Render.com limits
  min: 1, // Keep at least 1 connection alive
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Wait 10 seconds for connection
  keepAlive: true, // Keep connections alive
  keepAliveInitialDelayMillis: 10000, // Start keepalive after 10 seconds
});

// Handle connection errors
pool.on('error', (err, client) => {
  console.error('Unexpected database error:', err.message);
  // Don't exit the process, let it reconnect automatically
});

// Graceful query with retry
async function queryWithRetry(text, params, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      if (i === retries - 1) throw err; // Last attempt, throw error
      console.warn(`Database query failed (attempt ${i + 1}/${retries}), retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
    }
  }
}

module.exports = {
  query: queryWithRetry,
  pool
};

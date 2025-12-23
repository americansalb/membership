// Migration: Create developer account
// This is a JS migration that runs with bcrypt

const bcrypt = require('bcrypt');

async function run(db) {
  const email = 'contact@aalb.org';
  const password = 'winner';
  const name = 'AALB Admin';

  // Check if already exists
  const existing = await db.query(
    'SELECT 1 FROM developers WHERE email = $1',
    [email]
  );

  if (existing.rows.length > 0) {
    console.log('Developer account already exists, skipping.');
    return;
  }

  // Hash password and insert
  const passwordHash = await bcrypt.hash(password, 12);

  await db.query(
    `INSERT INTO developers (email, password_hash, name)
     VALUES ($1, $2, $3)`,
    [email, passwordHash, name]
  );

  console.log(`Developer account created for ${email}`);
}

module.exports = run;

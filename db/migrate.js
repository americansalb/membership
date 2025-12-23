const fs = require('fs');
const path = require('path');
const db = require('./index');

async function migrate() {
  console.log('Running database migration...');

  try {
    // Check if tables already exist
    const result = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'organizations'
      );
    `);

    if (!result.rows[0].exists) {
      // Fresh install - run full schema
      console.log('Fresh install, running full schema...');
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await db.query(schema);
      console.log('Schema created successfully.');
    }

    // Run incremental migrations
    await runMigrations();

    console.log('Migration completed successfully.');
    return true;

  } catch (err) {
    console.error('Migration failed:', err.message);
    return false;
  }
}

async function runMigrations() {
  // Create migrations tracking table if it doesn't exist
  await db.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name VARCHAR(255) PRIMARY KEY,
      executed_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Get list of already-run migrations
  const executed = await db.query('SELECT name FROM _migrations');
  const executedSet = new Set(executed.rows.map(r => r.name));

  // Get migration files
  const migrationsDir = path.join(__dirname, 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations folder found, skipping.');
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (executedSet.has(file)) {
      continue; // Already run
    }

    console.log(`Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    await db.query(sql);
    await db.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);

    console.log(`Completed: ${file}`);
  }
}

module.exports = migrate;

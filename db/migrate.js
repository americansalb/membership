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

    if (result.rows[0].exists) {
      console.log('Tables already exist, skipping migration.');
      return true;
    }

    // Read and run schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await db.query(schema);
    console.log('Migration completed successfully.');
    return true;

  } catch (err) {
    console.error('Migration failed:', err.message);
    return false;
  }
}

module.exports = migrate;

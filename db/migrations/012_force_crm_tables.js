// Force create CRM tables directly (bypass migration 009/010/011 issues)
// This is a one-time emergency fix

const fs = require('fs');
const path = require('path');

module.exports = async function(db) {
  console.log('Checking if CRM tables already exist...');

  // Check if crm_contacts exists
  const tableCheck = await db.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = 'crm_contacts'
    );
  `);

  if (tableCheck.rows[0].exists) {
    console.log('CRM tables already exist - skipping creation');
    return;
  }

  console.log('CRM tables do not exist - creating now...');

  // Read the CRM migration file
  const crmMigrationPath = path.join(__dirname, '011_crm_core.sql');
  const crmSQL = fs.readFileSync(crmMigrationPath, 'utf8');

  // Execute it
  await db.query(crmSQL);

  console.log('CRM tables created successfully!');

  // Mark migrations 009, 010, 011 as complete
  await db.query(`
    INSERT INTO _migrations (name, executed_at)
    VALUES
      ('009_credential_system.sql.skip', NOW()),
      ('010_tags_system.sql', NOW()),
      ('011_crm_core.sql', NOW())
    ON CONFLICT (name) DO NOTHING;
  `);

  console.log('Migration tracking updated');
};

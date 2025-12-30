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

  // Ensure credentials tables exist (they may have been missed due to earlier crashes)
  await ensureCredentialsTables();

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
    .filter(f => f.endsWith('.sql') || f.endsWith('.js'))
    .sort();

  for (const file of files) {
    if (executedSet.has(file)) {
      continue; // Already run
    }

    console.log(`Running migration: ${file}`);
    const filePath = path.join(migrationsDir, file);

    if (file.endsWith('.sql')) {
      // SQL migration
      const sql = fs.readFileSync(filePath, 'utf8');
      await db.query(sql);
    } else if (file.endsWith('.js')) {
      // JS migration (for complex logic like password hashing)
      const migration = require(filePath);
      await migration(db);
    }

    await db.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
    console.log(`Completed: ${file}`);
  }
}

// Ensure credentials tables exist (backup in case migration failed/was skipped)
async function ensureCredentialsTables() {
  try {
    // Check if credentials table exists
    const result = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'credentials'
      );
    `);

    if (!result.rows[0].exists) {
      console.log('Creating credentials tables...');

      // Create all credentials-related tables
      await db.query(`
        -- Credentials table
        CREATE TABLE IF NOT EXISTS credentials (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
          name VARCHAR(200) NOT NULL,
          short_name VARCHAR(50),
          description TEXT,
          renewal_period_months INT NOT NULL DEFAULT 12,
          renewal_type VARCHAR(50) DEFAULT 'anniversary',
          renewal_month INT,
          renewal_day INT,
          total_credits_required DECIMAL(6,2) NOT NULL DEFAULT 0,
          grace_period_days INT DEFAULT 30,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_credentials_org ON credentials(org_id);

        -- Credential categories
        CREATE TABLE IF NOT EXISTS credential_categories (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          credential_id UUID REFERENCES credentials(id) ON DELETE CASCADE,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          required_credits DECIMAL(5,2) DEFAULT 0,
          counts_toward_total BOOLEAN DEFAULT true,
          sort_order INT DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_credential_categories_credential ON credential_categories(credential_id);

        -- Member credentials
        CREATE TABLE IF NOT EXISTS member_credentials (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          member_id UUID REFERENCES members(id) ON DELETE CASCADE,
          credential_id UUID REFERENCES credentials(id) ON DELETE CASCADE,
          earned_date DATE NOT NULL,
          current_period_start DATE NOT NULL,
          current_period_end DATE NOT NULL,
          status VARCHAR(50) DEFAULT 'active',
          credential_number VARCHAR(100),
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(member_id, credential_id)
        );

        CREATE INDEX IF NOT EXISTS idx_member_credentials_member ON member_credentials(member_id);
        CREATE INDEX IF NOT EXISTS idx_member_credentials_credential ON member_credentials(credential_id);

        -- Custom fields
        CREATE TABLE IF NOT EXISTS credential_custom_fields (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          credential_id UUID REFERENCES credentials(id) ON DELETE CASCADE,
          field_name VARCHAR(100) NOT NULL,
          field_label VARCHAR(200) NOT NULL,
          field_type VARCHAR(50) NOT NULL,
          options JSONB,
          is_required BOOLEAN DEFAULT false,
          min_value DECIMAL(10,2),
          max_value DECIMAL(10,2),
          max_length INT,
          placeholder TEXT,
          help_text TEXT,
          sort_order INT DEFAULT 0,
          show_on_application BOOLEAN DEFAULT true,
          show_on_renewal BOOLEAN DEFAULT true,
          show_on_credit_submission BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_credential_custom_fields_credential ON credential_custom_fields(credential_id);

        -- Custom field values
        CREATE TABLE IF NOT EXISTS credential_custom_field_values (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          member_credential_id UUID REFERENCES member_credentials(id) ON DELETE CASCADE,
          custom_field_id UUID REFERENCES credential_custom_fields(id) ON DELETE CASCADE,
          value TEXT,
          file_url TEXT,
          file_name VARCHAR(255),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(member_credential_id, custom_field_id)
        );
      `);

      // Add columns to ceu_credits if they don't exist
      await db.query(`
        ALTER TABLE ceu_credits
          ADD COLUMN IF NOT EXISTS member_credential_id UUID REFERENCES member_credentials(id) ON DELETE CASCADE;

        ALTER TABLE ceu_credits
          ADD COLUMN IF NOT EXISTS credential_category_id UUID REFERENCES credential_categories(id) ON DELETE SET NULL;

        CREATE INDEX IF NOT EXISTS idx_ceu_credits_member_credential ON ceu_credits(member_credential_id);
        CREATE INDEX IF NOT EXISTS idx_ceu_credits_credential_category ON ceu_credits(credential_category_id);
      `);

      console.log('Credentials tables created successfully.');
    }
  } catch (err) {
    console.error('Error ensuring credentials tables:', err.message);
    // Don't throw - let the app continue even if this fails
  }
}

module.exports = migrate;

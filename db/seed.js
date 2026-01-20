const db = require('../db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

async function seedDeveloper() {
  try {
    // Check if any developer exists
    const existing = await db.query('SELECT 1 FROM developers LIMIT 1');

    if (existing.rows.length > 0) {
      console.log('[Seed] Developer account already exists');
      return;
    }

    // Create default developer account
    const email = process.env.DEV_EMAIL || 'dev@villagemembers.local';
    const password = process.env.DEV_PASSWORD || 'developer123';
    const name = 'Platform Developer';

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await db.query(
      `INSERT INTO developers (email, password_hash, name, is_active)
       VALUES ($1, $2, $3, true)`,
      [email, passwordHash, name]
    );

    console.log('[Seed] Created developer account:');
    console.log(`       Email: ${email}`);
    console.log(`       Password: ${password}`);
    console.log('');

  } catch (err) {
    // Table might not exist yet (before migrations)
    if (err.code === '42P01') {
      console.log('[Seed] Skipping developer seed - table does not exist yet');
    } else {
      console.error('[Seed] Error seeding developer:', err.message);
    }
  }
}

async function seedPlatformPlans() {
  try {
    // Check if plans exist
    const existing = await db.query('SELECT 1 FROM platform_plans LIMIT 1');

    if (existing.rows.length > 0) {
      console.log('[Seed] Platform plans already exist');
      return;
    }

    // Create default plans
    const plans = [
      {
        id: 'free',
        name: 'Free',
        price_cents_monthly: 0,
        price_cents_annual: 0,
        admin_seat_limit: 0,
        staff_seat_limit: 0,
        emails_per_month: 100,
        sms_per_month: 0,
        storage_mb: 100,
        ceu_advanced: false,
        branding_removed: false,
        custom_subdomain: false,
        custom_domain: false,
        priority_support: false,
        sso_saml: false,
        sort_order: 0
      },
      {
        id: 'pro',
        name: 'Pro',
        price_cents_monthly: 4900,
        price_cents_annual: 49000,
        admin_seat_limit: 2,
        staff_seat_limit: 3,
        emails_per_month: 5000,
        sms_per_month: 100,
        storage_mb: 5120,
        ceu_advanced: true,
        branding_removed: true,
        custom_subdomain: true,
        custom_domain: false,
        priority_support: false,
        sso_saml: false,
        sort_order: 1
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price_cents_monthly: 14900,
        price_cents_annual: 149000,
        admin_seat_limit: -1,
        staff_seat_limit: -1,
        emails_per_month: 50000,
        sms_per_month: 1000,
        storage_mb: 51200,
        ceu_advanced: true,
        branding_removed: true,
        custom_subdomain: true,
        custom_domain: true,
        priority_support: true,
        sso_saml: true,
        sort_order: 2
      }
    ];

    for (const plan of plans) {
      await db.query(
        `INSERT INTO platform_plans (
          id, name, price_cents_monthly, price_cents_annual,
          admin_seat_limit, staff_seat_limit, emails_per_month, sms_per_month,
          storage_mb, ceu_advanced, branding_removed, custom_subdomain,
          custom_domain, priority_support, sso_saml, sort_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO NOTHING`,
        [
          plan.id, plan.name, plan.price_cents_monthly, plan.price_cents_annual,
          plan.admin_seat_limit, plan.staff_seat_limit, plan.emails_per_month, plan.sms_per_month,
          plan.storage_mb, plan.ceu_advanced, plan.branding_removed, plan.custom_subdomain,
          plan.custom_domain, plan.priority_support, plan.sso_saml, plan.sort_order
        ]
      );
    }

    console.log('[Seed] Created platform plans: free, pro, enterprise');

  } catch (err) {
    if (err.code === '42P01') {
      console.log('[Seed] Skipping platform plans seed - table does not exist yet');
    } else {
      console.error('[Seed] Error seeding plans:', err.message);
    }
  }
}

async function seedDefaultForums() {
  try {
    // Find orgs without any forums
    const orgsWithoutForums = await db.query(`
      SELECT o.id, o.name
      FROM organizations o
      LEFT JOIN community_forums cf ON cf.org_id = o.id
      WHERE cf.id IS NULL
    `);

    if (orgsWithoutForums.rows.length === 0) {
      return;
    }

    for (const org of orgsWithoutForums.rows) {
      await db.query(
        `INSERT INTO community_forums (org_id, name, slug, icon, description, allow_member_posts, sort_order)
         VALUES
           ($1, 'Announcements', 'announcements', '📢', 'Official updates and announcements', false, 0),
           ($1, 'General', 'general', '💬', 'General discussion and chat', true, 1),
           ($1, 'Introductions', 'introductions', '👋', 'Introduce yourself to the community', true, 2)`,
        [org.id]
      );
      console.log(`[Seed] Created default forums for org: ${org.name}`);
    }

  } catch (err) {
    if (err.code === '42P01') {
      // Table doesn't exist yet
    } else {
      console.error('[Seed] Error seeding forums:', err.message);
    }
  }
}

async function seedCRMTables() {
  try {
    console.log('[Seed] Checking CRM tables...');

    // Check if CRM tables exist
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'crm_contacts'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('[Seed] CRM tables already exist');
      return;
    }

    console.log('[Seed] Creating CRM tables...');

    // Create all CRM tables directly
    await db.query(`
      -- CRM CONTACTS TABLE
      CREATE TABLE IF NOT EXISTS crm_contacts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        member_id UUID REFERENCES members(id) ON DELETE SET NULL,
        type VARCHAR(20) DEFAULT 'prospect' CHECK (type IN ('prospect', 'member', 'alumni')),
        email VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(50),
        company VARCHAR(200),
        title VARCHAR(200),
        address_line1 VARCHAR(255),
        address_line2 VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(100),
        postal_code VARCHAR(20),
        country VARCHAR(100),
        source VARCHAR(100),
        source_details TEXT,
        lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
        assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
        custom_fields JSONB DEFAULT '{}',
        notes TEXT,
        metadata JSONB DEFAULT '{}',
        last_contacted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(org_id, email)
      );

      CREATE INDEX IF NOT EXISTS idx_crm_contacts_org ON crm_contacts(org_id);
      CREATE INDEX IF NOT EXISTS idx_crm_contacts_member ON crm_contacts(member_id);
      CREATE INDEX IF NOT EXISTS idx_crm_contacts_type ON crm_contacts(type);
      CREATE INDEX IF NOT EXISTS idx_crm_contacts_assigned ON crm_contacts(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON crm_contacts(email);
      CREATE INDEX IF NOT EXISTS idx_crm_contacts_source ON crm_contacts(source);
      CREATE INDEX IF NOT EXISTS idx_crm_contacts_custom_fields ON crm_contacts USING GIN(custom_fields);
      CREATE INDEX IF NOT EXISTS idx_crm_contacts_last_contacted ON crm_contacts(last_contacted_at);

      -- CRM PIPELINES TABLE
      CREATE TABLE IF NOT EXISTS crm_pipelines (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        is_default BOOLEAN DEFAULT FALSE,
        color VARCHAR(7) DEFAULT '#6366f1',
        icon VARCHAR(50),
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(org_id, name)
      );

      CREATE INDEX IF NOT EXISTS idx_crm_pipelines_org ON crm_pipelines(org_id);
      CREATE INDEX IF NOT EXISTS idx_crm_pipelines_active ON crm_pipelines(is_active);

      -- CRM STAGES TABLE
      CREATE TABLE IF NOT EXISTS crm_stages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        pipeline_id UUID NOT NULL REFERENCES crm_pipelines(id) ON DELETE CASCADE,
        org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        sort_order INTEGER DEFAULT 0,
        color VARCHAR(7) DEFAULT '#6366f1',
        is_active BOOLEAN DEFAULT TRUE,
        is_closed_won BOOLEAN DEFAULT FALSE,
        is_closed_lost BOOLEAN DEFAULT FALSE,
        is_initial BOOLEAN DEFAULT FALSE,
        auto_assign_to UUID REFERENCES users(id) ON DELETE SET NULL,
        auto_add_tags UUID[] DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(pipeline_id, name)
      );

      CREATE INDEX IF NOT EXISTS idx_crm_stages_pipeline ON crm_stages(pipeline_id);
      CREATE INDEX IF NOT EXISTS idx_crm_stages_org ON crm_stages(org_id);
      CREATE INDEX IF NOT EXISTS idx_crm_stages_sort ON crm_stages(sort_order);
      CREATE INDEX IF NOT EXISTS idx_crm_stages_active ON crm_stages(is_active);

      -- CRM CONTACT STAGES
      CREATE TABLE IF NOT EXISTS crm_contact_stages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
        stage_id UUID NOT NULL REFERENCES crm_stages(id) ON DELETE CASCADE,
        pipeline_id UUID NOT NULL REFERENCES crm_pipelines(id) ON DELETE CASCADE,
        org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        entered_at TIMESTAMPTZ DEFAULT NOW(),
        exited_at TIMESTAMPTZ,
        moved_by UUID REFERENCES users(id) ON DELETE SET NULL,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_crm_contact_stages_contact ON crm_contact_stages(contact_id);
      CREATE INDEX IF NOT EXISTS idx_crm_contact_stages_stage ON crm_contact_stages(stage_id);
      CREATE INDEX IF NOT EXISTS idx_crm_contact_stages_pipeline ON crm_contact_stages(pipeline_id);
      CREATE INDEX IF NOT EXISTS idx_crm_contact_stages_org ON crm_contact_stages(org_id);
      CREATE INDEX IF NOT EXISTS idx_crm_contact_stages_current ON crm_contact_stages(contact_id, exited_at) WHERE exited_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_crm_contact_stages_entered ON crm_contact_stages(entered_at);

      -- CRM CONTACT TAGS
      CREATE TABLE IF NOT EXISTS crm_contact_tags (
        contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
        tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
        added_at TIMESTAMPTZ DEFAULT NOW(),
        added_by UUID REFERENCES users(id) ON DELETE SET NULL,
        PRIMARY KEY (contact_id, tag_id)
      );

      CREATE INDEX IF NOT EXISTS idx_crm_contact_tags_contact ON crm_contact_tags(contact_id);
      CREATE INDEX IF NOT EXISTS idx_crm_contact_tags_tag ON crm_contact_tags(tag_id);
    `);

    console.log('[Seed] Creating CRM helper functions and triggers...');

    // Helper function for moving contacts between stages
    await db.query(`
      CREATE OR REPLACE FUNCTION crm_move_contact_to_stage(
        p_contact_id UUID,
        p_stage_id UUID,
        p_moved_by UUID,
        p_notes TEXT DEFAULT NULL
      ) RETURNS UUID AS $$
      DECLARE
        v_pipeline_id UUID;
        v_org_id UUID;
        v_stage_entry_id UUID;
        v_old_stage_id UUID;
      BEGIN
        SELECT pipeline_id, org_id INTO v_pipeline_id, v_org_id
        FROM crm_stages
        WHERE id = p_stage_id;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Stage not found: %', p_stage_id;
        END IF;

        UPDATE crm_contact_stages
        SET exited_at = NOW()
        WHERE contact_id = p_contact_id
          AND pipeline_id = v_pipeline_id
          AND exited_at IS NULL
        RETURNING stage_id INTO v_old_stage_id;

        INSERT INTO crm_contact_stages (
          contact_id, stage_id, pipeline_id, org_id, moved_by, notes
        ) VALUES (
          p_contact_id, p_stage_id, v_pipeline_id, v_org_id, p_moved_by, p_notes
        )
        RETURNING id INTO v_stage_entry_id;

        UPDATE crm_contacts SET updated_at = NOW() WHERE id = p_contact_id;

        RETURN v_stage_entry_id;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Trigger for syncing members to CRM
    await db.query(`
      CREATE OR REPLACE FUNCTION sync_member_to_crm_contact()
      RETURNS TRIGGER AS $$
      DECLARE
        v_contact_id UUID;
        v_org_id UUID;
      BEGIN
        v_org_id := NEW.org_id;

        SELECT id INTO v_contact_id
        FROM crm_contacts
        WHERE org_id = v_org_id AND member_id = NEW.id;

        IF FOUND THEN
          UPDATE crm_contacts SET
            type = 'member',
            email = NEW.email,
            first_name = NEW.first_name,
            last_name = NEW.last_name,
            phone = COALESCE(NEW.phone, phone),
            updated_at = NOW()
          WHERE id = v_contact_id;
        ELSE
          SELECT id INTO v_contact_id
          FROM crm_contacts
          WHERE org_id = v_org_id AND email = NEW.email;

          IF FOUND THEN
            UPDATE crm_contacts SET
              type = 'member',
              member_id = NEW.id,
              first_name = COALESCE(first_name, NEW.first_name),
              last_name = COALESCE(last_name, NEW.last_name),
              phone = COALESCE(phone, NEW.phone),
              updated_at = NOW()
            WHERE id = v_contact_id;
          ELSE
            INSERT INTO crm_contacts (
              org_id, member_id, type, email, first_name, last_name, phone, source
            ) VALUES (
              v_org_id, NEW.id, 'member', NEW.email, NEW.first_name, NEW.last_name, NEW.phone, 'LMS'
            );
          END IF;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS sync_member_to_crm ON members;

      CREATE TRIGGER sync_member_to_crm
        AFTER INSERT OR UPDATE ON members
        FOR EACH ROW EXECUTE FUNCTION sync_member_to_crm_contact();
    `);

    // Create update triggers for CRM tables
    await db.query(`
      DROP TRIGGER IF EXISTS update_crm_contacts_updated_at ON crm_contacts;
      CREATE TRIGGER update_crm_contacts_updated_at
        BEFORE UPDATE ON crm_contacts
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();

      DROP TRIGGER IF EXISTS update_crm_pipelines_updated_at ON crm_pipelines;
      CREATE TRIGGER update_crm_pipelines_updated_at
        BEFORE UPDATE ON crm_pipelines
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();

      DROP TRIGGER IF EXISTS update_crm_stages_updated_at ON crm_stages;
      CREATE TRIGGER update_crm_stages_updated_at
        BEFORE UPDATE ON crm_stages
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    `);

    // Create CRM contact summary view
    await db.query(`
      CREATE OR REPLACE VIEW crm_contact_summary AS
      SELECT
        c.id, c.org_id, c.member_id, c.type, c.email, c.first_name, c.last_name,
        c.phone, c.company, c.title, c.source, c.lead_score, c.assigned_to,
        c.custom_fields, c.last_contacted_at, c.created_at, c.updated_at,
        cs.stage_id AS current_stage_id, cs.pipeline_id AS current_pipeline_id,
        s.name AS current_stage_name, s.color AS current_stage_color,
        p.name AS current_pipeline_name, cs.entered_at AS stage_entered_at,
        u.email AS assigned_user_email, u.first_name AS assigned_user_first_name,
        u.last_name AS assigned_user_last_name, m.status AS member_status,
        m.subscription_status AS member_subscription_status,
        COALESCE(
          (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
           FROM crm_contact_tags ct JOIN tags t ON t.id = ct.tag_id WHERE ct.contact_id = c.id),
          '[]'::json
        ) AS tags
      FROM crm_contacts c
      LEFT JOIN crm_contact_stages cs ON cs.contact_id = c.id AND cs.exited_at IS NULL
      LEFT JOIN crm_stages s ON s.id = cs.stage_id
      LEFT JOIN crm_pipelines p ON p.id = cs.pipeline_id
      LEFT JOIN users u ON u.id = c.assigned_to
      LEFT JOIN members m ON m.id = c.member_id;
    `);

    console.log('[Seed] Syncing existing members to CRM...');

    // Sync existing members
    const syncResult = await db.query(`
      INSERT INTO crm_contacts (org_id, member_id, type, email, first_name, last_name, phone, source)
      SELECT org_id, id, 'member', email, first_name, last_name, phone, 'LMS'
      FROM members
      WHERE NOT EXISTS (SELECT 1 FROM crm_contacts WHERE member_id = members.id)
    `);

    console.log(`[Seed] CRM tables created successfully! Synced ${syncResult.rowCount} existing members.`);

    // Mark migrations as complete
    await db.query(`
      INSERT INTO _migrations (name, executed_at)
      VALUES ('011_crm_core.sql', NOW())
      ON CONFLICT (name) DO NOTHING
    `);

  } catch (err) {
    console.error('[Seed] Error creating CRM tables:', err.message);
    console.error('[Seed] Stack:', err.stack);
  }
}

async function runSeeds() {
  console.log('[Seed] Running database seeds...');
  await seedPlatformPlans();
  await seedDeveloper();
  await seedDefaultForums();
  await seedCRMTables();
  console.log('[Seed] Seeding complete');
}

module.exports = runSeeds;

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
        u.email AS assigned_user_email, u.name AS assigned_user_name,
        m.status AS member_status,
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

async function seedCRMActivities() {
  try {
    console.log('[Seed] Checking CRM activities table...');

    // Check if activities table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'crm_activities'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('[Seed] CRM activities table already exists');
      return;
    }

    console.log('[Seed] Creating CRM activities table...');

    // Create activities table
    await db.query(`
      CREATE TABLE IF NOT EXISTS crm_activities (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('note', 'email', 'call', 'meeting', 'task', 'system')),
        title VARCHAR(500) NOT NULL,
        description TEXT,
        related_type VARCHAR(100),
        related_id UUID,
        scheduled_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        due_at TIMESTAMPTZ,
        assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
        completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
        metadata JSONB DEFAULT '{}',
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        is_visible_to_contact BOOLEAN DEFAULT false
      );

      CREATE INDEX IF NOT EXISTS idx_crm_activities_org ON crm_activities(org_id);
      CREATE INDEX IF NOT EXISTS idx_crm_activities_contact ON crm_activities(contact_id);
      CREATE INDEX IF NOT EXISTS idx_crm_activities_type ON crm_activities(type);
      CREATE INDEX IF NOT EXISTS idx_crm_activities_assigned ON crm_activities(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_crm_activities_status ON crm_activities(status);
      CREATE INDEX IF NOT EXISTS idx_crm_activities_due ON crm_activities(due_at);
      CREATE INDEX IF NOT EXISTS idx_crm_activities_scheduled ON crm_activities(scheduled_at);
      CREATE INDEX IF NOT EXISTS idx_crm_activities_created ON crm_activities(created_at);
      CREATE INDEX IF NOT EXISTS idx_crm_activities_related ON crm_activities(related_type, related_id);
    `);

    // Create update trigger
    await db.query(`
      DROP TRIGGER IF EXISTS update_crm_activities_updated_at ON crm_activities;
      CREATE TRIGGER update_crm_activities_updated_at
        BEFORE UPDATE ON crm_activities
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    `);

    // Helper function for logging activities
    await db.query(`
      CREATE OR REPLACE FUNCTION crm_log_activity(
        p_org_id UUID,
        p_contact_id UUID,
        p_type VARCHAR,
        p_title VARCHAR,
        p_description TEXT DEFAULT NULL,
        p_metadata JSONB DEFAULT NULL,
        p_created_by UUID DEFAULT NULL
      ) RETURNS UUID AS $$
      DECLARE
        v_activity_id UUID;
      BEGIN
        INSERT INTO crm_activities (
          org_id, contact_id, type, title, description, metadata, created_by, status
        ) VALUES (
          p_org_id, p_contact_id, p_type, p_title, p_description,
          COALESCE(p_metadata, '{}'::jsonb), p_created_by, 'completed'
        )
        RETURNING id INTO v_activity_id;

        UPDATE crm_contacts SET last_contacted_at = NOW() WHERE id = p_contact_id;

        RETURN v_activity_id;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create activity summary view
    await db.query(`
      CREATE OR REPLACE VIEW crm_activity_summary AS
      SELECT
        a.id, a.org_id, a.contact_id, a.type, a.title, a.description,
        a.scheduled_at, a.completed_at, a.due_at, a.assigned_to,
        a.priority, a.status, a.metadata, a.created_by, a.created_at, a.updated_at,
        a.is_visible_to_contact,
        c.email AS contact_email, c.first_name AS contact_first_name,
        c.last_name AS contact_last_name, c.company AS contact_company,
        u_assigned.name AS assigned_user_name, u_assigned.email AS assigned_user_email,
        u_created.name AS created_by_name, u_created.email AS created_by_email,
        u_completed.name AS completed_by_name, u_completed.email AS completed_by_email
      FROM crm_activities a
      LEFT JOIN crm_contacts c ON c.id = a.contact_id
      LEFT JOIN users u_assigned ON u_assigned.id = a.assigned_to
      LEFT JOIN users u_created ON u_created.id = a.created_by
      LEFT JOIN users u_completed ON u_completed.id = a.completed_by;
    `);

    console.log('[Seed] CRM activities table created successfully!');

    // Mark migration as complete
    await db.query(`
      INSERT INTO _migrations (name, executed_at)
      VALUES ('012_crm_activities.sql', NOW())
      ON CONFLICT (name) DO NOTHING
    `);

  } catch (err) {
    console.error('[Seed] Error creating CRM activities table:', err.message);
    console.error('[Seed] Stack:', err.stack);
  }
}

async function seedCRMSubstages() {
  try {
    console.log('[Seed] Checking CRM substages...');

    // Check if parent_stage_id column exists
    const columnCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'crm_stages' AND column_name = 'parent_stage_id'
      );
    `);

    if (columnCheck.rows[0].exists) {
      console.log('[Seed] CRM substages already exist');
      return;
    }

    console.log('[Seed] Adding CRM substages support...');

    // Add parent_stage_id to stages
    await db.query(`
      ALTER TABLE crm_stages ADD COLUMN IF NOT EXISTS parent_stage_id UUID REFERENCES crm_stages(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_crm_stages_parent ON crm_stages(parent_stage_id);
    `);

    // Add substage_id to contact_stages
    await db.query(`
      ALTER TABLE crm_contact_stages ADD COLUMN IF NOT EXISTS substage_id UUID REFERENCES crm_stages(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_crm_contact_stages_substage ON crm_contact_stages(substage_id);
    `);

    // Update move function with substage support
    await db.query(`
      CREATE OR REPLACE FUNCTION crm_move_contact_to_stage(
        p_contact_id UUID,
        p_stage_id UUID,
        p_moved_by UUID,
        p_notes TEXT DEFAULT NULL,
        p_substage_id UUID DEFAULT NULL
      ) RETURNS UUID AS $$
      DECLARE
        v_pipeline_id UUID;
        v_org_id UUID;
        v_stage_entry_id UUID;
        v_old_stage_id UUID;
        v_parent_stage_id UUID;
      BEGIN
        SELECT pipeline_id, org_id, parent_stage_id INTO v_pipeline_id, v_org_id, v_parent_stage_id
        FROM crm_stages WHERE id = p_stage_id;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Stage not found: %', p_stage_id;
        END IF;

        IF v_parent_stage_id IS NOT NULL AND p_substage_id IS NOT NULL THEN
          RAISE EXCEPTION 'Cannot set substage when moving to a substage';
        END IF;

        IF p_substage_id IS NOT NULL THEN
          DECLARE v_substage_parent UUID;
          BEGIN
            SELECT parent_stage_id INTO v_substage_parent FROM crm_stages WHERE id = p_substage_id;
            IF v_substage_parent != p_stage_id THEN
              RAISE EXCEPTION 'Substage does not belong to stage';
            END IF;
          END;
        END IF;

        UPDATE crm_contact_stages SET exited_at = NOW()
        WHERE contact_id = p_contact_id AND pipeline_id = v_pipeline_id AND exited_at IS NULL
        RETURNING stage_id INTO v_old_stage_id;

        INSERT INTO crm_contact_stages (contact_id, stage_id, substage_id, pipeline_id, org_id, moved_by, notes)
        VALUES (p_contact_id, p_stage_id, p_substage_id, v_pipeline_id, v_org_id, p_moved_by, p_notes)
        RETURNING id INTO v_stage_entry_id;

        UPDATE crm_contacts SET updated_at = NOW() WHERE id = p_contact_id;

        PERFORM crm_log_activity(
          v_org_id, p_contact_id, 'system',
          CASE WHEN p_substage_id IS NOT NULL THEN
            'Moved to ' || (SELECT name FROM crm_stages WHERE id = p_stage_id) || ' → ' || (SELECT name FROM crm_stages WHERE id = p_substage_id)
          ELSE 'Moved to ' || (SELECT name FROM crm_stages WHERE id = p_stage_id) END,
          p_notes,
          jsonb_build_object('stage_id', p_stage_id, 'substage_id', p_substage_id, 'old_stage_id', v_old_stage_id),
          p_moved_by
        );

        RETURN v_stage_entry_id;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Recreate view with substage support
    await db.query(`
      DROP VIEW IF EXISTS crm_contact_summary;
      CREATE OR REPLACE VIEW crm_contact_summary AS
      SELECT
        c.id, c.org_id, c.member_id, c.type, c.email, c.first_name, c.last_name,
        c.phone, c.company, c.title, c.source, c.lead_score, c.assigned_to,
        c.custom_fields, c.last_contacted_at, c.created_at, c.updated_at,
        cs.stage_id AS current_stage_id, cs.substage_id AS current_substage_id,
        cs.pipeline_id AS current_pipeline_id,
        s.name AS current_stage_name, s.color AS current_stage_color,
        ss.name AS current_substage_name, ss.color AS current_substage_color,
        p.name AS current_pipeline_name, cs.entered_at AS stage_entered_at,
        u.email AS assigned_user_email, u.name AS assigned_user_name,
        m.status AS member_status, m.subscription_status AS member_subscription_status,
        COALESCE(
          (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
           FROM crm_contact_tags ct JOIN tags t ON t.id = ct.tag_id WHERE ct.contact_id = c.id),
          '[]'::json
        ) AS tags
      FROM crm_contacts c
      LEFT JOIN crm_contact_stages cs ON cs.contact_id = c.id AND cs.exited_at IS NULL
      LEFT JOIN crm_stages s ON s.id = cs.stage_id
      LEFT JOIN crm_stages ss ON ss.id = cs.substage_id
      LEFT JOIN crm_pipelines p ON p.id = cs.pipeline_id
      LEFT JOIN users u ON u.id = c.assigned_to
      LEFT JOIN members m ON m.id = c.member_id;
    `);

    console.log('[Seed] CRM substages added successfully!');

    await db.query(`
      INSERT INTO _migrations (name, executed_at)
      VALUES ('013_crm_substages.sql', NOW())
      ON CONFLICT (name) DO NOTHING
    `);

  } catch (err) {
    console.error('[Seed] Error adding CRM substages:', err.message);
    console.error('[Seed] Stack:', err.stack);
  }
}

// Sync existing members to CRM contacts
async function syncExistingMembersToCRM() {
  console.log('[Seed] Syncing existing members to CRM...');

  try {
    // Check if crm_contacts table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'crm_contacts'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('[Seed] CRM tables not created yet, skipping member sync');
      return;
    }

    // Find members without CRM contacts and create them
    const result = await db.query(`
      INSERT INTO crm_contacts (org_id, member_id, type, email, first_name, last_name, phone, source)
      SELECT
        m.org_id,
        m.id,
        'member',
        m.email,
        m.first_name,
        m.last_name,
        m.phone,
        'LMS'
      FROM members m
      WHERE NOT EXISTS (
        SELECT 1 FROM crm_contacts c WHERE c.member_id = m.id
      )
      RETURNING id;
    `);

    console.log(`[Seed] Synced ${result.rowCount} existing members to CRM contacts`);
  } catch (error) {
    console.error('[Seed] Error syncing existing members to CRM:', error.message);
  }
}

async function runSeeds() {
  console.log('[Seed] Running database seeds...');
  await seedPlatformPlans();
  await seedDeveloper();
  await seedDefaultForums();
  await seedCRMTables();
  await seedCRMActivities();
  await seedCRMSubstages();
  await syncExistingMembersToCRM();
  console.log('[Seed] Seeding complete');
}

module.exports = runSeeds;

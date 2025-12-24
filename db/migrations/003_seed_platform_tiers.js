// Seed VillageKeep platform tiers from VILLAGEKEEP_PLAN.md

async function run(db) {
  // Create platform_plans table for VillageKeep subscription tiers
  await db.query(`
    CREATE TABLE IF NOT EXISTS platform_plans (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      price_cents_monthly INT NOT NULL DEFAULT 0,
      price_cents_annual INT NOT NULL DEFAULT 0,

      -- Limits
      admin_seat_limit INT NOT NULL DEFAULT 0,
      staff_seat_limit INT NOT NULL DEFAULT 0,
      emails_per_month INT NOT NULL DEFAULT 0,
      sms_per_month INT NOT NULL DEFAULT 0,
      storage_mb INT NOT NULL DEFAULT 0,

      -- Features (booleans)
      ceu_advanced BOOLEAN DEFAULT false,
      reporting_advanced BOOLEAN DEFAULT false,
      branding_removed BOOLEAN DEFAULT false,
      custom_subdomain BOOLEAN DEFAULT false,
      custom_domain BOOLEAN DEFAULT false,
      priority_support BOOLEAN DEFAULT false,
      zoom_integration BOOLEAN DEFAULT false,
      salesforce_sync BOOLEAN DEFAULT false,
      sso_saml BOOLEAN DEFAULT false,
      sla_guarantee BOOLEAN DEFAULT false,

      -- Display
      sort_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT true,

      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Insert the three platform tiers
  await db.query(`
    INSERT INTO platform_plans (id, name, price_cents_monthly, price_cents_annual,
      admin_seat_limit, staff_seat_limit, emails_per_month, sms_per_month, storage_mb,
      ceu_advanced, reporting_advanced, branding_removed, custom_subdomain, custom_domain,
      priority_support, zoom_integration, salesforce_sync, sso_saml, sla_guarantee, sort_order)
    VALUES
      ('free', 'Free', 0, 0,
        0, 0, 1000, 0, 500,
        false, false, false, false, false,
        false, false, false, false, false, 1),
      ('pro', 'Pro', 4900, 49000,
        2, 3, 10000, 100, 10240,
        true, true, true, true, false,
        true, false, false, false, false, 2),
      ('enterprise', 'Enterprise', 14900, 149000,
        -1, -1, 50000, 500, 102400,
        true, true, true, true, true,
        true, true, true, true, true, 3)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      price_cents_monthly = EXCLUDED.price_cents_monthly,
      price_cents_annual = EXCLUDED.price_cents_annual,
      admin_seat_limit = EXCLUDED.admin_seat_limit,
      staff_seat_limit = EXCLUDED.staff_seat_limit,
      emails_per_month = EXCLUDED.emails_per_month,
      sms_per_month = EXCLUDED.sms_per_month,
      storage_mb = EXCLUDED.storage_mb,
      ceu_advanced = EXCLUDED.ceu_advanced,
      reporting_advanced = EXCLUDED.reporting_advanced,
      branding_removed = EXCLUDED.branding_removed,
      custom_subdomain = EXCLUDED.custom_subdomain,
      custom_domain = EXCLUDED.custom_domain,
      priority_support = EXCLUDED.priority_support,
      zoom_integration = EXCLUDED.zoom_integration,
      salesforce_sync = EXCLUDED.salesforce_sync,
      sso_saml = EXCLUDED.sso_saml,
      sla_guarantee = EXCLUDED.sla_guarantee
  `);

  console.log('Platform plans seeded: Free, Pro, Enterprise');
}

module.exports = run;

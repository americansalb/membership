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

async function runSeeds() {
  console.log('[Seed] Running database seeds...');
  await seedPlatformPlans();
  await seedDeveloper();
  console.log('[Seed] Seeding complete');
}

module.exports = runSeeds;

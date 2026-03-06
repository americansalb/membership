const nodemailer = require('nodemailer');

/**
 * Email Service
 * Handles sending emails for auth flows and automation actions.
 * Gracefully degrades to console logging when SMTP is not configured.
 */

// Check if SMTP is configured
function isConfigured() {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

// Template variable replacement (for CRM automation emails)
function replaceTemplateVariables(text, contact) {
  if (!text) return text;

  const variables = {
    'first_name': contact.first_name || '',
    'last_name': contact.last_name || '',
    'email': contact.email || '',
    'company': contact.company || '',
    'phone': contact.phone || '',
    'title': contact.title || '',
    'lead_score': contact.lead_score || 0,
    'id': contact.id || ''
  };

  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }

  return result;
}

// Create transporter (cached)
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  };

  transporter = nodemailer.createTransport(config);
  return transporter;
}

/**
 * Get the app's base URL for building links
 */
function getAppUrl() {
  return process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
}

/**
 * Send a simple email (for auth flows)
 * Falls back to console.log when SMTP is not configured.
 */
async function sendSimpleEmail({ to, subject, html, text }) {
  if (!isConfigured()) {
    console.log(`[Email Service] SMTP not configured. Would have sent:`);
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body: ${text || html}`);
    return { success: true, fallback: true };
  }

  try {
    const emailTransporter = getTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    const info = await emailTransporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text || (html ? html.replace(/<[^>]*>/g, '') : '')
    });

    console.log(`[Email Service] Email sent to ${to}: ${subject}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service] Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send email verification
 */
async function sendVerificationEmail(email, token, orgName) {
  const appUrl = getAppUrl();
  const verifyUrl = `${appUrl}/auth/verify-email?token=${token}`;

  return sendSimpleEmail({
    to: email,
    subject: `Verify your email - ${orgName || 'VillageMembers'}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Email</h2>
        <p>Thanks for signing up${orgName ? ' with ' + orgName : ''}! Please verify your email address by clicking the button below.</p>
        <p style="margin: 24px 0;">
          <a href="${verifyUrl}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
        </p>
        <p style="color: #666; font-size: 14px;">Or copy this link: ${verifyUrl}</p>
        <p style="color: #999; font-size: 12px;">If you didn't create this account, you can ignore this email.</p>
      </div>
    `
  });
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, token, accountType) {
  const appUrl = getAppUrl();
  const resetUrl = `${appUrl}/reset-password.html?token=${token}`;

  return sendSimpleEmail({
    to: email,
    subject: 'Reset your password - VillageMembers',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>We received a request to reset your password. Click the button below to choose a new one.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </p>
        <p style="color: #666; font-size: 14px;">Or copy this link: ${resetUrl}</p>
        <p style="color: #999; font-size: 12px;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
      </div>
    `
  });
}

/**
 * Send welcome email to new member
 */
async function sendWelcomeEmail(email, name, orgName, portalUrl) {
  return sendSimpleEmail({
    to: email,
    subject: `Welcome to ${orgName || 'VillageMembers'}!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome${name ? ', ' + name : ''}!</h2>
        <p>You've been added as a member of <strong>${orgName || 'our organization'}</strong>.</p>
        ${portalUrl ? `
        <p style="margin: 24px 0;">
          <a href="${portalUrl}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Access Member Portal</a>
        </p>
        ` : ''}
        <p style="color: #666; font-size: 14px;">If you have any questions, please contact your organization administrator.</p>
      </div>
    `
  });
}

/**
 * Send email with CRM template variable substitution (for automation actions)
 */
async function sendEmail({ to, subject, body, contact, from }) {
  if (!isConfigured()) {
    console.log(`[Email Service] SMTP not configured. Would have sent CRM email to ${to}`);
    return { success: true, fallback: true, to, subject };
  }

  try {
    const emailTransporter = getTransporter();

    const processedTo = replaceTemplateVariables(to, contact);
    const processedSubject = replaceTemplateVariables(subject, contact);
    const processedBody = replaceTemplateVariables(body, contact);
    const processedFrom = from || process.env.SMTP_FROM || process.env.SMTP_USER;

    if (!processedTo) throw new Error('Recipient email (to) is required');
    if (!processedSubject) throw new Error('Email subject is required');
    if (!processedBody) throw new Error('Email body is required');

    const info = await emailTransporter.sendMail({
      from: processedFrom,
      to: processedTo,
      subject: processedSubject,
      html: processedBody,
      text: processedBody.replace(/<[^>]*>/g, '')
    });

    console.log(`[Email Service] Email sent to ${processedTo}: ${processedSubject}`);

    return {
      success: true,
      messageId: info.messageId,
      to: processedTo,
      subject: processedSubject
    };
  } catch (error) {
    console.error('[Email Service] Failed to send email:', error.message);
    return { success: false, error: error.message, to, subject };
  }
}

/**
 * Test email configuration
 */
async function testConnection() {
  if (!isConfigured()) {
    console.log('[Email Service] SMTP not configured');
    return false;
  }
  try {
    const emailTransporter = getTransporter();
    await emailTransporter.verify();
    console.log('[Email Service] SMTP connection verified');
    return true;
  } catch (error) {
    console.error('[Email Service] SMTP connection failed:', error.message);
    return false;
  }
}

module.exports = {
  isConfigured,
  sendSimpleEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendEmail,
  testConnection,
  replaceTemplateVariables
};

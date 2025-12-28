/**
 * Content Filtering
 *
 * Provides:
 * - Profanity filtering
 * - Spam detection
 * - Link extraction and validation
 * - @mention extraction
 */

const Filter = require('bad-words');
const sanitizeHtml = require('sanitize-html');

// Initialize profanity filter
const profanityFilter = new Filter();

// Add custom words to filter (org-specific could be loaded from DB)
// profanityFilter.addWords('customword1', 'customword2');

// Spam patterns
const SPAM_PATTERNS = [
  /\b(buy now|click here|act now|limited time|free money)\b/gi,
  /\b(viagra|cialis|casino|lottery|winner)\b/gi,
  /(https?:\/\/[^\s]+){5,}/gi, // More than 5 links
  /(.)\1{10,}/g, // Repeated characters (10+)
  /\b[A-Z]{20,}\b/g, // All caps words (20+ chars)
];

// URL regex for extraction
const URL_REGEX = /https?:\/\/[^\s<>"\[\]{}|\\^`]+/gi;

// @mention regex
const MENTION_REGEX = /@([a-zA-Z0-9_-]+)/g;

/**
 * Allowed HTML tags and attributes for rich text
 */
const SANITIZE_OPTIONS = {
  allowedTags: [
    'p', 'br', 'b', 'i', 'strong', 'em', 'u', 's',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'blockquote', 'code', 'pre',
    'a', 'img',
    'hr', 'span'
  ],
  allowedAttributes: {
    'a': ['href', 'target', 'rel'],
    'img': ['src', 'alt', 'width', 'height'],
    'span': ['class'],
    '*': ['class']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    'a': (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        target: '_blank',
        rel: 'noopener noreferrer nofollow'
      }
    })
  }
};

/**
 * Check if content contains profanity
 */
function containsProfanity(text) {
  if (!text) return false;
  return profanityFilter.isProfane(text);
}

/**
 * Clean profanity from text
 */
function cleanProfanity(text) {
  if (!text) return text;
  return profanityFilter.clean(text);
}

/**
 * Check if content looks like spam
 * Returns { isSpam: boolean, reasons: string[] }
 */
function detectSpam(text) {
  if (!text) return { isSpam: false, reasons: [] };

  const reasons = [];

  // Check spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      reasons.push('Matches spam pattern');
      break;
    }
  }

  // Check for excessive links
  const links = text.match(URL_REGEX) || [];
  if (links.length > 5) {
    reasons.push('Too many links');
  }

  // Check for very short content with links (suspicious)
  if (text.length < 50 && links.length > 0) {
    reasons.push('Short content with links');
  }

  // Check for repeated content
  const words = text.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  if (words.length > 10 && uniqueWords.size / words.length < 0.3) {
    reasons.push('Highly repetitive content');
  }

  return {
    isSpam: reasons.length > 0,
    reasons
  };
}

/**
 * Sanitize HTML content
 */
function sanitizeContent(html) {
  if (!html) return '';
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

/**
 * Strip all HTML tags
 */
function stripHtml(html) {
  if (!html) return '';
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
}

/**
 * Extract URLs from text
 */
function extractUrls(text) {
  if (!text) return [];
  const matches = text.match(URL_REGEX) || [];
  return [...new Set(matches)]; // Dedupe
}

/**
 * Extract @mentions from text
 * Returns array of usernames (without @)
 */
function extractMentions(text) {
  if (!text) return [];
  const matches = [];
  let match;
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    matches.push(match[1]);
  }
  return [...new Set(matches)]; // Dedupe
}

/**
 * Convert @mentions to links
 */
function linkifyMentions(html, memberMap) {
  if (!html || !memberMap) return html;

  return html.replace(MENTION_REGEX, (match, username) => {
    const member = memberMap[username.toLowerCase()];
    if (member) {
      return `<a href="/portal/community/members/profile.html?id=${member.id}" class="mention">@${member.display_name || username}</a>`;
    }
    return match;
  });
}

/**
 * Generate preview text from HTML content
 */
function generatePreview(html, maxLength = 200) {
  const text = stripHtml(html);
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Full content processing pipeline
 */
function processContent(rawHtml, options = {}) {
  const {
    allowProfanity = false,
    checkSpam = true,
    maxLength = 50000
  } = options;

  // Sanitize HTML first
  let html = sanitizeContent(rawHtml);

  // Check length
  if (html.length > maxLength) {
    return {
      success: false,
      error: `Content exceeds maximum length of ${maxLength} characters`
    };
  }

  // Get plain text for analysis
  const plainText = stripHtml(html);

  // Check profanity
  if (!allowProfanity && containsProfanity(plainText)) {
    return {
      success: false,
      error: 'Content contains inappropriate language'
    };
  }

  // Check spam
  if (checkSpam) {
    const spamCheck = detectSpam(plainText);
    if (spamCheck.isSpam) {
      return {
        success: false,
        error: 'Content flagged as potential spam',
        reasons: spamCheck.reasons
      };
    }
  }

  // Extract mentions and URLs
  const mentions = extractMentions(plainText);
  const urls = extractUrls(plainText);

  return {
    success: true,
    html,
    plainText,
    preview: generatePreview(html),
    mentions,
    urls
  };
}

module.exports = {
  containsProfanity,
  cleanProfanity,
  detectSpam,
  sanitizeContent,
  stripHtml,
  extractUrls,
  extractMentions,
  linkifyMentions,
  generatePreview,
  processContent
};

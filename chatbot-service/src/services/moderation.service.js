const config = require('../config/env');
const logger = require('../utils/logger');

// Patterns to detect potentially harmful or injection attempts
const SUSPICIOUS_PATTERNS = [
  /ignore\s+(previous|all)\s+(instructions|prompts?)/i,
  /system\s*:\s*/i,
  /forget\s+(everything|all)/i,
  /new\s+(instructions|rules)/i,
  /you\s+are\s+now/i,
  /act\s+as\s+if/i,
  /pretend\s+(to\s+be|that)/i,
  /\<script\>/i,
  /javascript:/i,
  /\$\{/,
  /eval\s*\(/i,
  /exec\s*\(/i
];

// Blocked words/phrases
const BLOCKED_WORDS = [
  // Add any specific blocked words here if needed
];

class ModerationService {
  /**
   * Check if message contains suspicious patterns (prompt injection)
   */
  checkPromptInjection(message) {
    const lowerMessage = message.toLowerCase();
    
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(message)) {
        logger.warn('Prompt injection detected', {
          pattern: pattern.toString(),
          message: message.substring(0, 100)
        });
        return {
          isInjection: true,
          reason: 'Suspicious pattern detected',
          pattern: pattern.toString()
        };
      }
    }

    return { isInjection: false };
  }

  /**
   * Check if message contains blocked words
   */
  checkBlockedWords(message) {
    const lowerMessage = message.toLowerCase();
    
    for (const word of BLOCKED_WORDS) {
      if (lowerMessage.includes(word.toLowerCase())) {
        logger.warn('Blocked word detected', { word, message: message.substring(0, 100) });
        return {
          isBlocked: true,
          word
        };
      }
    }

    return { isBlocked: false };
  }

  /**
   * Check message length
   */
  checkMessageLength(message) {
    const maxLength = config.MESSAGE_MAX_LENGTH;
    
    if (message.length > maxLength) {
      return {
        isValid: false,
        reason: `Message exceeds maximum length of ${maxLength} characters`,
        length: message.length,
        maxLength
      };
    }

    return { isValid: true };
  }

  /**
   * Sanitize message (basic sanitization)
   */
  sanitizeMessage(message) {
    // Remove null bytes
    let sanitized = message.replace(/\0/g, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    // Limit consecutive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');
    
    return sanitized;
  }

  /**
   * Comprehensive moderation check
   */
  moderateMessage(message) {
    // Check length
    const lengthCheck = this.checkMessageLength(message);
    if (!lengthCheck.isValid) {
      return {
        allowed: false,
        reason: lengthCheck.reason,
        checks: { length: false }
      };
    }

    // Sanitize message
    const sanitized = this.sanitizeMessage(message);

    // Check for prompt injection
    const injectionCheck = this.checkPromptInjection(sanitized);
    if (injectionCheck.isInjection) {
      return {
        allowed: false,
        reason: 'Message contains suspicious content',
        checks: { injection: true }
      };
    }

    // Check for blocked words
    const blockedCheck = this.checkBlockedWords(sanitized);
    if (blockedCheck.isBlocked) {
      return {
        allowed: false,
        reason: 'Message contains blocked content',
        checks: { blocked: true }
      };
    }

    return {
      allowed: true,
      sanitized,
      checks: {
        length: true,
        injection: false,
        blocked: false
      }
    };
  }

  /**
   * Moderate AI response (optional - for content filtering)
   */
  async moderateResponse(response) {
    // Basic checks on AI response
    const lengthCheck = this.checkMessageLength(response);
    if (!lengthCheck.isValid) {
      logger.warn('AI response too long', { length: response.length });
    }

    // Can add more sophisticated moderation here
    // e.g., using OpenAI Moderation API or other services

    return {
      allowed: true,
      checks: {
        length: lengthCheck.isValid
      }
    };
  }
}

module.exports = new ModerationService();


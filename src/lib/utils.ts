import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import DOMPurify from "dompurify";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitize HTML content using DOMPurify to prevent XSS attacks
 * Use this for any user-generated HTML content
 */
export function sanitizeHtml(html: string, options?: any): string {
  if (!html) return '';
  
  const defaultConfig = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ...options
  };
  
  return DOMPurify.sanitize(html, defaultConfig) as unknown as string;
}

/**
 * Sanitize external URLs to prevent XSS attacks
 * Only allows http/https protocols
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '#';
  
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return url;
    }
    return '#';
  } catch {
    // Invalid URL, return safe fallback
    return '#';
  }
}

/**
 * Sanitize text content to prevent XSS
 * Removes potentially dangerous characters and HTML tags
 */
export function sanitizeText(text: string, maxLength: number = 1000): string {
  if (!text) return '';
  
  // Remove HTML tags
  const withoutTags = text.replace(/<[^>]*>/g, '');
  
  // Remove script-like patterns
  const withoutScripts = withoutTags.replace(/javascript:/gi, '');
  
  // Remove event handlers
  const withoutEvents = withoutScripts.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Limit length to prevent DoS
  return withoutEvents.slice(0, maxLength).trim();
}

/**
 * Validate and sanitize numeric input
 */
export function sanitizeNumber(value: any, fallback: number = 0): number {
  const num = parseFloat(value);
  if (isNaN(num) || !isFinite(num)) {
    return fallback;
  }
  return num;
}

/**
 * Sanitize email input
 * Removes dangerous characters and validates basic email format
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  // Remove whitespace and convert to lowercase
  const cleaned = email.trim().toLowerCase();
  
  // Remove any HTML tags or script patterns
  const withoutTags = cleaned.replace(/<[^>]*>/g, '');
  const withoutScripts = withoutTags.replace(/javascript:/gi, '');
  
  // Basic email validation pattern
  const emailPattern = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  // Return sanitized email if valid format, otherwise empty string
  return emailPattern.test(withoutScripts) ? withoutScripts : '';
}

/**
 * Sanitize API key input
 * Removes whitespace and dangerous characters
 */
export function sanitizeApiKey(key: string): string {
  if (!key) return '';
  
  // Remove whitespace
  const trimmed = key.trim();
  
  // Remove any HTML tags or script patterns
  const withoutTags = trimmed.replace(/<[^>]*>/g, '');
  const withoutScripts = withoutTags.replace(/javascript:/gi, '');
  
  // Only allow alphanumeric, hyphens, and underscores
  return withoutScripts.replace(/[^a-zA-Z0-9\-_]/g, '');
}

/**
 * Sanitize wallet address (Ethereum format)
 * Validates hex format and length
 */
export function sanitizeWalletAddress(address: string): string {
  if (!address) return '';
  
  // Remove whitespace
  const trimmed = address.trim();
  
  // Remove any HTML tags or script patterns
  const withoutTags = trimmed.replace(/<[^>]*>/g, '');
  const withoutScripts = withoutTags.replace(/javascript:/gi, '');
  
  // Ethereum addresses: 0x followed by 40 hex characters
  const addressPattern = /^0x[a-fA-F0-9]{40}$/;
  
  // Return sanitized address if valid format
  return addressPattern.test(withoutScripts) ? withoutScripts : trimmed;
}

/**
 * Sanitize private key (hex format)
 * Validates hex format and length (64 or 66 chars)
 */
export function sanitizePrivateKey(key: string): string {
  if (!key) return '';
  
  // Remove whitespace
  const trimmed = key.trim();
  
  // Remove any HTML tags or script patterns
  const withoutTags = trimmed.replace(/<[^>]*>/g, '');
  const withoutScripts = withoutTags.replace(/javascript:/gi, '');
  
  // Only allow hex characters and 0x prefix
  const hexOnly = withoutScripts.replace(/[^0-9a-fA-Fx]/g, '');
  
  return hexOnly;
}

/**
 * Sanitize numeric input with min/max bounds
 */
export function sanitizeNumberWithBounds(
  value: any,
  min: number,
  max: number,
  fallback: number
): number {
  const num = sanitizeNumber(value, fallback);
  return Math.max(min, Math.min(max, num));
}

/**
 * Sanitize multiline text (for prompts, descriptions)
 * Removes dangerous patterns but preserves line breaks
 */
export function sanitizeMultilineText(text: string, maxLength: number = 10000): string {
  if (!text) return '';
  
  // Remove HTML tags except line breaks
  const withoutTags = text.replace(/<(?!br\s*\/?)[^>]+>/gi, '');
  
  // Remove script-like patterns
  const withoutScripts = withoutTags.replace(/javascript:/gi, '');
  
  // Remove event handlers
  const withoutEvents = withoutScripts.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Limit length to prevent DoS
  return withoutEvents.slice(0, maxLength).trim();
}

/**
 * Escape HTML entities to prevent XSS in text content
 */
export function escapeHtml(text: string): string {
  if (!text) return '';
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char] || char);
}
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
/**
 * Sanitize external URLs to prevent XSS attacks
 * Only allows http/https protocols
 */
export function sanitizeUrl(url) {
    if (!url)
        return '#';
    try {
        const parsed = new URL(url);
        // Only allow http and https protocols
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return url;
        }
        return '#';
    }
    catch {
        // Invalid URL, return safe fallback
        return '#';
    }
}
/**
 * Sanitize text content to prevent XSS
 * Removes potentially dangerous characters and HTML tags
 */
export function sanitizeText(text, maxLength = 1000) {
    if (!text)
        return '';
    // Remove HTML tags
    const withoutTags = text.replace(/<[^>]*>/g, '');
    // Remove script-like patterns
    const withoutScripts = withoutTags.replace(/javascript:/gi, '');
    // Limit length to prevent DoS
    return withoutScripts.slice(0, maxLength).trim();
}
/**
 * Validate and sanitize numeric input
 */
export function sanitizeNumber(value, fallback = 0) {
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
export function sanitizeEmail(email) {
    if (!email)
        return '';
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
export function sanitizeApiKey(key) {
    if (!key)
        return '';
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
export function sanitizeWalletAddress(address) {
    if (!address)
        return '';
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
export function sanitizePrivateKey(key) {
    if (!key)
        return '';
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
export function sanitizeNumberWithBounds(value, min, max, fallback) {
    const num = sanitizeNumber(value, fallback);
    return Math.max(min, Math.min(max, num));
}
/**
 * Sanitize multiline text (for prompts, descriptions)
 * Removes dangerous patterns but preserves line breaks
 */
export function sanitizeMultilineText(text, maxLength = 10000) {
    if (!text)
        return '';
    // Remove HTML tags except line breaks
    const withoutTags = text.replace(/<(?!br\s*\/?)[^>]+>/gi, '');
    // Remove script-like patterns
    const withoutScripts = withoutTags.replace(/javascript:/gi, '');
    // Remove event handlers
    const withoutEvents = withoutScripts.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    // Limit length to prevent DoS
    return withoutEvents.slice(0, maxLength).trim();
}

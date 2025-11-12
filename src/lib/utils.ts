import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
  
  // Limit length to prevent DoS
  return withoutScripts.slice(0, maxLength).trim();
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
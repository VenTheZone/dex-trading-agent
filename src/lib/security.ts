/**
 * Security utilities for XSS protection and input validation
 */

/**
 * Validate that a string doesn't contain script injection attempts
 */
export function isScriptInjection(input: string): boolean {
  if (!input) return false;
  
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /eval\(/gi,
    /expression\(/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(input));
}

import { storeGet, storeSet } from "./storage";

/**
 * Validate store access is safe
 */
export async function safeStoreGet(key: string): Promise<string | null> {
  try {
    const value = await storeGet<string>(key);
    if (value && isScriptInjection(value)) {
      console.warn(`Potential XSS detected in store key: ${key}`);
      // Consider if we should clear it here as well
      return null;
    }
    return value;
  } catch (error) {
    console.error('Store access error:', error);
    return null;
  }
}

/**
 * Safely set store with validation
 */
export async function safeStoreSet(key: string, value: string): Promise<boolean> {
  try {
    if (isScriptInjection(value)) {
      console.warn(`Attempted to store potentially malicious content in store key: ${key}`);
      return false;
    }
    await storeSet(key, value);
    return true;
  } catch (error) {
    console.error('Store write error:', error);
    return false;
  }
}

/**
 * Content Security Policy violation reporter
 */
export function setupCSPReporting() {
  if (typeof window !== 'undefined') {
    window.addEventListener('securitypolicyviolation', (e) => {
      console.error('CSP Violation:', {
        blockedURI: e.blockedURI,
        violatedDirective: e.violatedDirective,
        originalPolicy: e.originalPolicy,
      });
      
      // In production, you might want to send this to a logging service
      // fetch('/api/csp-report', { method: 'POST', body: JSON.stringify(e) });
    });
  }
}

export const encryptData = (data: string, key: string): string => {
  // Simple XOR encryption for demo purposes
  // In production, use a proper encryption library like crypto-js
  let encrypted = '';
  for (let i = 0; i < data.length; i++) {
    encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return encrypted;
}
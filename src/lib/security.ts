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

/**
 * Validate localStorage access is safe
 */
export function safeLocalStorageGet(key: string): string | null {
  try {
    const value = localStorage.getItem(key);
    if (value && isScriptInjection(value)) {
      console.warn(`Potential XSS detected in localStorage key: ${key}`);
      localStorage.removeItem(key);
      return null;
    }
    return value;
  } catch (error) {
    console.error('localStorage access error:', error);
    return null;
  }
}

/**
 * Safely set localStorage with validation
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    if (isScriptInjection(value)) {
      console.warn(`Attempted to store potentially malicious content in localStorage key: ${key}`);
      return false;
    }
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error('localStorage write error:', error);
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
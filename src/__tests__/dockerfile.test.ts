import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

describe('Dockerfile Configuration', () => {
  it('should have correct base image', () => {
    const dockerfile = fs.readFileSync(path.join(process.cwd(), 'Dockerfile'), 'utf-8');
    
    // Check base image
    expect(dockerfile).toContain('FROM node:');
  });
});
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

describe('Docker Integration', () => {
  it('should have consistent configuration', () => {
    const dockerCompose = fs.readFileSync(path.join(process.cwd(), 'docker-compose.yml'), 'utf-8');
    
    // Check for services
    expect(dockerCompose).toContain('services:');
    expect(dockerCompose).toContain('backend:');
  });
});
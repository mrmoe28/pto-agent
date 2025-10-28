#!/usr/bin/env node

/**
 * Wrapper script to load environment variables before running Square migration
 */

const { config } = require('dotenv');
const { resolve } = require('path');
const { spawn } = require('child_process');

// Load .env.local
config({ path: resolve(__dirname, '../.env.local') });

console.log('✅ Environment variables loaded');
console.log('📦 DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

// Run the migration script
const child = spawn('npx', ['tsx', 'scripts/migrate-square.ts'], {
  stdio: 'inherit',
  env: { ...process.env },
  cwd: resolve(__dirname, '..')
});

child.on('exit', (code) => {
  process.exit(code);
});

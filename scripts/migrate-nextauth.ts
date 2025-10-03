#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import { join } from 'path';
import { sql } from '../src/lib/neon';

async function migrateNextAuth() {
  console.log('🚀 Running NextAuth tables migration...');

  try {
    const migrationPath = join(__dirname, '../drizzle/0001_shocking_violations.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📖 Reading NextAuth migration file...');

    // Split into statements
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

      try {
        await sql.unsafe(statement);
        console.log(`✅ Statement ${i + 1} completed successfully`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('already exists')) {
          console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
        } else {
          console.error(`❌ Statement ${i + 1} failed:`, errorMessage);
          throw error;
        }
      }
    }

    console.log('🎉 NextAuth tables migration completed!');

    // Verify users table exists
    const usersTableCheck = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'users'
    `;

    if (usersTableCheck.length > 0) {
      console.log('✅ Users table exists!');

      // Check columns
      const columnsCheck = await sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `;

      console.log(`📊 Users table has ${columnsCheck.length} columns`);
    } else {
      console.error('❌ Users table was not created');
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

migrateNextAuth()
  .then(() => {
    console.log('✨ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

async function createUser() {
  try {
    const email = 'ekosolarize@gmail.com';
    const password = 'Opendoors28$';
    const name = 'Eko Solarize';

    console.log('🔍 Checking if user already exists...');

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      console.log('⚠️  User already exists!');
      console.log('User ID:', existingUser.id);
      console.log('Email:', existingUser.email);
      console.log('Name:', existingUser.name);

      // Ask if they want to update the password
      console.log('\n💡 If you want to update the password, delete the user first or update directly in DB.');
      return;
    }

    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('📝 Creating user...');
    const [newUser] = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      emailVerified: null,
      image: null,
    }).returning();

    console.log('\n✅ User created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('User ID:', newUser.id);
    console.log('Email:', newUser.email);
    console.log('Name:', newUser.name);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎉 You can now sign in with:');
    console.log('Email:', email);
    console.log('Password: Opendoors28$');
    console.log('\n🌐 Go to: http://localhost:3000/sign-in');

  } catch (error) {
    console.error('❌ Error creating user:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

createUser();

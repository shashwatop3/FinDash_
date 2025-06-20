// src/seed.ts

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { accounts } from './db/schema';
import { config } from 'dotenv';

config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seed() {
  await db.insert(accounts).values([
    { name: 'Alice', email: 'alice@hotmail.com', userId: '1'},
    { name: 'Bob', email: 'bob@gmail.com', userId: '2'},
    { name: 'Charlie', email: 'charlie@yahoo.com', userId: '3'},
  ]);
} 

async function main() {
  try {
    await seed();
    console.log('Seeding completed');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

main();
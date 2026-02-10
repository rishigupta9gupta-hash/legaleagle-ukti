// Database migration script - Run this to set up tables for doctor auth + B2B chat
// Usage: node scripts/init-tables.js

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🚀 Starting database migration...\n');

        // 1. Add role and doctor fields to users table
        console.log('1️⃣  Adding role and doctor fields to users table...');
        await client.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
            ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
            ALTER TABLE users ADD COLUMN IF NOT EXISTS specialization VARCHAR(100);
            ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
        `);
        console.log('   ✅ Users table updated\n');

        // 2. Create conversations table
        console.log('2️⃣  Creating conversations table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                participant_one TEXT NOT NULL,
                participant_two TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(participant_one, participant_two)
            );
        `);
        console.log('   ✅ Conversations table created\n');

        // 3. Create messages table
        console.log('3️⃣  Creating messages table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
                sender_id TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
            CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
        `);
        console.log('   ✅ Messages table created\n');

        // 4. Create certifications table
        console.log('4️⃣  Creating certifications table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS certifications (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                user_email TEXT NOT NULL,
                title VARCHAR(255) NOT NULL,
                file_url TEXT NOT NULL,
                file_type VARCHAR(20) DEFAULT 'image',
                created_at TIMESTAMP DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_certifications_email ON certifications(user_email);
        `);
        console.log('   ✅ Certifications table created\n');

        console.log('🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();

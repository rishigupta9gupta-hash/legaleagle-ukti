const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL not found in .env or .env.local');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const setupDatabase = async () => {
    const client = await pool.connect();

    try {
        console.log('Connected to database. Creating tables...');

        // 1. Users Table
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        password TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
        console.log('✅ Users table created');

        // 2. User Preferences
        await client.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        language TEXT DEFAULT 'en',
        conditions TEXT[] DEFAULT '{}',
        allergies TEXT[] DEFAULT '{}',
        reminder_enabled BOOLEAN DEFAULT true,
        reminder_time TEXT DEFAULT '09:00',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `);
        console.log('✅ User Preferences table created');

        // 3. Health Sessions
        await client.query(`
      CREATE TABLE IF NOT EXISTS health_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        mode TEXT DEFAULT 'medical',
        language TEXT DEFAULT 'en',
        duration INTEGER DEFAULT 0,
        severity TEXT DEFAULT 'low',
        transcript JSONB,
        summary TEXT,
        recommendations TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
        console.log('✅ Health Sessions table created');

        // 4. Medications
        await client.query(`
      CREATE TABLE IF NOT EXISTS medications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        dosage TEXT,
        frequency TEXT DEFAULT 'daily',
        time TEXT DEFAULT '09:00',
        expiry_date TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        image_url TEXT,
        taken_dates TEXT[] DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
        console.log('✅ Medications table created');

        // 5. Reports
        await client.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        file_name TEXT NOT NULL,
        file_type TEXT,
        file_url TEXT,
        analysis TEXT,
        summary TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
        console.log('✅ Reports table created');

        // 6. User Programs
        await client.query(`
      CREATE TABLE IF NOT EXISTS user_programs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        program_id TEXT NOT NULL,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        progress JSONB DEFAULT '{}',
        mood_logs JSONB DEFAULT '[]',
        water_intake JSONB DEFAULT '{}',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
        console.log('✅ User Programs table created');

        console.log('🎉 Database setup complete!');
    } catch (err) {
        console.error('Error setting up database:', err);
    } finally {
        client.release();
        pool.end();
    }
};

setupDatabase();

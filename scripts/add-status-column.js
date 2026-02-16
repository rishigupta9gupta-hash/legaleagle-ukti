const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log('Adding status column manually...');

        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'PENDING';
        `);

        console.log('Column added successfully.');
    } catch (err) {
        console.error('Error adding column:', err);
    } finally {
        await pool.end();
    }
}

main();

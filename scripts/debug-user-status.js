const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log('Fetching last 5 users...');
        const res = await pool.query(`
            SELECT id, name, email, role, status, "isApproved", created_at 
            FROM users 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error('Error fetching users:', err);
    } finally {
        await pool.end();
    }
}

main();

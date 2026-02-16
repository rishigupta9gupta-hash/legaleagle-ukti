const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log('Checking Admin user status...');
        const email = 'admin@vira.com';

        const res = await pool.query(
            `SELECT id, email, role, "isAdmin", "isApproved" FROM users WHERE email = $1`,
            [email]
        );

        if (res.rows.length > 0) {
            console.log('Admin User Found:', res.rows[0]);
        } else {
            console.log('Admin user NOT found.');
        }
    } catch (err) {
        console.error('Error checking admin:', err);
    } finally {
        await pool.end();
    }
}

main();

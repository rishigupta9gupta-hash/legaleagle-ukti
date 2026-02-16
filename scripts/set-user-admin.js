const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        const email = 'gfhkhihhi@gmail.com';
        console.log(`Making ${email} an admin...`);

        const res = await pool.query(
            `UPDATE users SET "isAdmin" = true, "role" = 'admin' WHERE email = $1 RETURNING id, email, "isAdmin"`,
            [email]
        );

        if (res.rowCount > 0) {
            console.log('Success!', res.rows[0]);
        } else {
            console.log('User not found. Creating...');
            await pool.query(
                `INSERT INTO users (name, email, password, role, "isApproved", "isAdmin") VALUES ($1, $2, $3, 'admin', true, true)`,
                ['Admin User', email, 'admin123']
            );
            console.log('Created new admin user.');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

main();

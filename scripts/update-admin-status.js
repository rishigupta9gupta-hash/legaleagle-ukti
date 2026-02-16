const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log('Updating Admin user...');
        const email = 'admin@vira.com';

        // Update existing admin user
        const res = await pool.query(
            `UPDATE users SET "isAdmin" = true WHERE email = $1`,
            [email]
        );

        if (res.rowCount > 0) {
            console.log('Successfully updated admin user to have isAdmin=true');
        } else {
            console.log('Admin user not found, creating new one...');
            await pool.query(
                `INSERT INTO users (name, email, password, role, "isApproved", "isAdmin") VALUES ($1, $2, $3, 'admin', true, true)`,
                ['System Admin', email, 'admin123']
            );
            console.log('Created new admin user.');
        }
    } catch (err) {
        console.error('Error updating admin:', err);
    } finally {
        await pool.end();
    }
}

main();

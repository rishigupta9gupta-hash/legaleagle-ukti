const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log('Forcing approval for all doctors...');

        const res = await pool.query(`
            UPDATE users 
            SET "status" = 'APPROVED', "isApproved" = true 
            WHERE role = 'doctor';
        `);

        console.log(`Updated ${res.rowCount} doctors to APPROVED.`);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

main();

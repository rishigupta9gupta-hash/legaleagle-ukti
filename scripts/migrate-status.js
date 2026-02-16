const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log('Migrating status fields...');

        // Approve = true -> APPROVED
        await pool.query(`UPDATE users SET "status" = 'APPROVED' WHERE "isApproved" = true`);

        // Approve = false -> PENDING (default, but good to ensure)
        await pool.query(`UPDATE users SET "status" = 'PENDING' WHERE "isApproved" = false`);

        console.log('Migration complete.');
    } catch (err) {
        console.error('Error migrating:', err);
    } finally {
        await pool.end();
    }
}

main();

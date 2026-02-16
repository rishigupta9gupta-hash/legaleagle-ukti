const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log('Checking recent doctor...');
        const res = await pool.query(`
            SELECT id, email, role, "status", "isApproved" 
            FROM users 
            WHERE role = 'doctor' 
            ORDER BY created_at DESC 
            LIMIT 1
        `);

        if (res.rows.length > 0) {
            const user = res.rows[0];
            console.log('Doctor Found:');
            console.log(`ID: ${user.id}`);
            console.log(`Email: ${user.email}`);
            console.log(`Role: '${user.role}'`);
            console.log(`Status: '${user.status}' (Length: ${user.status ? user.status.length : 0})`);
            console.log(`IsApproved: ${user.isApproved}`);

            if (user.status === 'APPROVED') {
                console.log('✅ Status is EXACTLY "APPROVED"');
            } else {
                console.log('❌ Status IS NOT "APPROVED"');
            }
        } else {
            console.log('No doctors found.');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

main();

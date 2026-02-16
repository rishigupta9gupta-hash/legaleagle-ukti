const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function main() {
    try {
        console.log('Using DB URL:', process.env.DATABASE_URL);
        const client = await pool.connect();

        const email = 'admin@vira.com';
        const password = 'admin123'; // In a real app, this should be hashed, but app might use plain text or similar simple hash in demo

        // Check if admin exists
        const checkRes = await client.query('SELECT id FROM users WHERE email = $1', [email]);

        if (checkRes.rows.length > 0) {
            console.log('Admin user already exists.');
        } else {
            // Create admin user
            // Assuming the app has simple password handling or I should replicate the hashing if I can see it.
            // The register route just inserts the password directly? Let's check.
            // app/api/auth/doctor-register uses `await request.json()` then inserts password directly.
            // So raw password is fine for now (though insecure, it fits the existing pattern).

            await client.query(
                `INSERT INTO users (name, email, password, role, "isApproved") VALUES ($1, $2, $3, 'admin', true)`,
                ['System Admin', email, password]
            );
            console.log('Admin user created successfully.');
            console.log('Email:', email);
            console.log('Password:', password);
        }

        client.release();
    } catch (err) {
        console.error('Error seeding admin:', err);
    } finally {
        await pool.end();
    }
}

main();

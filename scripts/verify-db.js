// Simple database verification script
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function verifyConnection() {
    console.log('🔍 Verifying Supabase Connection...\n');

    // Check environment variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('Environment Variables:');
    console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${url ? '✅ Set' : '❌ Missing'}`);
    console.log(`  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${key ? '✅ Set (length: ' + key?.length + ')' : '❌ Missing'}\n`);

    if (!url || !key) {
        console.error('❌ Missing environment variables. Please check your .env.local file.');
        process.exit(1);
    }

    const supabase = createClient(url, key);

    // Test database connection
    console.log('Testing Database Connection...\n');

    const tables = [
        'users',
        'results',
        'results_pending',
        'announcements',
        'admissions',
        'settings',
        'books',
        'allocations',
        'subjects',
        'attendance',
        'password_reset_requests',
        'notifications'
    ];

    let allConnected = true;

    for (const table of tables) {
        try {
            const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true });
            if (error) {
                console.error(`❌ ${table} table error:`, error.message);
                allConnected = false;
            } else {
                console.log(`✅ ${table} table: Connected`);
            }
        } catch (err) {
            console.error(`❌ ${table} table error:`, err.message);
            allConnected = false;
        }
    }

    if (allConnected) {
        console.log('\n✅ Database connectivity verification complete!');
        console.log('All required tables are accessible.\n');
        console.log('🚀 You can now run: npm run dev');
    } else {
        console.log('\n❌ Some tables are not accessible. Please check your Supabase setup.');
        process.exit(1);
    }
}

verifyConnection();

/**
 * Simple Admin Account Creator
 * Creates an admin account directly in the database
 */

const bcrypt = require('bcryptjs');

async function createAdminHash() {
    const password = 'Admin123';
    const hash = await bcrypt.hash(password, 10);

    console.log('\n═══════════════════════════════════════');
    console.log('ADMIN ACCOUNT SETUP');
    console.log('═══════════════════════════════════════');
    console.log('\nManually add this admin to your Supabase database:');
    console.log('\n1. Go to Supabase Dashboard → Table Editor → users');
    console.log('2. Click "Insert" → "Insert row"');
    console.log('3. Fill in these values:\n');
    console.log('   id:         admin-001');
    console.log('   name:       Administrator');
    console.log('   email:      admin@excel.edu');
    console.log('   password:   ' + hash);
    console.log('   role:       admin');
    console.log('   admin_id:   AD-2025-001');
    console.log('   status:     active');
    console.log('\n4. Click "Save"');
    console.log('\n═══════════════════════════════════════');
    console.log('LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════');
    console.log('Email:    admin@excel.edu');
    console.log('Password: Admin123');
    console.log('═══════════════════════════════════════\n');
}

createAdminHash();

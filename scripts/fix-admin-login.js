/**
 * Admin Account Fix Script
 * 
 * This script ensures the admin account exists in the database
 * with the correct hashed password.
 * 
 * Run: node scripts/fix-admin-login.js
 */

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function fixAdminLogin() {
    console.log('🔧 Fixing Admin Login...\n');

    const adminEmail = 'admin@excel.edu';
    const adminPassword = 'Admin123';
    const adminId = 'AD-2025-001';

    try {
        // Hash the password
        console.log('🔐 Hashing admin password...');
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        console.log('✅ Password hashed successfully\n');

        // Check if admin exists
        console.log('🔍 Checking for existing admin account...');
        const { data: existingAdmins, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'admin');

        if (fetchError) {
            console.error('❌ Error fetching admins:', fetchError.message);
            throw fetchError;
        }

        if (existingAdmins && existingAdmins.length > 0) {
            console.log(`📝 Found ${existingAdmins.length} admin account(s)`);

            // Update the first admin with correct credentials
            const admin = existingAdmins[0];
            console.log(`🔄 Updating admin account: ${admin.email || admin.id}\n`);

            const { error: updateError } = await supabase
                .from('users')
                .update({
                    email: adminEmail,
                    password: hashedPassword,
                    admin_id: adminId,
                    name: 'Administrator',
                    role: 'admin',
                    status: 'active',
                    updated_at: new Date().toISOString()
                })
                .eq('id', admin.id);

            if (updateError) {
                console.error('❌ Error updating admin:', updateError.message);
                throw updateError;
            }

            console.log('✅ Admin account updated successfully!\n');
        } else {
            console.log('📝 No admin account found. Creating new admin...\n');

            // Create new admin
            const { error: createError } = await supabase
                .from('users')
                .insert({
                    id: 'admin-001',
                    name: 'Administrator',
                    email: adminEmail,
                    password: hashedPassword,
                    role: 'admin',
                    admin_id: adminId,
                    status: 'active',
                    created_at: new Date().toISOString()
                });

            if (createError) {
                console.error('❌ Error creating admin:', createError.message);
                throw createError;
            }

            console.log('✅ Admin account created successfully!\n');
        }

        // Display login credentials
        console.log('═══════════════════════════════════════');
        console.log('✅ ADMIN LOGIN CREDENTIALS');
        console.log('═══════════════════════════════════════');
        console.log(`Email:    ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        console.log('═══════════════════════════════════════\n');

        console.log('🎉 Admin login is now fixed!');
        console.log('You can now login with the credentials above.\n');

    } catch (error) {
        console.error('\n💥 Failed to fix admin login:', error.message);
        console.log('\n📝 Manual Fix:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to Table Editor → users');
        console.log('3. Find or create an admin user');
        console.log('4. Set the following values:');
        console.log(`   - email: ${adminEmail}`);
        console.log(`   - password: ${await bcrypt.hash(adminPassword, 10)}`);
        console.log(`   - role: admin`);
        console.log(`   - status: active`);
        console.log(`   - admin_id: ${adminId}`);
        process.exit(1);
    }
}

// Run the fix
fixAdminLogin();

/**
 * Password Migration Script
 * 
 * This script migrates existing plain-text passwords to bcrypt hashes.
 * Run this ONCE after deploying the password hashing changes.
 * 
 * Usage: node scripts/migrate-passwords.js
 */

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const SALT_ROUNDS = 10;

/**
 * Check if a string is already a bcrypt hash
 */
function isBcryptHash(str) {
    return /^\$2[aby]\$\d{2}\$.{53}$/.test(str);
}

async function migratePasswords() {
    try {
        console.log('🔄 Starting password migration...\n');

        // Fetch all users
        const { data: users, error } = await supabase
            .from('users')
            .select('*');

        if (error) {
            throw new Error(`Failed to fetch users: ${error.message}`);
        }

        if (!users || users.length === 0) {
            console.log('✅ No users found in database.');
            return;
        }

        console.log(`📊 Found ${users.length} users to process.\n`);

        let migrated = 0;
        let skipped = 0;
        let failed = 0;

        for (const user of users) {
            const { id, email, password } = user;

            // Skip if already hashed
            if (isBcryptHash(password)) {
                console.log(`⏭️  Skipping ${email || id} - already hashed`);
                skipped++;
                continue;
            }

            try {
                // Hash the plain-text password
                const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

                // Update in database
                const { error: updateError } = await supabase
                    .from('users')
                    .update({ password: hashedPassword })
                    .eq('id', id);

                if (updateError) {
                    throw updateError;
                }

                console.log(`✅ Migrated ${email || id}`);
                migrated++;
            } catch (err) {
                console.error(`❌ Failed to migrate ${email || id}:`, err.message);
                failed++;
            }
        }

        console.log('\n📈 Migration Summary:');
        console.log(`   ✅ Migrated: ${migrated}`);
        console.log(`   ⏭️  Skipped: ${skipped}`);
        console.log(`   ❌ Failed: ${failed}`);
        console.log(`   📊 Total: ${users.length}\n`);

        if (failed === 0) {
            console.log('🎉 Password migration completed successfully!');
        } else {
            console.log('⚠️  Migration completed with errors. Please review failed users.');
        }
    } catch (error) {
        console.error('💥 Migration failed:', error.message);
        process.exit(1);
    }
}

// Run migration
migratePasswords();

/**
 * Clear All Announcements from Database
 * This script removes all announcements from the Supabase database
 */

import { supabaseAdmin } from '../src/lib/supabase.js';

async function clearAnnouncements() {
    console.log('\n🗑️  Clearing all announcements from database...\n');
    console.log('='.repeat(60));

    try {
        if (!supabaseAdmin) {
            console.log('❌ Supabase admin client not available');
            console.log('   Please check your environment variables');
            return;
        }

        // Delete all announcements
        const { data, error } = await supabaseAdmin
            .from('announcements')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

        if (error) {
            console.log('❌ Error clearing announcements:', error.message);
            return;
        }

        console.log('✅ Successfully cleared all announcements from database');
        console.log('='.repeat(60) + '\n');

        // Verify deletion
        const { data: remaining, error: checkError } = await supabaseAdmin
            .from('announcements')
            .select('count');

        if (!checkError) {
            console.log(`📊 Remaining announcements: ${remaining?.length || 0}`);
        }

    } catch (err) {
        console.log('❌ Fatal error:', err.message);
    }
}

clearAnnouncements();

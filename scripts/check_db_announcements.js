const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAnnouncements() {
    const { data, error } = await supabase
        .from('announcements')
        .select('*');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Total announcements:', data.length);
    console.log('Data:', JSON.stringify(data, null, 2));
}

checkAnnouncements();

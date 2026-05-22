const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(url, key);

  console.log('Testing RPC exec_sql...');
  try {
    const { data: data1, error: error1 } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' });
    console.log('exec_sql status:', { data: data1, error: error1 });
  } catch (err) {
    console.error('exec_sql catch error:', err);
  }

  console.log('Testing run_sql...');
  try {
    const { data: data2, error: error2 } = await supabase.rpc('run_sql', { sql: 'SELECT 1' });
    console.log('run_sql status:', { data: data2, error: error2 });
  } catch (err) {
    console.error('run_sql catch error:', err);
  }

  console.log('Testing if we can query schema metadata...');
  try {
    const { data: data3, error: error3 } = await supabase.from('results').select('*').limit(1);
    console.log('results columns check:', data3 ? Object.keys(data3[0] || {}) : null, 'error:', error3);
  } catch (err) {
    console.error('results columns check catch error:', err);
  }
}

main().catch(console.error);

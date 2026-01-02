const { createClient } = require('@supabase/supabase-js');

async function run() {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
      process.exit(1);
    }

    const supabase = createClient(url, key);

    console.log('Resetting test tables...');
    // Note: adjust table names as necessary
    await supabase.from('results').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('results_pending').delete().neq('student_id', '');
    await supabase.from('allocations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('users').delete().neq('id', 'admin-001');

    // Reset settings to minimal known state
    const defaultAssessments = [
      { id: 'test-1', label: 'test 1', weight: 10, maxMarks: 10 },
      { id: 'mid-', label: 'Mid ', weight: 15, maxMarks: 15 },
      { id: 'test-2', label: 'test 2', weight: 10, maxMarks: 10 },
      { id: 'assesment', label: 'Assesment', weight: 5, maxMarks: 5 },
      { id: 'final-exam', label: 'Final exam', weight: 60, maxMarks: 60 }
    ];

    await supabase.from('settings').upsert({ key: 'assessmentTypes', value: defaultAssessments });
    await supabase.from('settings').upsert({ key: 'principalName', value: 'Principal' });
    await supabase.from('settings').upsert({ key: 'homeroomName', value: 'Class Teacher' });

    // Ensure admin exists
    const { data: admins } = await supabase.from('users').select('*').eq('id', 'admin-001');
    if (!admins || admins.length === 0) {
      await supabase.from('users').insert([{ id: 'admin-001', name: 'Admin User', email: 'admin@excel.edu', password: 'Admin123', role: 'admin', status: 'active' }]);
    }

    console.log('DB reset complete.');
    process.exit(0);
  } catch (err) {
    console.error('DB reset failed:', err);
    process.exit(1);
  }
}

run();
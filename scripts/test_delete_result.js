(async () => {
  try {
    const base = 'http://127.0.0.1:3000';
    // Create a dummy results object keyed by a user id
    const key = 'user-test-123';
    const results = {};
    results[key] = { studentId: 'ST-TEST-001', studentName: 'Test Student', grade: '9', section: 'A', subjects: [{ name: 'Math', marks: 88 }], total: 88, average: 88, conduct: 'Satisfactory', status: 'promoted', rank: 1 };

    let r = await fetch(base + '/api/results', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-actor-role': 'admin', 'x-actor-id': 'admin-001' }, body: JSON.stringify(results) });
    console.log('POST results status', r.status);

    // Check it's there
    r = await fetch(base + '/api/results');
    const current = await r.json();
    console.log('Before delete keys:', Object.keys(current));

    // Delete using admin pattern
    const keyToDelete = Object.keys(current).find(k => current[k].studentId === 'ST-TEST-001');
    if (!keyToDelete) { console.log('key not found'); process.exit(1); }
    delete current[keyToDelete];
    r = await fetch(base + '/api/results', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-actor-role': 'admin', 'x-actor-id': 'admin-001' }, body: JSON.stringify(current) });
    console.log('Delete POST status', r.status);

    r = await fetch(base + '/api/results');
    const after = await r.json();
    console.log('After delete keys:', Object.keys(after));

  } catch (e) {
    console.error(e);
  }
})();
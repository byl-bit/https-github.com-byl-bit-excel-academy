const fetch = globalThis.fetch ? globalThis.fetch.bind(globalThis) : (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE = process.env.BASE || 'http://127.0.0.1:3000';

async function run() {
  try {
    console.log('Starting force-reset integration test...');

    const email = `force-reset-${Date.now()}@example.com`;
    const initial = 'initialPass1!';
    const newPass = 'newPass!234';

    // Create student
    const student = { id: `user-test-${Date.now()}`, name: 'Force Reset Test', email, password: initial, role: 'student', status: 'active' };
    let res = await fetch(`${BASE}/api/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify([student]) });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('Failed to create student: ' + txt);
    }

    // Force reset as admin
    res = await fetch(`${BASE}/api/admin/force-reset`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-actor-role': 'admin', 'x-actor-id': 'admin-001' }, body: JSON.stringify({ userId: student.id, newPassword: newPass }) });
    const jr = await res.json();
    if (!res.ok || !jr.success) throw new Error('Force reset failed: ' + JSON.stringify(jr));

    // Try to login with new password
    res = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: newPass }) });
    const loginJson = await res.json();
    if (!res.ok || !loginJson.success) throw new Error('Login with new password failed: ' + JSON.stringify(loginJson));

    console.log('PASS: force-reset integration test succeeded');
    process.exit(0);
  } catch (err) {
    console.error('FAIL:', err);
    process.exit(1);
  }
}

run();
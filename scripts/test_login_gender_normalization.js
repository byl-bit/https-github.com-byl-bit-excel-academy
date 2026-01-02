const fetch = globalThis.fetch ? globalThis.fetch.bind(globalThis) : (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE = process.env.BASE || 'http://127.0.0.1:3000';

async function run() {
  try {
    console.log('Starting login gender normalization test...');

    const ts = Date.now();
    const user = {
      id: `user-login-g-${ts}`,
      name: 'Login Gender Test',
      email: `login.gender.test.${ts}@example.com`,
      password: 'Password123!',
      role: 'student',
      status: 'active',
      studentId: `ST-LOGIN-${ts}`,
      grade: '1',
      section: 'A',
      sex: 'fimail' // intentionally misspelled to test normalization
    };

    // Create user (POST /api/users)
    let res = await fetch(`${BASE}/api/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify([user]) });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('Failed to create test user: ' + txt);
    }

    // Login with created user credentials
    res = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, password: user.password }) });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('Login failed: ' + txt);
    }

    const payload = await res.json();
    if (!payload || !payload.user) {
      throw new Error('No user returned from login');
    }

    const gender = payload.user.gender;
    console.log('Login returned gender:', gender);

    if (gender !== 'F') {
      throw new Error(`Normalization failed - expected 'F' but got '${gender}'`);
    }

    console.log('PASS: login gender normalization test succeeded');
    process.exit(0);
  } catch (err) {
    console.error('FAIL:', err);
    process.exit(1);
  }
}

run();

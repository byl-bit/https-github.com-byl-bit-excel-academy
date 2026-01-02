(async () => {
  try {
    const base = process.env.BASE || 'http://127.0.0.1:3000';
    console.log('Testing admin reset against', base + '/api/auth/reset-password');

    const payload = {
      userId: 'AD-2025-001',
      email: 'admin@excel.edu',
      fullName: 'Administrator',
      newPassword: 'NewAdminPass123!',
      isAdminGate: true
    };

    const res = await fetch(base + '/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log('Reset response status:', res.status);
    console.log('Reset response body:', data);

    if (res.ok) {
      // Try to login with new credentials
      console.log('Attempting login with new password...');
      const loginRes = await fetch(base + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: payload.email, password: payload.newPassword })
      });
      const loginData = await loginRes.json();
      console.log('Login response status:', loginRes.status);
      console.log('Login response body:', loginData);
      if (loginRes.ok) {
        console.log('Admin reset and login verification SUCCESS');
        process.exit(0);
      } else {
        console.error('Login verification failed');
        process.exit(2);
      }
    } else {
      console.error('Reset failed, see response above');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test script error:', err);
    process.exit(3);
  }
})();
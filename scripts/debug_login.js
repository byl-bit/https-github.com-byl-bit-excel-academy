(async () => {
  try {
    const base = process.env.BASE || 'http://127.0.0.1:3000';
    const creds = { email: 'admin@excel.edu', password: 'Admin123' };

    // Fetch users
    const usersRes = await fetch(base + '/api/users');
    const users = await usersRes.json();

    const admin = (Array.isArray(users) ? users.find(u => u.email === creds.email) : null) || users;

    console.log('Users endpoint returned count:', Array.isArray(users) ? users.length : 'not array');
    console.log('Admin record (raw):', admin);

    // Attempt login
    const res = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds)
    });
    console.log('Login status', res.status);
    const body = await res.text();
    console.log('Login body:', body);
  } catch (err) {
    console.error('Error during debug login:', err);
  }
})();
(async () => {
  try {
    const base = process.env.BASE || 'http://127.0.0.1:3000';
    const creds = { email: 'admin@excel.edu', password: 'Admin123' };
    const res = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds)
    });

    console.log('status', res.status);
    const body = await res.text();
    console.log('body:', body);
  } catch (err) {
    console.error('Error during login test:', err);
  }
})();
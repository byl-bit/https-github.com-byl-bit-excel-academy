(async () => {
  try {
    const base = 'http://127.0.0.1:3000';
    const endpoints = ['/api/users', '/api/announcements', '/api/results'];

    for (const ep of endpoints) {
      try {
        const res = await fetch(base + ep);
        console.log(ep, 'status', res.status);
        const data = await res.text();
        console.log(ep, 'body:', data.slice(0, 100) + (data.length > 100 ? '...' : ''));
      } catch (e) {
        console.error('Error fetching', ep, e);
      }
    }
  } catch (err) {
    console.error('Fatal', err);
  }
})();
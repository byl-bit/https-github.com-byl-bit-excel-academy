(async () => {
  try {
    const base = 'http://127.0.0.1:3000';
    const targetKey = 'user-1765963831895';
    const res = await fetch(base + '/api/results', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-actor-role': 'admin', 'x-actor-id': 'admin-001' }, body: JSON.stringify({ deletePublished: [targetKey] }) });
    console.log('deletePublished status', res.status);
    const get = await fetch(base + '/api/results');
    const body = await get.json();
    console.log('remaining published keys:', Object.keys(body.published || body));
  } catch (e) {
    console.error(e);
  }
})();
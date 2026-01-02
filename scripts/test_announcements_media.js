const fetch = globalThis.fetch ? globalThis.fetch.bind(globalThis) : (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE = process.env.BASE || 'http://127.0.0.1:3000';

async function run() {
  try {
    console.log('Starting announcements media test...');

    const payload = [
      {
        title: 'Media Test Announcement',
        body: 'This announcement contains image and video links',
        date: new Date().toISOString().split('T')[0],
        type: 'event',
        media: [
          { type: 'image', url: 'https://example.com/dummy.jpg', name: 'dummy.jpg' },
          { type: 'video', url: 'https://example.com/sample.mp4', name: 'sample.mp4' }
        ]
      }
    ];

    let res = await fetch(`${BASE}/api/announcements`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-actor-role': 'admin' }, body: JSON.stringify(payload) });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('Failed to create announcements: ' + txt);
    }

    res = await fetch(`${BASE}/api/announcements`);
    if (!res.ok) throw new Error('Failed to fetch announcements after create');
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error('No announcements returned');

    const found = data.find(a => a.title === 'Media Test Announcement');
    if (!found) throw new Error('Created announcement not found in list');
    if (!Array.isArray(found.media) || found.media.length !== 2) throw new Error('Media array not preserved or length mismatch');
    if (found.media[0].type !== 'image' || found.media[1].type !== 'video') throw new Error('Media types not preserved');
    console.log('PASS: announcements media test succeeded');
    process.exit(0);
  } catch (err) {
    console.error('FAIL:', err);
    process.exit(1);
  }
}

run();
(async () => {
  try {
    const base = process.env.BASE || 'http://127.0.0.1:3000';
    console.log('Fetching users from', base + '/api/users');
    const usersRes = await fetch(base + '/api/users');
    const users = await usersRes.json();

    if (!Array.isArray(users)) {
      console.log('Unexpected users response:', users);
      return;
    }

    const bcrypt = require('bcryptjs');

    for (const u of users) {
      if (!u || !u.id) continue;
      const pw = u.password;
      if (!pw || typeof pw !== 'string') continue;

      // Skip already hashed passwords
      if (pw.startsWith('$2')) continue;

      // Skip placeholders
      if (pw === '<HASH>' || pw.length < 6) continue;

      // Hash and persist via API
      try {
        const hash = await bcrypt.hash(String(pw), 10);
        const updateRes = await fetch(base + '/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-actor-role': 'admin' },
          body: JSON.stringify({ id: u.id, password: hash })
        });
        if (updateRes.ok) {
          console.log('Hashed and updated user', u.id);
        } else {
          console.warn('Failed to update user', u.id, 'status', updateRes.status);
        }
      } catch (err) {
        console.error('Error hashing/updating user', u.id, err);
      }
    }

    console.log('Password hashing pass completed.');
  } catch (err) {
    console.error('Fatal error in hash_passwords script:', err);
  }
})();
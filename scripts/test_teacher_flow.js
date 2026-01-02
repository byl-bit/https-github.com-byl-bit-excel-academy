(async () => {
  try {
    const newTeacher = {
      id: `teacher-test-${Date.now()}`,
      name: 'Test Teacher',
      email: `testteacher${Date.now()}@excel.edu`,
      teacherId: `TE-2025-TEST`,
      password: 'pass1234',
      role: 'teacher',
      status: 'pending',
      grade: '9',
      section: 'A',
      gender: 'Male',
    };

    const post = await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTeacher)
    });
    const postData = await post.json();
    console.log('POST response:', postData);

    const res = await fetch('http://localhost:3000/api/users');
    const users = await res.json();
    const found = users.find(u => u.teacherId === newTeacher.teacherId);
    console.log('Found user:', !!found);
    if (found) console.log(found);
  } catch (e) {
    console.error('Error:', e);
  }
})();
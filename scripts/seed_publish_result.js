const fetch = globalThis.fetch ? globalThis.fetch.bind(globalThis) : (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE = process.env.BASE || 'http://127.0.0.1:3000';

async function run() {
  try {
    console.log('Seeding sample student and publishing result...');

    const student = {
      id: `user-test-${Date.now()}`,
      name: 'Test Student',
      fullName: 'Test Student',
      email: `student.test.${Date.now()}@example.com`,
      password: 'password123',
      role: 'student',
      status: 'active',
      studentId: 'ST-TEST-001',
      grade: '3',
      section: 'A',
      gender: 'M'
    };

    // Create user
    console.log('Creating test student...');
    let res = await fetch(`${BASE}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student)
    });
    if (!res.ok) {
      const txt = await res.text();
      // If user already exists, continue
      if (res.status === 400 && txt && txt.includes('User already exists')) {
        console.log('Student already exists, continuing...');
      } else {
        throw new Error(`Failed to create student: ${res.status} ${txt}`);
      }
    } else {
      console.log('Student created.');
    }

    // Prepare a published result for this student (admin publish)
    const payload = {
      'ST-TEST-001': {
        studentId: 'ST-TEST-001',
        studentName: 'Test Student',
        grade: '3',
        section: 'A',
        gender: 'M',
        subjects: [
          { name: 'Math', marks: 88, status: 'published', assessments: { '1': 44, '2': 44 } },
          { name: 'English', marks: 76, status: 'published', assessments: { '1': 38, '2': 38 } }
        ],
        total: 164,
        average: 82,
        conduct: 'Very Good',
        promotedOrDetained: 'PROMOTED',
        status: 'published'
      }
    };

    console.log('Publishing result as admin...');
    res = await fetch(`${BASE}/api/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-actor-role': 'admin', 'x-actor-id': 'admin-001' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Failed to publish result: ${res.status} ${txt}`);
    }
    console.log('Result published.');

    // Inspect published results as admin
    console.log('Fetching results as admin (inspect published table)...');
    res = await fetch(`${BASE}/api/results`, {
      headers: { 'x-actor-role': 'admin', 'x-actor-id': 'admin-001' }
    });
    let adminJson = await res.json();
    console.log('Admin /api/results response (published/pending):', JSON.stringify(adminJson, null, 2));

    // Verify as student
    console.log('Fetching results as student...');
    res = await fetch(`${BASE}/api/results`, {
      headers: { 'x-actor-role': 'student', 'x-actor-id': 'ST-TEST-001' }
    });
    const json = await res.json();
    console.log('Student results response:', JSON.stringify(json, null, 2));

    if (!json || Object.keys(json).length === 0) {
      throw new Error('No published results found for student after publish');
    }

    console.log('Seed + publish completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();

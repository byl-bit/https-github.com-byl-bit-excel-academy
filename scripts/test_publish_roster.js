const fetch = globalThis.fetch ? globalThis.fetch.bind(globalThis) : (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE = process.env.BASE || 'http://127.0.0.1:3000';

async function run() {
  try {
    console.log('Starting publish-roster integration test...');

    // 1) Create teacher
    const teacher = {
      id: `user-teacher-${Date.now()}`,
      name: 'Test Teacher',
      email: `teacher.test.${Date.now()}@example.com`,
      password: 'pass1234',
      role: 'teacher',
      status: 'active',
      grade: '4',
      section: 'A'
    };
    let res = await fetch(`${BASE}/api/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(teacher) });
    let teacherId = teacher.id;
    if (res.ok) {
      try {
        const created = await res.json();
        if (created && created.id) teacherId = created.id;
      } catch (e) { /* ignore */ }
    } else {
      const txt = await res.text();
      // If user exists, find it by email
      if (res.status === 400 && txt.includes('User already exists')) {
        const ures = await fetch(`${BASE}/api/users`);
        const all = await ures.json();
        const found = (all || []).find(u => u.email === teacher.email);
        if (!found) throw new Error('Teacher exists but could not be resolved');
        teacherId = found.id;
      } else {
        throw new Error('Failed to create teacher: ' + txt);
      }
    }

    // 2) Create two students in grade 4 section A
    const s1 = { id: `user-s1-${Date.now()}`, name: 'Student One', email: `s1.${Date.now()}@example.com`, password: 'password', role: 'student', status: 'active', studentId: 'ST-ROSTER-1', grade: '4', section: 'A' };
    const s2 = { id: `user-s2-${Date.now()}`, name: 'Student Two', email: `s2.${Date.now()}@example.com`, password: 'password', role: 'student', status: 'active', studentId: 'ST-ROSTER-2', grade: '4', section: 'A' };
    res = await fetch(`${BASE}/api/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify([s1, s2]) });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('Failed to create students: ' + txt);
    }

    // 3) Create allocation for the teacher for grade 4 section A
    const alloc = { teacherId: teacherId, teacherName: teacher.name, grade: '4', section: 'A', subject: 'Mathematics' };
    res = await fetch(`${BASE}/api/allocations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(alloc) });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('Failed to create allocation: ' + txt);
    }

    // 4) Fetch assessment types
    res = await fetch(`${BASE}/api/settings`);
    const settings = await res.json();
    const assessmentTypes = settings.assessmentTypes || [];
    if (!assessmentTypes.length) throw new Error('No assessmentTypes available');

    // 5) Teacher submits full roster with assessment breakdowns
    const rosterPayload = {
      'ST-ROSTER-1': {
        studentId: 'ST-ROSTER-1',
        studentName: 'Student One',
        grade: '4',
        section: 'A',
        submissionLevel: 'roster',
        subjects: [{ name: 'Mathematics', assessments: { } }]
      },
      'ST-ROSTER-2': {
        studentId: 'ST-ROSTER-2',
        studentName: 'Student Two',
        grade: '4',
        section: 'A',
        submissionLevel: 'roster',
        subjects: [{ name: 'Mathematics', assessments: { } }]
      }
    };

    // Fill assessments with values proportional to maxMarks (simple mapping)
    for (const k of Object.keys(rosterPayload)) {
      const entry = rosterPayload[k];
      for (const t of assessmentTypes) {
        entry.subjects[0].assessments[String(t.id)] = Math.min( Number(t.maxMarks) || 100, Math.round((Number(t.maxMarks)||100) * (t.id === 'final-exam' ? 0.6 : 0.4)) );
      }
    }

    // Give student 1 slightly higher marks than student 2
    rosterPayload['ST-ROSTER-1'].subjects[0].assessments = Object.fromEntries(Object.entries(rosterPayload['ST-ROSTER-1'].subjects[0].assessments).map(([k,v]) => [k, Number(v) + 5]));

    console.log('Teacher submitting roster...');
    res = await fetch(`${BASE}/api/results`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-actor-role': 'teacher', 'x-actor-id': teacherId }, body: JSON.stringify(rosterPayload) });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('Teacher roster submission failed: ' + txt);
    }

    // 6) Admin approves both students
    // Wait briefly to ensure pending was written
    await new Promise(r => setTimeout(r, 500));

    console.log('Admin approving results...');
    res = await fetch(`${BASE}/api/results`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-actor-role': 'admin', 'x-actor-id': 'admin-001' }, body: JSON.stringify({ approve: ['ST-ROSTER-1', 'ST-ROSTER-2'] }) });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('Admin approval failed: ' + txt);
    }

    // 7) Verify published results contain marks, computed totals and ranks
    await new Promise(r => setTimeout(r, 500));
    res = await fetch(`${BASE}/api/results`, { headers: { 'x-actor-role': 'admin', 'x-actor-id': 'admin-001' } });
    const adminView = await res.json();
    const published = adminView.published || {};

    if (!published['ST-ROSTER-1'] || !published['ST-ROSTER-2']) throw new Error('Published records not found for roster students');

    const p1 = published['ST-ROSTER-1'];
    const p2 = published['ST-ROSTER-2'];

    console.log('Published roster entries:', p1, p2);

    if (!p1.subjects || !p1.subjects.length) throw new Error('Student 1 subjects missing');
    if (!p2.subjects || !p2.subjects.length) throw new Error('Student 2 subjects missing');

    const s1marks = Number(p1.subjects[0].marks || 0);
    const s2marks = Number(p2.subjects[0].marks || 0);
    if (!(s1marks > s2marks)) throw new Error('Marks were not computed correctly or ranking will fail');

    // Verify ranks (higher marks should have rank 1)
    if (Number(p1.rank || 0) !== 1 && Number(p2.rank || 0) !== 1) {
      throw new Error('No rank assigned');
    }

    console.log('PASS: publish-roster integration test succeeded');
    process.exit(0);
  } catch (err) {
    console.error('FAIL:', err);
    process.exit(1);
  }
}

run();
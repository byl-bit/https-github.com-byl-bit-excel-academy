(async () => {
  try {
    const base = 'http://127.0.0.1:3000';
    // Create teacher
    const teacher = { id: `teacher-test-${Date.now()}`, name: 'Ms Test', teacherId: `TE-${new Date().getFullYear()}-T${Math.floor(Math.random()*1000)}`, email: `test${Date.now()}@excel.edu`, password: 'tpass', role: 'teacher', status: 'pending', grade: '9', section: 'A' };
    let r = await fetch(base + '/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(teacher) });
    console.log('POST teacher', r.status);

    // Create students
    const students = [
      { id: `stu-${Date.now()}-a`, name: 'Student One', studentId: `ST-${new Date().getFullYear()}-A01`, password: 's1', role: 'student', status: 'active', grade: '9', section: 'A' },
      { id: `stu-${Date.now()}-b`, name: 'Student Two', studentId: `ST-${new Date().getFullYear()}-B01`, password: 's2', role: 'student', status: 'active', grade: '9', section: 'B' }
    ];
    for (const s of students) {
      r = await fetch(base + '/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) });
      console.log('POST student', s.studentId, r.status);
    }

    // Approve teacher
    r = await fetch(base + '/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: teacher.id, status: 'active' }) });
    console.log('approve teacher', r.status);

    // Teacher submits result for student in same class (should succeed)
    const resObj = {};
    resObj[students[0].id] = { studentId: students[0].studentId, studentName: students[0].name, grade: students[0].grade, section: students[0].section, subjects: [{ name: 'Math', marks: 80 }], total: 80, average: 80 };
    r = await fetch(base + '/api/results', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-actor-role': 'teacher', 'x-actor-id': teacher.id }, body: JSON.stringify(resObj) });
    console.log('submit same class', r.status, await r.text());

    // Teacher attempts to submit result for student in other section (should fail)
    const resObj2 = {};
    resObj2[students[1].id] = { studentId: students[1].studentId, studentName: students[1].name, grade: students[1].grade, section: students[1].section, subjects: [{ name: 'Math', marks: 70 }], total: 70, average: 70 };
    r = await fetch(base + '/api/results', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-actor-role': 'teacher', 'x-actor-id': teacher.id }, body: JSON.stringify(resObj2) });
    console.log('submit other class', r.status, await r.text());

    // Teacher fetches class results (GET) - should only see student in same class
    r = await fetch(base + '/api/results', { headers: { 'x-actor-role': 'teacher', 'x-actor-id': teacher.id } });
    const classResults = await r.json();
    console.log('GET class results', r.status, classResults);
    // If pending results exist, display the submitted student's average (check decimal rounding)
    if (classResults && classResults.pending) {
      const pending = classResults.pending[students[0].studentId] || classResults.pending[students[0].id];
      console.log('Submitted student pending entry average:', pending?.average);
      const expectedAvg = 80.0;
      if (pending) {
        if (Math.abs((pending.average || 0) - expectedAvg) > 0.05) {
          console.error('Average mismatch: expected', expectedAvg, 'got', pending.average);
        } else {
          console.log('Average matches expected value (rounded to 1 decimal)');
        }
      }
    }

    // Student fetch their result (GET with student actor headers)
    r = await fetch(base + '/api/results', { headers: { 'x-actor-role': 'student', 'x-actor-id': students[0].id } });
    console.log('Student GET', r.status, await r.json());

  } catch (err) {
    console.error('E2E Error:', err);
  }
})();
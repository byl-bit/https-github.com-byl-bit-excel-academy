const fetch = globalThis.fetch ? globalThis.fetch.bind(globalThis) : (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE = process.env.BASE || 'http://127.0.0.1:3000';

async function run() {
  try {
    console.log('Checking /api/settings and /api/results for test student...');

    let res = await fetch(`${BASE}/api/settings`);
    const settings = await res.json();
    console.log('Settings:', JSON.stringify(settings, null, 2));

    const assessmentTypes = (settings.assessmentTypes || []);
    if (!assessmentTypes || assessmentTypes.length === 0) {
      console.warn('No assessmentTypes found in settings. The defaults may not be injected.');
    } else {
      console.log(`Found ${assessmentTypes.length} assessment types.`);
    }

    // Determine a target student to test. Prefer env TARGET_STUDENT, otherwise try ST-TEST-001, otherwise pick the first published student from admin view
    let targetStudent = process.env.TARGET_STUDENT || 'ST-TEST-001';

    // Attempt one final fetch; if not found, query admin and pick first published key
    res = await fetch(`${BASE}/api/results`, { headers: { 'x-actor-role': 'student', 'x-actor-id': targetStudent } });
    let results = await res.json();

    if (!results || Object.keys(results).length === 0) {
      console.warn(`No results for ${targetStudent}, falling back to pick an existing published student from admin view`);

      // Fetch admin view to get a candidate
      res = await fetch(`${BASE}/api/results`, { headers: { 'x-actor-role': 'admin', 'x-actor-id': 'admin-001' } });
      const adminRes = await res.json();
      const pub = adminRes.published || {};
      const keys = Object.keys(pub);
      if (keys.length === 0) {
        console.error('FAIL: No published students found in admin view');
        process.exit(2);
      }
      targetStudent = keys[0];
      console.log(`Using published student ${targetStudent} from admin view`);

      res = await fetch(`${BASE}/api/results`, { headers: { 'x-actor-role': 'student', 'x-actor-id': targetStudent } });
      results = await res.json();
    }

    console.log(`Results for ${targetStudent}:`, JSON.stringify(results, null, 2));

    if (!results || Object.keys(results).length === 0) {
      console.error(`FAIL: No published results found for ${targetStudent}`);
      process.exit(2);
    }

    // Ensure subjects contain assessments object (if assessmentTypes exist)
    const firstKey = Object.keys(results)[0];
    const firstResult = results[firstKey];
    const subjects = firstResult.subjects || [];
    if (assessmentTypes.length > 0) {
      const hasAssessments = subjects.some(s => s.assessments && Object.keys(s.assessments).length > 0);
      if (!hasAssessments) {
        console.error('FAIL: Subjects do not contain assessments even though assessmentTypes exist.');
        process.exit(3);
      }
    }

    console.log('PASS: Student results and settings look correct.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();

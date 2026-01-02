const fetch = globalThis.fetch ? globalThis.fetch.bind(globalThis) : (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://127.0.0.1:3000';

async function run() {
  try {
    console.log('Fetching published students...');
    const res = await fetch(`${BASE}/api/results`, { headers: { 'x-actor-role': 'admin', 'x-actor-id': 'admin-001' } });
    const adminView = await res.json();
    const published = adminView.published || {};
    const keys = Object.keys(published);
    if (keys.length === 0) {
      console.error('No published students found');
      process.exit(2);
    }

    const studentKey = keys[0];
    const stu = published[studentKey];
    console.log('Generating PDF for', studentKey);

    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Excel Academy', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Student Progress Report', 105, 26, { align: 'center' });

    doc.setFontSize(9);
    doc.text(`Name: ${stu.student_name || stu.studentName || ''}`, 15, 40);
    doc.text(`Student ID: ${stu.student_id}`, 15, 46);
    doc.text(`Grade/Section: ${stu.grade} - ${stu.section}`, 120, 40);

    let y = 60;
    doc.setFont('helvetica', 'bold');
    doc.text('SUBJECT', 20, y);
    doc.text('MARKS (out of 100)', 120, y, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    y += 8;
    (stu.subjects || []).forEach((s) => {
      doc.text(String(s.name || s.subject || ''), 20, y);
      doc.text(String(Number(s.marks || 0)), 120, y, { align: 'center' });
      y += 8;
    });

    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL SCORE: ${stu.total || 0}`, 15, y);
    doc.text(`AVERAGE: ${Number(stu.average || 0).toFixed(1)} / 100`, 80, y);
    doc.text(`RANK: ${stu.rank || ''}`, 140, y);

    y += 20;
    doc.text('Principal:', 15, y);
    doc.text('______________________________', 48, y);
    doc.text('Homeroom:', 120, y);
    doc.text('______________________________', 160, y);

    const outDir = path.join(process.cwd(), 'artifacts');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
    const outPath = path.join(outDir, `report_${studentKey}.pdf`);
    const ab = doc.output('arraybuffer');
    const buf = Buffer.from(ab);
    fs.writeFileSync(outPath, buf);
    console.log('Saved PDF to', outPath);
    process.exit(0);
  } catch (err) {
    console.error('PDF generation failed:', err);
    process.exit(1);
  }
}

run();
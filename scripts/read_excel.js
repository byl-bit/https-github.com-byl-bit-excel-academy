const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'student_results.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(JSON.stringify(data.slice(0, 5), null, 2));
} catch (error) {
    console.error('Error reading file:', error.message);
}

// Utility functions for exporting data

export const exportToExcel = async (data: Array<Record<string, unknown>>, filename: string, sheetName: string = 'Sheet1') => {
    const xlsx = await import('xlsx');
    const utils = xlsx.utils as {
        json_to_sheet: (d: Array<Record<string, unknown>>) => unknown;
        book_new: () => unknown;
        book_append_sheet: (wb: unknown, ws: unknown, name: string) => void;
    };
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, sheetName);
    // writeFile is typed on the runtime module; cast to a narrow runtime shape to call
    (xlsx as unknown as { writeFile: (wb: unknown, filename: string) => void }).writeFile(wb, filename);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        } catch {
            document.body.removeChild(textArea);
            return false;
        }
    }
};

export const printElement = (elementId: string, title: string = 'Document') => {
    const element = document.getElementById(elementId);
    if (!element) {
        alert('Element not found for printing.');
        return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Please allow popups to print.');
        return;
    }

    // Clone the element to avoid modifying the original
    const clone = element.cloneNode(true) as HTMLElement;

    // Remove no-print elements
    const noPrintElements = clone.querySelectorAll('.no-print');
    noPrintElements.forEach(el => el.remove());

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>${title}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 1cm;
                    }
                    body { 
                        font-family: 'Segoe UI', Arial, sans-serif; 
                        padding: 20px; 
                        color: #007acc; /* Light blue */
                        background: #fff;
                    }
                    h1, h2, h3 { 
                        color: #007acc; /* Light blue */
                        margin-top: 0;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 15px 0; 
                        font-size: 12px;
                    }
                    th, td { 
                        border: 1px solid #007acc; /* Light blue */
                        padding: 8px; 
                        text-align: left; 
                    }
                    th { 
                        background-color: #e6f2ff; /* Light blue */
                        font-weight: bold;
                    }
                    tr:nth-child(even) {
                        background-color: #f0f8ff; /* Light blue */
                    }
                    .print-header {
                        text-align: center;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #007acc; /* Light blue */
                        padding-bottom: 10px;
                    }
                    .print-footer {
                        margin-top: 30px;
                        padding-top: 10px;
                        border-top: 1px solid #007acc; /* Light blue */
                        text-align: center;
                        font-size: 10px;
                        color: #007acc; /* Light blue */
                    }
                    @media print {
                        body { padding: 0; margin: 0; }
                        .no-print { display: none !important; }
                        button { display: none !important; }
                        a { text-decoration: none; color: #007acc; /* Light blue */ }
                    }
                </style>
            </head>
            <body>
                <div class="print-header">
                    <h1>Excel Academy</h1>
                    <p>${title}</p>
                    <p style="font-size: 12px;">Generated on: ${new Date().toLocaleString()}</p>
                </div>
                ${clone.innerHTML}
                <div class="print-footer">
                    <p>Excel Academy Secondary School - This is a system generated document</p>
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();

    // Wait for content to load before printing
    setTimeout(() => {
        printWindow.print();
    }, 250);
};

const calculateGrade = (marks: number) => {
    if (marks >= 90) return 'A+';
    if (marks >= 80) return 'A';
    if (marks >= 70) return 'B+';
    if (marks >= 60) return 'B';
    if (marks >= 50) return 'C+';
    if (marks >= 40) return 'C';
    return 'F';
};

import type { PendingResult, PublishedResult, Subject } from '@/lib/types';

export const printResults = (result: PendingResult | PublishedResult, studentName: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Please allow popups to print.');
        return;
    }

    const subjectsHtml = result.subjects?.map((sub: Subject) => `
        <tr>
            <td>${sub.name}</td>
            <td style="text-align: center;">${sub.marks}</td>
            <td style="text-align: center;">${(sub as any).grade || calculateGrade(Number(sub.marks || 0))}</td>
        </tr>
    `).join('') || '';

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>Result - ${studentName}</title>
                <style>
                    @page { size: A4; margin: 1cm; }
                    body { font-family: Arial, sans-serif; padding: 20px; color: #007acc; /* Light blue */ }
                    .header { text-align: center; margin-bottom: 30px; color: #007acc; /* Light blue */ }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #007acc; /* Light blue */ padding: 10px; }
                    th { background-color: #e6f2ff; /* Light blue */ }
                    .summary { margin-top: 20px; color: #007acc; /* Light blue */ }
                    .summary div { margin: 10px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Excel Academy Secondary School</h1>
                    <h2>Academic Result</h2>
                </div>
                <div>
                    <p><strong>Student Name:</strong> ${studentName}</p>
                    <p><strong>Student ID:</strong> ${result.studentId}</p>
                    <p><strong>Grade:</strong> ${result.grade} | <strong>Section:</strong> ${result.section}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Subject</th>
                            <th>Marks</th>
                            <th>Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${subjectsHtml}
                    </tbody>
                </table>
                <div class="summary">
                    <div><strong>Total:</strong> ${result.total}</div>
                    <div><strong>Average:</strong> ${result.average}%</div>
                    <div><strong>Rank:</strong> #${result.rank}</div>
                    <div><strong>Result:</strong> ${result.result}</div>
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
};

export const generateAppreciationLetter = async (result: PublishedResult, principalName: string = 'Principal') => {
    const jsPDF = (await import('jspdf')).default;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Border
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(1);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    doc.setLineWidth(0.2);
    doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

    // Header
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("EXCEL ACADEMY", pageWidth / 2, 40, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont("helvetica", "italic");
    doc.text("A Legacy of Excellence and Innovation", pageWidth / 2, 48, { align: 'center' });

    doc.setDrawColor(30, 64, 175);
    doc.line(40, 55, pageWidth - 40, 55);

    // Title
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("LETTER OF APPRECIATION", pageWidth / 2, 75, { align: 'center' });

    // Date
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 30, 90, { align: 'right' });

    // Content
    doc.setFontSize(14);
    const content = [
        `Dear ${result.studentName},`,
        "",
        "On behalf of the administration and faculty of Excel Academy, I am delighted to extend our warmest congratulations to you for your outstanding academic performance during this term.",
        "",
        `Your remarkable average of ${(result.average ?? 0).toFixed(1)}% is a testament to your hard work, dedication, and intellectual curiosity. It is students like you who set the standard for excellence in our school community.`,
        "",
        "We are proud of your achievements and look forward to your continued success. Continue to strive for greatness and remain as dedicated as you are today.",
        "",
        "Sincerely,",
    ];

    let y = 110;
    content.forEach(line => {
        if (line === "") {
            y += 8;
        } else {
            const splitLines = doc.splitTextToSize(line, pageWidth - 60);
            doc.text(splitLines, 30, y);
            y += (splitLines.length * 8);
        }
    });

    // Signature
    y += 20;
    doc.setFont("helvetica", "bold");
    doc.text(principalName, 30, y);
    doc.setFont("helvetica", "normal");
    doc.text("Principal", 30, y + 7);
    doc.text("Excel Academy Secondary School", 30, y + 14);

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Ad Astra Per Aspera", pageWidth / 2, pageHeight - 15, { align: 'center' });

    doc.save(`Appreciation_Letter_${result.studentId}.pdf`);
};

/**
 * Export data to CSV format
 * @param data Array of objects or array of arrays
 * @param filename Name of the file (without extension)
 * @param headers Optional headers array. If not provided and data is array of objects, keys will be used
 */
/**
 * Export data to CSV format with Excel-friendly encoding (BOM)
 * @param data Array of objects or array of arrays
 * @param filename Name of the file (without extension)
 * @param headers Optional headers array. If not provided and data is array of objects, keys will be used
 */
export const exportToCSV = (data: Array<Record<string, unknown>> | unknown[][], filename: string, headers?: string[]) => {
    try {
        let csvContent = '';

        // Handle array of arrays
        if (Array.isArray(data[0]) && !Array.isArray(data[0]) && typeof (data[0] as unknown[])[0] !== 'object') {
            // This case is unlikely given the current use, but kept for robustness
            if (headers) {
                csvContent = headers.join(',') + '\r\n';
            }
            csvContent += (data as unknown[][]).map((row: unknown[]) =>
                row.map((cell: unknown) => escapeCSV(cell)).join(',')
            ).join('\r\n');
        } else if (Array.isArray(data[0])) {
            // Array of arrays properly
            if (headers) {
                csvContent = headers.map(h => escapeCSV(h)).join(',') + '\r\n';
            }
            csvContent += (data as unknown[][]).map((row: unknown[]) =>
                row.map((cell: unknown) => escapeCSV(cell)).join(',')
            ).join('\r\n');
        } else {
            // Handle array of objects
            const keys = headers || Object.keys(data[0] || {});
            csvContent = keys.map(k => escapeCSV(k)).join(',') + '\r\n';

            csvContent += (data as Array<Record<string, unknown>>).map(row =>
                keys.map(key => escapeCSV(row[key])).join(',')
            ).join('\r\n');
        }

        // Add UTF-8 BOM for Excel
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.setAttribute('target', '_self');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting to CSV:', error);
        throw new Error('Failed to export CSV file');
    }
};

/**
 * Robust CSV parser that handles quoted values and escaped quotes
 */
export const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    // Normalize line endings
    const content = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];

        if (inQuotes) {
            if (char === '"' && nextChar === '"') {
                currentCell += '"';
                i++; // Skip next quote
            } else if (char === '"') {
                inQuotes = false;
            } else {
                currentCell += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                currentRow.push(currentCell.trim());
                currentCell = '';
            } else if (char === '\n') {
                currentRow.push(currentCell.trim());
                rows.push(currentRow);
                currentRow = [];
                currentCell = '';
            } else {
                currentCell += char;
            }
        }
    }

    // Add last cell/row if needed
    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
    }

    return rows.filter(row => row.some(cell => cell.length > 0));
};

const escapeCSV = (val: unknown): string => {
    const cellValue = String(val ?? '');
    if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n') || cellValue.includes('\r')) {
        return `"${cellValue.replace(/"/g, '""')}"`;
    }
    return cellValue;
};

export const parseExcel = async (file: File): Promise<string[][]> => {
    const xlsx = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const wb = xlsx.read(buffer, { type: 'array' });
    const wsName = wb.SheetNames[0];
    const ws = wb.Sheets[wsName];
    const data = xlsx.utils.sheet_to_json(ws, { header: 1 }) as string[][];
    return data.map(row => row.map(cell => String(cell ?? '')));
};


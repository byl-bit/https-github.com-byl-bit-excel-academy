// Utility functions for exporting data
import { normalizeGender } from "@/lib/utils";
import type { PendingResult, PublishedResult, Subject } from "@/lib/types";


export const exportToExcel = async (
  data: Array<Record<string, unknown>>,
  filename: string,
  sheetName: string = "Sheet1",
) => {
  const xlsx = await import("xlsx");
  const utils = xlsx.utils as {
    json_to_sheet: (d: Array<Record<string, unknown>>) => unknown;
    book_new: () => unknown;
    book_append_sheet: (wb: unknown, ws: unknown, name: string) => void;
  };
  const ws = utils.json_to_sheet(data);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, sheetName);
  // writeFile is typed on the runtime module; cast to a narrow runtime shape to call
  (
    xlsx as unknown as { writeFile: (wb: unknown, filename: string) => void }
  ).writeFile(wb, filename);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    } catch {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

export const printElement = (elementId: string, title: string = "Document") => {
  const element = document.getElementById(elementId);
  if (!element) {
    alert("Element not found for printing.");
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to print.");
    return;
  }

  // Clone the element to avoid modifying the original
  const clone = element.cloneNode(true) as HTMLElement;

  // Remove no-print elements
  const noPrintElements = clone.querySelectorAll(".no-print");
  noPrintElements.forEach((el) => el.remove());

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

import { calculateGrade as getGrade, calculateGrade } from "./gradingLogic";

export const generateReportCardPDF = async (
  result: any,
  user: any,
  settings: any,
  existingDoc?: any,
) => {
  const jsPDF = (await import("jspdf")).default;
  const doc = existingDoc || new jsPDF();
  if (existingDoc) doc.addPage();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const addImage = (
    url: string,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        try {
          doc.addImage(img, "JPEG", x, y, w, h);
          resolve(true);
        } catch (e) {
          resolve(false);
        }
      };
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  // Header - Professional & Minimal
  if (settings?.letterheadUrl) {
    await addImage(settings.letterheadUrl, 15, 10, 180, 25);
  } else {
    doc.setFillColor(15, 23, 42); // Navy/Slate
    doc.rect(15, 10, pageWidth - 30, 40, "F");
    
    // Decorative lines
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(20, 15, pageWidth - 20, 15);
    doc.line(20, 45, pageWidth - 20, 45);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("ACADEMIC PERFORMANCE REPORT", pageWidth / 2, 30, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("OFFICIAL TRANSCRIPT OF RESULTS", pageWidth / 2, 38, { align: "center" });
  }

  // Large Border for the whole page
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(1);
  doc.rect(10, 5, pageWidth - 20, pageHeight - 10);

  // Student Info Panel
  let infoY = 60;
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(226, 232, 240);
  doc.line(15, infoY, pageWidth - 15, infoY);
  infoY += 10;

  const photoUrl = user.photo || user.image || user.picture;
  if (photoUrl) {
    await addImage(photoUrl, 160, infoY, 30, 35);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.rect(160, infoY, 30, 35);
  } else {
    doc.setDrawColor(226, 232, 240);
    doc.rect(160, infoY, 30, 35);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("STUDENT PHOTO", 175, infoY + 18, { align: "center" });
  }

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("PERSONAL INFORMATION", 15, infoY - 2);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  
  const studentName = result.studentName || user.name || user.fullName || "Student Name";
  const studentId = result.studentId || user.studentId || user.id || "ID-N/A";
  
  // Student Info Grid
  doc.setFont("helvetica", "bold"); doc.text(`FULL NAME:`, 15, infoY + 6);
  doc.setFont("helvetica", "normal"); doc.text(`${studentName.toUpperCase()}`, 45, infoY + 6);
  
  doc.setFont("helvetica", "bold"); doc.text(`STUDENT ID:`, 15, infoY + 14);
  doc.setFont("helvetica", "normal"); doc.text(`${studentId}`, 45, infoY + 14);
  
  doc.setFont("helvetica", "bold"); doc.text(`GRADE/SEC:`, 15, infoY + 22);
  doc.setFont("helvetica", "normal"); doc.text(`${result.grade || user.grade || ""} - ${result.section || user.section || ""}`, 45, infoY + 22);
  
  doc.setFont("helvetica", "bold"); doc.text(`ROLL NO:`, 15, infoY + 30);
  doc.setFont("helvetica", "normal"); doc.text(`${result.rollNumber || user.rollNumber || "N/A"}`, 45, infoY + 30);
  
  doc.setFont("helvetica", "bold"); doc.text(`GENDER:`, 15, infoY + 38);
  doc.setFont("helvetica", "normal"); doc.text(`${normalizeGender(result.gender || user.gender || "N/A") || "N/A"}`, 45, infoY + 38);

  // Table Structure
  let tableY = infoY + 55;
  doc.setFillColor(15, 23, 42);
  doc.rect(15, tableY - 7, pageWidth - 30, 10, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("ACADEMIC SUBJECTS", 20, tableY);
  doc.text("SEM 1 (100)", pageWidth / 2 - 15, tableY, { align: "center" });
  doc.text("SEM 2 (100)", pageWidth / 2 + 25, tableY, { align: "center" });
  doc.text("ANNUAL %", pageWidth - 50, tableY, { align: "center" });
  doc.text("GR", pageWidth - 25, tableY, { align: "center" });
  
  tableY += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  let s1Sum = 0, s2Sum = 0, subCount = 0;
  const subjects = result.subjects || [];
  
  subjects.forEach((sub: any, idx: number) => {
    // Zebra striping
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, tableY - 7, pageWidth - 30, 10, "F");
    }
    
    // Line separator
    doc.setDrawColor(241, 245, 249);
    doc.line(15, tableY + 3, pageWidth - 15, tableY + 3);

    const s1 = Number(sub.sem1 ?? (sub.marks && !sub.sem2 ? sub.marks : 0));
    const s2 = Number(sub.sem2 ?? 0);
    const annual = Number(sub.marks ?? ((s1 + s2) / 2));
    
    s1Sum += s1;
    s2Sum += s2;
    subCount++;
    
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(sub.name?.toUpperCase() || "", 20, tableY);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(s1.toFixed(1), pageWidth / 2 - 15, tableY, { align: "center" });
    doc.text(s2.toFixed(1), pageWidth / 2 + 25, tableY, { align: "center" });
    
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "black");
    doc.text(annual.toFixed(1), pageWidth - 50, tableY, { align: "center" });
    
    const grade = getGrade(annual);
    if (grade === "F") doc.setTextColor(239, 68, 68);
    else doc.setTextColor(8, 145, 178);
    
    doc.text(grade, pageWidth - 25, tableY, { align: "center" });
    
    tableY += 10;
    
    // Check for page overflow
    if (tableY > pageHeight - 80) {
        doc.addPage();
        // Redraw border for new page
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(1);
        doc.rect(10, 5, pageWidth - 20, pageHeight - 10);
        tableY = 20;
    }
  });

  // Summary Section
  tableY += 10;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(15, tableY, pageWidth - 15, tableY);
  tableY += 12;
  
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("PERFORMANCE SUMMARY", 15, tableY);
  
  tableY += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  
  const s1Avg = subCount > 0 ? s1Sum / subCount : 0;
  const s2Avg = subCount > 0 ? s2Sum / subCount : 0;
  const annualAvg = Number(result.average || 0);
  
  // Summary Grid-like display
  doc.rect(15, tableY - 5, pageWidth / 2 - 20, 25);
  doc.rect(pageWidth / 2 + 5, tableY - 5, pageWidth / 2 - 20, 25);

  doc.text(`SEMESTER 1 AVG:`, 20, tableY + 5);
  doc.setFont("helvetica", "bold"); doc.text(`${s1Avg.toFixed(2)}%`, 65, tableY + 5);
  doc.setFont("helvetica", "normal"); doc.text(`SEMESTER 2 AVG:`, 20, tableY + 15);
  doc.setFont("helvetica", "bold"); doc.text(`${s2Avg.toFixed(2)}%`, 65, tableY + 15);

  doc.setFont("helvetica", "normal"); doc.text(`ANNUAL AVG:`, pageWidth / 2 + 10, tableY + 5);
  doc.setFont("helvetica", "bold"); doc.setTextColor(8, 145, 178); doc.text(`${annualAvg.toFixed(2)}%`, pageWidth - 45, tableY + 5);

  const outcome = result.promotedOrDetained || result.promoted_or_detained || "PENDING";
  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "normal"); doc.text(`FINAL STATUS:`, pageWidth / 2 + 10, tableY + 15);
  if (outcome === "PROMOTED") doc.setTextColor(22, 163, 74);
  else if (outcome === "DETAINED") doc.setTextColor(239, 68, 68);
  doc.setFont("helvetica", "bold"); doc.text(`${outcome}`, pageWidth - 45, tableY + 15);

  // Signatures
  const sigY = pageHeight - 45;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  
  doc.line(25, sigY, 85, sigY);
  doc.text("SCHOOL DIRECTOR", 55, sigY + 6, { align: "center" });
  if (settings?.principalName) {
    doc.setFont("helvetica", "normal");
    doc.text(settings.principalName, 55, sigY + 12, { align: "center" });
  }

  doc.line(125, sigY, 185, sigY);
  doc.text("HOMEROOM TEACHER", 155, sigY + 6, { align: "center" });
  const hName = settings?.homeroomName || "Class Advisor";
  doc.setFont("helvetica", "normal");
  doc.text(hName, 155, sigY + 12, { align: "center" });

  // Verification Note
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "italic");
  doc.text("This academic transcript is an official computer-generated document.", pageWidth / 2, pageHeight - 15, { align: "center" });
  doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth / 2, pageHeight - 11, { align: "center" });

  if (!existingDoc) {
    doc.save(`Report_Card_${studentId}_${new Date().getFullYear()}.pdf`);
  }
  return doc;
};

export const generateClassResultsCSV = (
  results: Array<any>,
  filename: string,
  subjectsList: string[],
) => {
  const headers = ["Student ID", "Full Name", "Gender", "Roll Number"];
  
  subjectsList.forEach(sub => {
    headers.push(`${sub} S1`, `${sub} S2`, `${sub} Annual`);
  });
  
  headers.push("Grand Total", "Average %", "Rank", "Status", "Decision");
  
  const rows = results.map(r => {
    const row = [
      r.studentId || r.student_id || "",
      r.studentName || r.student_name || "",
      r.gender || r.sex || "",
      r.rollNumber || r.roll_number || ""
    ];
    
    subjectsList.forEach(subName => {
      const s = (r.subjects || []).find((ss: any) => ss.name === subName);
      if (s) {
        row.push(
          String(s.sem1 ?? "-"),
          String(s.sem2 ?? "-"),
          String(s.marks ?? "-")
        );
      } else {
        row.push("-", "-", "-");
      }
    });
    
    row.push(
      String(r.total || 0),
      String(Number(r.average || 0).toFixed(2)),
      String(r.rank || "-"),
      r.result || "",
      r.promotedOrDetained || r.promoted_or_detained || ""
    );
    
    return row;
  });
  
  exportToCSV(rows, filename, headers);
};



export const printResults = (
  result: PendingResult | PublishedResult,
  studentName: string,
) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to print.");
    return;
  }

  const subjectsHtml =
    result.subjects
      ?.map(
        (sub: Subject) => `
        <tr>
            <td style="font-weight: bold; color: #1e293b;">${sub.name}</td>
            <td style="text-align: center; color: #0891b2; font-weight: bold;">${sub.sem1 !== undefined ? sub.sem1 : "-"}</td>
            <td style="text-align: center; color: #0891b2; font-weight: bold;">${sub.sem2 !== undefined ? sub.sem2 : "-"}</td>
            <td style="text-align: center; font-weight: 900; color: #0e7490;">${sub.marks}</td>
            <td style="text-align: center; font-weight: bold; color: ${["F"].includes((sub as any).grade || calculateGrade(Number(sub.marks || 0))) ? "#ef4444" : "#0891b2"};">
                ${(sub as any).grade || calculateGrade(Number(sub.marks || 0))}
            </td>
        </tr>
    `,
      )
      .join("") || "";

  printWindow.document.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>Academic Report - ${studentName}</title>
                <style>
                    @page { size: A4; margin: 1.5cm; }
                    body { font-family: 'Inter', system-ui, sans-serif; padding: 0; color: #1e293b; line-height: 1.5; }
                    .header { text-align: center; margin-bottom: 40px; border-bottom: 4px double #0891b2; padding-bottom: 20px; }
                    .header h1 { margin: 0; font-size: 28px; font-weight: 900; color: #0891b2; letter-spacing: -0.02em; text-transform: uppercase; }
                    .header h2 { margin: 5px 0 0; font-size: 16px; font-weight: 700; color: #64748b; letter-spacing: 0.1em; text-transform: uppercase; }
                    
                    .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
                    .student-info p { margin: 5px 0; font-size: 13px; }
                    .student-info strong { color: #0e7490; font-weight: 800; text-transform: uppercase; font-size: 11px; margin-right: 5px; }

                    table { width: 100%; border-collapse: collapse; margin: 25px 0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
                    th, td { border: 1px solid #e2e8f0; padding: 12px 15px; font-size: 13px; }
                    th { background-color: #0891b2; color: white; text-transform: uppercase; font-size: 11px; font-weight: 900; letter-spacing: 0.05em; }
                    
                    .summary { margin-top: 40px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; background: #0f172a; color: white; padding: 25px; border-radius: 16px; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
                    .summary-item { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 8px; }
                    .summary-item:last-child { border: none; padding: 0; }
                    .summary-item span:first-child { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.1em; }
                    .summary-item span:last-child { font-size: 18px; font-weight: 900; color: #22d3ee; }
                    
                    .footer { margin-top: 60px; text-align: center; font-size: 10px; color: #94a3b8; font-style: italic; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Excel Academy</h1>
                    <h2>Official Academic Transcript</h2>
                </div>
                <div class="student-info">
                    <div>
                        <p><strong>Student:</strong> ${studentName}</p>
                        <p><strong>Ref ID:</strong> ${result.studentId}</p>
                    </div>
                    <div style="text-align: right;">
                        <p><strong>Grade:</strong> ${result.grade} <strong>Section:</strong> ${result.section}</p>
                        <p><strong>Session:</strong> ${new Date().getFullYear()}</p>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="text-align: left;">Subject Name</th>
                            <th>Sem 1 (100)</th>
                            <th>Sem 2 (100)</th>
                            <th>Annual (100)</th>
                            <th>Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${subjectsHtml}
                    </tbody>
                </table>
                <div class="summary">
                    <div class="summary-item">
                        <span>Aggregate Score</span>
                        <span>${result.total} / ${((result.subjects?.length || 0) * 100)}</span>
                    </div>
                    <div class="summary-item">
                        <span>Final Average</span>
                        <span>${result.average}%</span>
                    </div>
                    <div class="summary-item">
                        <span>Class Standing</span>
                        <span>#${result.rank || "N/A"}</span>
                    </div>
                    <div class="summary-item">
                        <span>Decision</span>
                        <span style="color: ${result.result === 'PASS' ? '#22d3ee' : '#f87171'}">${result.result || "PENDING"}</span>
                    </div>
                </div>
                <div class="footer">
                    <p>This document is electronically verified and issued by the Excel Academy Office of the Registrar.</p>
                    <p>Determined to Excel!</p>
                </div>
            </body>
        </html>
    `);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 250);
};

export const generateAppreciationLetter = async (
  result: PublishedResult,
  principalName: string = "Desalegn",
) => {

  const jsPDF = (await import("jspdf")).default;
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
  doc.text("EXCEL ACADEMY", pageWidth / 2, 40, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "italic");
  doc.text("A Legacy of Excellence and Innovation", pageWidth / 2, 48, {
    align: "center",
  });

  doc.setDrawColor(30, 64, 175);
  doc.line(40, 55, pageWidth - 40, 55);

  // Title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("LETTER OF APPRECIATION", pageWidth / 2, 75, { align: "center" });

  // Date
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 30, 90, {
    align: "right",
  });

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
  content.forEach((line) => {
    if (line === "") {
      y += 8;
    } else {
      const splitLines = doc.splitTextToSize(line, pageWidth - 60);
      doc.text(splitLines, 30, y);
      y += splitLines.length * 8;
    }
  });

  // Signature
  y += 20;
  doc.setFont("helvetica", "bold");
  doc.text(principalName, 30, y);
  doc.setFont("helvetica", "normal");
  doc.text("School Director", 30, y + 7);

  doc.text("Excel Academy Secondary School", 30, y + 14);

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Ad Astra Per Aspera", pageWidth / 2, pageHeight - 15, {
    align: "center",
  });

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
export const exportToCSV = (
  data: Array<Record<string, unknown>> | unknown[][],
  filename: string,
  headers?: string[],
) => {
  try {
    let csvContent = "";

    // Handle array of arrays
    if (
      Array.isArray(data[0]) &&
      !Array.isArray(data[0]) &&
      typeof (data[0] as unknown[])[0] !== "object"
    ) {
      // This case is unlikely given the current use, but kept for robustness
      if (headers) {
        csvContent = headers.join(",") + "\r\n";
      }
      csvContent += (data as unknown[][])
        .map((row: unknown[]) =>
          row.map((cell: unknown) => escapeCSV(cell)).join(","),
        )
        .join("\r\n");
    } else if (Array.isArray(data[0])) {
      // Array of arrays properly
      if (headers) {
        csvContent = headers.map((h) => escapeCSV(h)).join(",") + "\r\n";
      }
      csvContent += (data as unknown[][])
        .map((row: unknown[]) =>
          row.map((cell: unknown) => escapeCSV(cell)).join(","),
        )
        .join("\r\n");
    } else {
      // Handle array of objects
      const keys = headers || Object.keys(data[0] || {});
      csvContent = keys.map((k) => escapeCSV(k)).join(",") + "\r\n";

      csvContent += (data as Array<Record<string, unknown>>)
        .map((row) => keys.map((key) => escapeCSV(row[key])).join(","))
        .join("\r\n");
    }

    // Add UTF-8 BOM for Excel
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.setAttribute("target", "_self");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting to CSV:", error);
    throw new Error("Failed to export CSV file");
  }
};

/**
 * Robust CSV parser that handles quoted values and escaped quotes
 */
export const parseCSV = (text: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  // Normalize line endings
  const content = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

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
      } else if (char === ",") {
        currentRow.push(currentCell.trim());
        currentCell = "";
      } else if (char === "\n") {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = "";
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

  return rows.filter((row) => row.some((cell) => cell.length > 0));
};

const escapeCSV = (val: unknown): string => {
  const cellValue = String(val ?? "");
  if (
    cellValue.includes(",") ||
    cellValue.includes('"') ||
    cellValue.includes("\n") ||
    cellValue.includes("\r")
  ) {
    return `"${cellValue.replace(/"/g, '""')}"`;
  }
  return cellValue;
};

export const parseExcel = async (file: File): Promise<string[][]> => {
  const xlsx = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const wb = xlsx.read(buffer, { type: "array" });
  const wsName = wb.SheetNames[0];
  const ws = wb.Sheets[wsName];
  const data = xlsx.utils.sheet_to_json(ws, { header: 1 }) as string[][];
  return data.map((row) => row.map((cell) => String(cell ?? "")));
};

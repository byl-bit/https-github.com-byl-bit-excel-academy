'use client';

import { useState } from 'react';
import { normalizeGender, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Award, FileText, CheckCircle, Trash2, Printer, Search, Download, Upload, Clock, Lock } from "lucide-react";
import { PaginationControls } from "@/components/PaginationControls";
import { exportToCSV, parseCSV, generateAppreciationLetter } from '@/lib/utils/export';
import { ResultTable } from '@/components/teacher/ResultTable'; // Detailed view integration

import type { User, PendingResult, PublishedResult, Subject } from '@/lib/types';

export interface ResultsManagerProps {
    students: User[];
    teachers: User[];
    publishedResults: Array<PublishedResult | PendingResult>;
    pendingResults: PendingResult[];
    subjects: string[];
    settings?: Record<string, unknown>;
    onPublish: (result: Record<string, unknown>) => void;
    onApprovePending: (key: string, name: string) => void;
    onApproveSubject: (studentKey: string, subjectName: string) => void;
    onApproveMany: (keys: string[], teacherName: string) => void;
    onRejectPending: (key: string, name: string) => void;
    onDeletePublished: (id: string) => void;
    onUnlock?: (id: string) => void;
    onTabChange?: (tab: string) => void;
}

export function ResultsManager({
    students,
    teachers: _teachers,
    publishedResults,
    pendingResults,
    subjects,
    settings,
    onPublish,
    onApprovePending,
    onApproveSubject,
    onApproveMany,
    onRejectPending,
    onDeletePublished,
    onUnlock,
    onTabChange: _onTabChange
}: ResultsManagerProps) {
    const [selectedStudent, setSelectedStudent] = useState('');
    const [subjectMarks, setSubjectMarks] = useState<Record<string, number>>({});
    const [conduct, setConduct] = useState('Satisfactory');
    const [status, setStatus] = useState<'promoted' | 'detained'>('promoted');

    const [search, setSearch] = useState('');
    const [filterGrade, setFilterGrade] = useState('');
    const [filterSection, setFilterSection] = useState('');
    const [filterGender, setFilterGender] = useState('');
    const [filterSubject, setFilterSubject] = useState(''); // New Subject Filter
    const [_filterTeacher, _setFilterTeacher] = useState('');
    const [_currentPage, _setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Reference unused variables to satisfy lint (placeholders for future features)
    void _teachers; void _onTabChange; void _filterTeacher; void _setFilterTeacher; void _currentPage; void _setCurrentPage;

    const grades = Array.from(new Set(students.map(s => String(s.grade || '')))).sort();
    const sections = Array.from(new Set(students.map(s => String(s.section || '')))).sort();

    const handleExportResultsCSV = () => {
        const headers = ["studentId", "studentName", "rollNumber", "Sex", "grade", "section", ...subjects, "conduct", "average", "total", "promotedOrDetained"];

        // Filter students based on current view settings
        const distinctStudents = students.filter(s => {
            const matchesGrade = !filterGrade || filterGrade === 'All' || String(s.grade) === filterGrade;
            const matchesSection = !filterSection || filterSection === 'All' || String(s.section) === filterSection;
            const matchesSearch = !search ||
                ((s.name || '').toLowerCase().includes(search.toLowerCase())) ||
                ((s.student_id || s.studentId || '').toLowerCase().includes(search.toLowerCase()));
            return matchesGrade && matchesSection && matchesSearch;
        }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        const rows = distinctStudents.map(s => {
            const r = publishedResults.find(res => res.studentId === (s.student_id || s.studentId)) ||
                pendingResults.find(res => res.studentId === (s.student_id || s.studentId)) ||
                ({} as PublishedResult | PendingResult);

            const marksMap = ((r.subjects || []) as Subject[]).reduce((acc: Record<string, number>, subj: Subject) => ({ ...acc, [subj.name]: subj.marks || 0 }), {});

            const rawSex = s.gender || s.sex || r.gender || '';
            const sexNorm = normalizeGender(rawSex) || '';
            const sexVal = sexNorm === 'M' ? 'Male' : sexNorm === 'F' ? 'Female' : '';

            return [
                s.studentId || s.student_id || '',
                s.name || s.fullName || '',
                s.rollNumber || '',
                sexVal,
                s.grade || '',
                s.section || '',
                ...subjects.map(sub => marksMap[sub] || 0),
                r.conduct || 'Satisfactory',
                ((r.average || 0)).toFixed(1),
                r.total || 0,
                (r.promotedOrDetained || r.promoted_or_detained) || ((r.average || 0) >= 50 ? 'PROMOTED' : 'DETAINED')
            ];
        });

        exportToCSV(rows, `excel_academy_results_${new Date().toISOString().split('T')[0]}`, headers);
    };

    const handleBatchExportPDF = async () => {
        if (filteredResults.length === 0) return alert("No results to export.");
        if (!confirm(`Export ${filteredResults.length} report cards into a single PDF?`)) return;

        // Load Logo / Letterhead (prefer configured letterheadUrl)
        const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve) => {
            const img = new Image();
            img.src = src;
            img.crossOrigin = "Anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => resolve(new Image());
        });
        const letterheadUrl = (settings && settings['letterheadUrl']) ? String(settings['letterheadUrl']) : '';
        const logoSrc = letterheadUrl && letterheadUrl.length > 0 ? letterheadUrl : '/logo.png';
        const logoImg = await loadImage(logoSrc);
        const principalName = settings?.['principalName'] ? String(settings['principalName']) : 'Principal';
        const homeroomName = settings?.['homeroomName'] ? String(settings['homeroomName']) : 'Class Teacher';

        const jsPDF = (await import('jspdf')).default;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        for (let i = 0; i < filteredResults.length; i++) {
            const result = filteredResults[i] as PublishedResult;
            if (i > 0) doc.addPage();

            // Minimalistic Report Card Design for Batch Export
            doc.setFillColor(30, 64, 175);
            doc.rect(0, 0, pageWidth, 25, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text("EXCEL ACADEMY", pageWidth / 2, 12, { align: 'center' });
            doc.setFontSize(10);
            doc.text("STUDENT PROGRESS REPORT", pageWidth / 2, 18, { align: 'center' });

            doc.setTextColor(0, 0, 0);
            doc.setDrawColor(200, 200, 200);
            doc.rect(10, 30, pageWidth - 20, 25);

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.text(`Name: ${result.studentName}`, 15, 38);
            doc.text(`Student ID: ${result.studentId}`, 15, 45);
            doc.text(`Grade/Section: ${result.grade} - ${result.section}`, 120, 38);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 120, 45);

            // Table Header - only SUBJECT and MARKS (out of 100)
            let y = 65;
            doc.setFillColor(240, 240, 240);
            doc.rect(10, y - 5, pageWidth - 20, 8, 'F');
            doc.setFont("helvetica", "bold");
            doc.text("SUBJECT", 15, y);
            doc.text("MARKS (out of 100)", 110, y, { align: 'center' });

            y += 8;
            doc.setFont("helvetica", "normal");
            ((result.subjects || []) as Subject[]).forEach((sub: Subject, sIdx: number) => {
                if (sIdx % 2 === 0) {
                    doc.setFillColor(252, 252, 252);
                    doc.rect(10, y - 5, pageWidth - 20, 8, 'F');
                }
                doc.text(sub.name, 15, y);
                doc.text(String(sub.marks || 0), 110, y, { align: 'center' });
                y += 8;
            });

            // Summary: total, average, rank, result, conduct and signature lines
            y += 10;
            doc.setFont("helvetica", "bold");
            doc.text(`TOTAL SCORE: ${result.total}`, 15, y);
            doc.text(`AVERAGE: ${(result.average || 0).toFixed(1)} / 100`, 80, y);
            doc.text(`RANK: ${result.rank || ''}`, 140, y);

            y += 8;
            doc.setFont("helvetica", "normal");
            doc.text(`STATUS: ${(result.promotedOrDetained || result.promoted_or_detained) || ''}`, 15, y);
            doc.text(`Conduct: ${result.conduct || 'Satisfactory'}`, 80, y);

            y += 20;
            // Signature placeholders
            doc.text('Principal:', 15, y);
            doc.text('______________________________', 48, y);
            doc.text(principalName, 15, y + 6);
            doc.text('Homeroom:', 120, y);
            doc.text('______________________________', 160, y);
            doc.text(homeroomName, 120, y + 6);

            // Footer
            if (logoImg && logoImg.src && logoImg.width > 0) {
                // 1x1 inch approx 25mm
                const logoSize = 25;
                // Center at bottom
                doc.addImage(logoImg, 'PNG', (pageWidth - logoSize) / 2, pageHeight - 40, logoSize, logoSize);
            }
            doc.setFontSize(8);
            doc.text("Generated by Excel Academy CMS", pageWidth / 2, pageHeight - 10, { align: 'center' });
            doc.rect(5, 5, pageWidth - 10, pageHeight - 10, 'S');
        }

        doc.save(`batch_report_cards_${filterGrade || 'All'}_${filterSection || 'All'}.pdf`);
    };

    const handlePrintSingle = async (result: PublishedResult) => {
        // Safe-guard result data
        if (!result) return;

        const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve) => {
            const img = new Image();
            img.src = src;
            img.crossOrigin = "Anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => resolve(new Image());
        });

        const letterheadUrl = (settings && settings['letterheadUrl']) ? String(settings['letterheadUrl']) : '';
        const logoSrc = letterheadUrl && letterheadUrl.length > 0 ? letterheadUrl : '/logo.png';
        const logoImg = await loadImage(logoSrc);
        const jsPDF = (await import('jspdf')).default;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // If we have a letterhead image, draw it top-left
        if (logoImg && logoImg.src && logoImg.width > 0) {
            const lhW = 40;
            doc.addImage(logoImg, 'PNG', 10, 6, lhW, lhW * (logoImg.height / (logoImg.width || 1)));
        }

        doc.setFillColor(30, 64, 175);
        doc.rect(0, 0, pageWidth, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("EXCEL ACADEMY", pageWidth / 2, 12, { align: 'center' });
        doc.setFontSize(10);
        doc.text("STUDENT PROGRESS REPORT", pageWidth / 2, 18, { align: 'center' });

        const principalName = settings?.['principalName'] ? String(settings['principalName']) : 'Principal';
        const homeroomName = settings?.['homeroomName'] ? String(settings['homeroomName']) : 'Class Teacher';


        doc.setTextColor(0, 0, 0);
        doc.setDrawColor(200, 200, 200);
        doc.rect(10, 30, pageWidth - 20, 25);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Name: ${result.studentName || result.student_name || ''}`, 15, 38);
        doc.text(`Student ID: ${result.studentId || result.student_id || result.id || ''}`, 15, 45);
        doc.text(`Grade/Section: ${result.grade} - ${result.section}`, 120, 38);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 120, 45);

        let y = 65;
        doc.setFillColor(240, 240, 240);
        doc.rect(10, y - 5, pageWidth - 20, 8, 'F');
        doc.setFont("helvetica", "bold");
        doc.text("SUBJECT", 15, y);
        doc.text("MARKS (out of 100)", 110, y, { align: 'center' });

        y += 8;
        doc.setFont("helvetica", "normal");
        ((result.subjects || []) as Subject[]).forEach((sub: Subject, sIdx: number) => {
            if (sIdx % 2 === 0) {
                doc.setFillColor(252, 252, 252);
                doc.rect(10, y - 5, pageWidth - 20, 8, 'F');
            }
            doc.text(sub.name, 15, y);
            doc.text(String(sub.marks || 0), 110, y, { align: 'center' });
            y += 8;
        });

        y += 10;
        doc.setFont("helvetica", "bold");
        doc.text(`TOTAL SCORE: ${result.total || 0}`, 15, y);
        doc.text(`AVERAGE: ${(result.average || 0).toFixed(1)} / 100`, 80, y);
        doc.text(`RANK: ${result.rank || ''}`, 140, y);

        y += 8;
        doc.setFont("helvetica", "normal");
        doc.text(`STATUS: ${(result.promotedOrDetained || (result as any).promoted_or_detained) || ''}`, 15, y);
        doc.text(`Conduct: ${result.conduct || 'Satisfactory'}`, 80, y);

        y += 20;
        // Signatures
        doc.text('Principal:', 15, y);
        doc.text('______________________________', 40, y);
        doc.text(principalName, 15, y + 6);
        doc.text('Homeroom:', 120, y);
        doc.text('______________________________', 150, y);
        doc.text(homeroomName, 120, y + 6);

        if (logoImg && logoImg.src && logoImg.width > 0) {
            const logoSize = 25;
            doc.addImage(logoImg, 'PNG', (pageWidth - logoSize) / 2, pageHeight - 40, logoSize, logoSize);
        }
        doc.setFontSize(8);
        doc.text("Generated by Excel Academy CMS", pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.rect(5, 5, pageWidth - 10, pageHeight - 10, 'S');

        // Save single report
        doc.save(`report_card_${result.studentId || result.student_id || result.id || 'student'}.pdf`);
    };

    const handleImportResults = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

        if (isExcel) {
            const data = await file.arrayBuffer();
            const xlsx = await import('xlsx');
            const wb = xlsx.read(data, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = xlsx.utils.sheet_to_json(ws);
            processImportData(rows as unknown as Array<Record<string, unknown>>);
        } else {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                const rows = parseCSV(text);

                const headerIdx = rows.findIndex(r => r.some(cell => cell.toLowerCase().includes('studentid') || cell.toLowerCase().includes('student id')));
                if (headerIdx === -1) return alert('Invalid CSV: Missing headers (StudentID required)');

                const headers = rows[headerIdx].map(h => h.trim());
                const dataRows = rows.slice(headerIdx + 1).map(rowValues => {
                    const obj: Record<string, string> = {};
                    headers.forEach((h, i) => obj[h] = rowValues[i] || '');
                    return obj;
                });
                processImportData(dataRows as Array<Record<string, unknown>>);
            };
            reader.readAsText(file);
        }
    };

    const processImportData = (rows: Array<Record<string, unknown>>) => {
        const payload: Record<string, unknown> = {};
        rows.forEach(row => {
            const sid = String((row['studentId'] ?? row['StudentID'] ?? row['ID']) ?? '');
            if (!sid) return;

            const subArr = subjects.map(s => ({
                name: s,
                marks: Number((row[s] ?? 0) as unknown)
            }));
            const total = subArr.reduce((acc, s) => acc + s.marks, 0);
            const average = total / (subjects.length || 1);

            const rawGender = (row['Sex'] ?? row['gender'] ?? row['Gender']) ?? '';
            const normalizedGender = normalizeGender(rawGender) || '';

            payload[sid] = {
                studentId: sid,
                studentName: (row['studentName'] ?? row['Name']) ?? 'Unknown Student',
                gender: normalizedGender || '-',
                grade: (row['grade'] ?? row['Grade']) ?? '',
                section: (row['section'] ?? row['Section']) ?? '',
                subjects: subArr,
                total,
                average,
                conduct: (row['conduct'] ?? 'Satisfactory'),
                promotedOrDetained: (row['promotedOrDetained'] ?? row['Status']) ?? (average >= 50 ? 'PROMOTED' : 'DETAINED'),
                status: 'published'
            };
        });

        if (confirm(`Import results for ${Object.keys(payload).length} students?`)) {
            onPublish(payload);
        }
    };

    const handleMarkChange = (sub: string, val: string) => {
        const num = parseInt(val) || 0;
        setSubjectMarks(prev => ({ ...prev, [sub]: Math.min(100, Math.max(0, num)) }));
    };

    // Pre-fill manual entry when student is selected
    const onStudentSelect = (studentId: string) => {
        setSelectedStudent(studentId);
        if (!studentId) {
            setSubjectMarks({});
            return;
        }

        const student = students.find(s => s.id === studentId);
        const sid = student?.studentId || student?.student_id || '';

        const existing = publishedResults.find(r => (r as any).studentId === sid || (r as any).student_id === sid || (r as any).key === sid) ||
            pendingResults.find(r => (r as any).studentId === sid || (r as any).student_id === sid || (r as any).key === sid);

        if (existing) {
            const marks: Record<string, number> = {};
            (existing.subjects || []).forEach((s: Subject) => {
                marks[s.name] = Number((s as any).marks || 0);
            });
            setSubjectMarks(marks);
            setConduct((existing as any).conduct || (existing as any).conduct || 'Satisfactory');
            setStatus(((existing as any).promotedOrDetained || (existing as any).promoted_or_detained || '').toString().toLowerCase() === 'detained' ? 'detained' : 'promoted');
        } else {
            setSubjectMarks({});
            setConduct('Satisfactory');
            setStatus('promoted');
        }
    };

    const handleManualPublish = () => {
        if (!selectedStudent) return alert('Select a student');

        const student = students.find(s => s.id === selectedStudent);
        const subArray = subjects.map(s => ({ name: s, marks: subjectMarks[s] || 0 }));
        const total = subArray.reduce((acc, s) => acc + s.marks, 0);
        const average = total / (subjects.length || 1);

        onPublish({
            [student?.studentId || student?.student_id || selectedStudent]: {
                studentId: student?.studentId || student?.student_id || selectedStudent,
                studentName: student?.name || student?.fullName || '',
                grade: String(student?.grade || ''),
                section: String(student?.section || ''),
                gender: student?.gender || '',
                subjects: subArray,
                total,
                average,
                conduct,
                status: 'published',
                promotedOrDetained: status.toUpperCase()
            }
        });

        setSelectedStudent('');
        setSubjectMarks({});
    };

    const filteredResults = publishedResults.filter(r => {
        const matchesSearch = (r.studentName || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.studentId || '').toLowerCase().includes(search.toLowerCase());
        const matchesGrade = filterGrade ? String(r.grade) === String(filterGrade) : true;
        const matchesSection = filterSection ? String(r.section) === String(filterSection) : true;
        const matchesGender = filterGender ? (normalizeGender(String(r.gender || '')) === filterGender) : true;
        const matchesTeacher = _filterTeacher ? String(((r as any).submittedBy || (r as any).submitted_by || '')) === String(_filterTeacher) : true;
        return matchesSearch && matchesGrade && matchesSection && matchesGender && matchesTeacher;
    }).sort((a, b) => {
        const nameA = (a.studentName || '').toLowerCase();
        const nameB = (b.studentName || '').toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return (parseInt(String(a.rollNumber || '')) || 0) - (parseInt(String(b.rollNumber || '')) || 0);
    });

    const ResultTableHarmonized = ({ data, title, isPending }: { data: Array<PublishedResult | PendingResult>, title: string, isPending?: boolean }) => {
        const [localPage, setLocalPage] = useState(1);
        return (
            <Card className="border-none shadow-none bg-transparent space-y-4">
                <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-inner ${isPending ? 'bg-amber-100' : 'bg-blue-100'}`}>
                            {isPending ? <Clock className="h-5 w-5 text-amber-600" /> : <Award className="h-5 w-5 text-blue-600" />}
                        </div>
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2 font-black text-slate-800">
                                {title}
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500 font-medium">Review and manage results {isPending ? 'awaiting approval' : 'already public'}.</CardDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isPending && data.length > 0 && (
                            <Button
                                size="sm"
                                className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-9 shadow-lg shadow-amber-100 rounded-lg transition-transform hover:scale-105 active:scale-95"
                                onClick={() => {
                                    if (confirm(`Approve all ${data.length} results?`)) {
                                        onApproveMany(data.map(r => (r as any).key), 'Teacher');
                                    }
                                }}
                            >
                                <CheckCircle className="h-4 w-4 mr-2" /> Approve All
                            </Button>
                        )}
                        {!isPending && (
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 shadow-lg shadow-indigo-100 rounded-lg transition-transform hover:scale-105 active:scale-95" onClick={handleBatchExportPDF}>
                                <Printer className="h-4 w-4 mr-2" /> Class Report Cards (PDF)
                            </Button>
                        )}
                    </div>
                </div>

                <div className="glass-panel rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200">
                                    {!isPending && <th className="py-5 px-6 text-center whitespace-nowrap font-black text-slate-400 text-[10px] uppercase tracking-widest">Rank</th>}
                                    <th className="py-5 px-6 text-center whitespace-nowrap font-black text-slate-400 text-[10px] uppercase tracking-widest">Roll Number</th>
                                    <th className="py-5 px-6 text-left whitespace-nowrap font-black text-slate-400 text-[10px] uppercase tracking-widest">Student Information</th>
                                    <th className="py-5 px-6 text-center whitespace-nowrap font-black text-slate-400 text-[10px] uppercase tracking-widest">Grade / Section</th>
                                    <th className="py-5 px-6 text-center font-black text-slate-400 text-[10px] uppercase tracking-widest">Gender</th>
                                    <th className="py-5 px-6 text-center font-black text-slate-400 text-[10px] uppercase tracking-widest">Total</th>
                                    <th className="py-5 px-6 text-center font-black text-slate-400 text-[10px] uppercase tracking-widest bg-slate-100/50">Average</th>
                                    <th className="py-5 px-6 text-center font-black text-slate-400 text-[10px] uppercase tracking-widest">Status</th>
                                    <th className="py-5 px-6 text-right font-black text-slate-400 text-[10px] uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                                                <Award className="h-12 w-12 text-slate-300" />
                                                <p className="font-bold uppercase tracking-widest text-[11px]">No matching records found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    data.slice((localPage - 1) * ITEMS_PER_PAGE, localPage * ITEMS_PER_PAGE).map((r, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/40 transition-all duration-300 group">
                                            {!isPending && (
                                                <td className="py-5 px-6 text-center">
                                                    <span className="text-xl font-black text-slate-400 group-hover:text-blue-600 transition-colors">#{r.rank || '-'}</span>
                                                </td>
                                            )}
                                            <td className="py-5 px-6 text-center">
                                                <span className="font-black text-slate-700">{r.rollNumber || r.roll_number || '-'}</span>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="font-black text-slate-800 text-base leading-tight group-hover:text-blue-700 transition-colors uppercase tracking-tight">{r.studentName}</div>
                                                <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                                                    ID: {r.studentId || r.student_id}
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 text-center">
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-white text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-100 shadow-xs group-hover:border-blue-100 group-hover:text-blue-600 transition-all">
                                                    {r.grade} - {r.section}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6 text-center">
                                                <span className={cn(
                                                    "text-[9px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider",
                                                    normalizeGender(r.gender || (r as any).sex) === 'M' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                        normalizeGender(r.gender || (r as any).sex) === 'F' ? "bg-pink-50 text-pink-600 border-pink-100" :
                                                            "bg-slate-50 text-slate-500 border-slate-100"
                                                )}>
                                                    {normalizeGender(r.gender || (r as any).sex) || '-'}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6 text-center">
                                                <span className="font-black text-slate-700 text-lg">{r.total || 0}</span>
                                            </td>
                                            <td className="py-5 px-6 text-center bg-slate-100/30 group-hover:bg-blue-50/50 transition-colors">
                                                <div className="relative inline-block">
                                                    <span className={`text-xl font-black ${(r.average || 0) >= 50 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                        {(r.average || 0).toFixed(1)}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 ml-0.5 font-bold">%</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 text-center">
                                                <span className={`text-[10px] px-3 py-1.5 rounded-xl font-black tracking-widest uppercase shadow-sm border ${r.promotedOrDetained === 'PROMOTED'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-emerald-50/50'
                                                    : 'bg-red-50 text-red-700 border-red-100 shadow-red-50/50'
                                                    }`}>
                                                    {r.promotedOrDetained || 'PENDING'}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6 text-right">
                                                <div className="flex flex-col items-end gap-3">
                                                    {isPending && (
                                                        <div className="flex flex-wrap justify-end gap-1.5 max-w-[200px]">
                                                            {(r.subjects || []).filter((s: Subject) => s.status === 'pending_admin').map((s: Subject) => (
                                                                <Button
                                                                    key={s.name}
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-7 text-[9px] font-black uppercase px-2.5 rounded-lg bg-blue-50/50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all transform hover:scale-105"
                                                                    onClick={() => onApproveSubject((r as any).key, s.name)}
                                                                >
                                                                    Approve {s.name}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                                        {isPending ? (
                                                            <>
                                                                <Button size="icon" variant="ghost" className="h-9 w-9 text-emerald-600 hover:bg-emerald-50 hover:scale-110 active:scale-90 transition-all rounded-xl shadow-xs" onClick={() => onApprovePending((r as any).key, r.studentName || (r as any).studentName)} title="Approve Student">
                                                                    <CheckCircle className="h-5 w-5" />
                                                                </Button>
                                                                <Button size="icon" variant="ghost" className="h-9 w-9 text-red-600 hover:bg-red-50 hover:scale-110 active:scale-90 transition-all rounded-xl shadow-xs" onClick={() => onRejectPending((r as any).key, r.studentName || (r as any).studentName)} title="Reject Student">
                                                                    <Trash2 className="h-5 w-5" />
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Button size="icon" variant="ghost" className="h-9 w-9 text-blue-600 hover:bg-blue-50 hover:scale-110 active:scale-90 transition-all rounded-xl shadow-xs" onClick={() => handlePrintSingle(r as PublishedResult)} title="Print Report">
                                                                    <Printer className="h-5 w-5" />
                                                                </Button>
                                                                {((r as PublishedResult).average ?? 0) >= 90 && (
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="h-9 w-9 text-amber-500 hover:bg-amber-50 hover:scale-110 active:scale-90 transition-all rounded-xl shadow-xs"
                                                                        onClick={() => generateAppreciationLetter(r as PublishedResult, String(settings?.principalName || 'Principal'))}
                                                                        title="Generate Appreciation Letter"
                                                                    >
                                                                        <Award className="h-5 w-5" />
                                                                    </Button>
                                                                )}
                                                                {onUnlock && (
                                                                    <Button size="icon" variant="ghost" className="h-9 w-9 text-amber-500 hover:bg-amber-50 hover:scale-110 active:scale-90 transition-all rounded-xl shadow-xs" onClick={() => onUnlock((r as any).key || r.studentId || (r as any).student_id)} title="Unlock for teacher edit">
                                                                        <Lock className="h-5 w-5" />
                                                                    </Button>
                                                                )}
                                                                <Button size="icon" variant="ghost" className="h-9 w-9 text-red-500 hover:bg-red-50 hover:scale-110 active:scale-90 transition-all rounded-xl shadow-xs" onClick={() => onDeletePublished((r as any).key || r.studentId || (r as any).student_id)} title="Delete Result">
                                                                    <Trash2 className="h-5 w-5" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {data.length > ITEMS_PER_PAGE && (
                        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Displaying {(localPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(localPage * ITEMS_PER_PAGE, data.length)} of {data.length} records
                            </p>
                            <PaginationControls
                                currentPage={localPage}
                                totalItems={data.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                                onPageChange={setLocalPage}
                            />
                        </div>
                    )}
                </div>
            </Card>
        );
    };

    return (
        <div className="space-y-8 pb-32">
            {/* Header with quick actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-blue-900 tracking-tighter">Academic Records</h2>
                    <p className="text-blue-500 font-medium">Coordinate and finalize student academic performance.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 h-11 px-6 rounded-xl font-bold border-blue-200" onClick={handleExportResultsCSV}>
                        <Download className="h-4 w-4" /> Export All
                    </Button>
                    <input type="file" id="admin-results-import" className="hidden" accept=".csv,.xlsx,.xls" onChange={handleImportResults} />
                    <Button className="bg-blue-600 hover:bg-blue-700 gap-2 h-11 px-6 rounded-xl font-bold shadow-lg shadow-blue-200" onClick={() => document.getElementById('admin-results-import')?.click()}>
                        <Upload className="h-4 w-4" /> Import Data
                    </Button>
                </div>
            </div>

            {/* Subject Filter for Detailed View */}
            <div className="flex justify-end px-1">
                <select
                    className="rounded-xl border-amber-200 h-9 px-3 text-xs font-bold bg-amber-50 text-amber-900 border"
                    value={filterSubject}
                    onChange={e => setFilterSubject(e.target.value)}
                >
                    <option value="">Detailed View (Select Subject)</option>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            {/* Quick Result Editor Section */}
            <div className="grid md:grid-cols-12 gap-6 mb-8">
                {/* Left Col: Student & decision */}
                <div className="md:col-span-12 lg:col-span-8 space-y-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="glass-panel p-6 rounded-2xl flex-1 space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-blue-100/50 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Result Details</h3>
                                    <p className="text-xs text-slate-500 font-medium">Select a student to edit marks</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">Student Name</Label>
                                    <select
                                        className="w-full h-11 rounded-xl border border-slate-200 bg-white/50 px-3 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none cursor-pointer hover:bg-white"
                                        value={selectedStudent}
                                        onChange={(e) => {
                                            const s = students.find(st => st.id === e.target.value);
                                            if (s) {
                                                setSelectedStudent(s.id || '');
                                                // Initialize marks if exists
                                                setSubjectMarks({});
                                            }
                                        }}
                                    >
                                        <option value="">Select Student...</option>
                                        {students.sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.studentId})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-500 uppercase">Conduct</Label>
                                        <select
                                            className="w-full h-11 rounded-xl border border-slate-200 bg-white/50 px-3 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none cursor-pointer hover:bg-white"
                                            value={conduct}
                                            onChange={(e) => setConduct(e.target.value)}
                                        >
                                            <option value="Satisfactory">Satisfactory</option>
                                            <option value="Good">Good</option>
                                            <option value="Excellent">Excellent</option>
                                            <option value="Poor">Poor</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-500 uppercase">Decision</Label>
                                        <select
                                            className="w-full h-11 rounded-xl border border-slate-200 bg-white/50 px-3 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none cursor-pointer hover:bg-white"
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value as 'promoted' | 'detained')}
                                        >
                                            <option value="promoted">PROMOTED</option>
                                            <option value="detained">DETAINED</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 rounded-xl bg-purple-100/50 flex items-center justify-center">
                                <Award className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Subject Performance</h3>
                                <p className="text-xs text-slate-500 font-medium">Enter marks for each subject (0-100)</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {subjects.map(sub => (
                                <div key={sub} className="space-y-1.5 p-3 rounded-xl bg-slate-50/50 hover:bg-slate-100/80 transition-colors border border-transparent hover:border-slate-200">
                                    <Label className="text-[10px] font-black text-slate-400 truncate block uppercase tracking-wide">{sub}</Label>
                                    <Input
                                        type="number"
                                        value={subjectMarks[sub] ?? ''}
                                        onChange={(e) => handleMarkChange(sub, e.target.value)}
                                        className="h-10 text-center text-lg font-black border-slate-200 bg-white rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                                        placeholder="-"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Col: Actions & Summary (Could be expanded) */}
                <div className="md:col-span-12 lg:col-span-4 space-y-6">
                    <div className="glass-panel p-6 rounded-2xl h-full flex flex-col justify-center items-center text-center space-y-6 bg-linear-to-b from-white to-blue-50/30">
                        <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center mb-2 animate-pulse">
                            <Upload className="h-10 w-10 text-blue-600" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-slate-800">Ready to Publish?</h3>
                            <p className="text-sm text-slate-500 max-w-[200px] mx-auto">This will make the results immediately available to students and parents.</p>
                        </div>
                        <Button
                            className="w-full h-14 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-bold shadow-xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-95 text-lg"
                            onClick={handleManualPublish}
                        >
                            Publish Record
                        </Button>
                    </div>
                </div>
            </div>

            {/* Review Section */}
            {
                pendingResults.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black text-blue-400 uppercase tracking-widest mr-2">Approval Filters:</span>
                            <select className="rounded-xl border-blue-200 h-9 px-3 text-[10px] font-bold bg-white" value={filterGrade} onChange={e => setFilterGrade(e.target.value)}>
                                <option value="">Grades</option>
                                {grades.map(g => <option key={g} value={g}>GRADE {g}</option>)}
                            </select>
                            <select className="rounded-xl border-blue-200 h-9 px-3 text-[10px] font-bold bg-white" value={filterSection} onChange={e => setFilterSection(e.target.value)}>
                                <option value="">Sections</option>
                                {sections.map(s => <option key={s} value={s}>SEC {s}</option>)}
                            </select>
                            <select className="rounded-xl border-blue-200 h-9 px-3 text-[10px] font-bold bg-white" value={filterGender} onChange={e => setFilterGender(e.target.value)}>
                                <option value="">Gender</option>
                                <option value="M">Male</option>
                                <option value="F">Female</option>
                            </select>
                        </div>
                        <ResultTableHarmonized
                            data={[...pendingResults].filter(r => {
                                const matchesGrade = filterGrade ? String(r.grade) === String(filterGrade) : true;
                                const matchesSection = filterSection ? String(r.section) === String(filterSection) : true;
                                const matchesGender = filterGender ? (normalizeGender(String(r.gender || '')) === filterGender) : true;
                                return matchesGrade && matchesSection && matchesGender;
                            }).sort((a, b) => {
                                const nameA = (a.studentName || '').toLowerCase();
                                const nameB = (b.studentName || '').toLowerCase();
                                if (nameA < nameB) return -1;
                                if (nameA > nameB) return 1;
                                return (parseInt(String(a.rollNumber || (a as any).roll_number || '')) || 0) - (parseInt(String(b.rollNumber || (b as any).roll_number || '')) || 0);
                            })}
                            title="Result Review (Pending)"
                            isPending={true}
                        />
                    </div>
                )
            }

            {/* Search & Filters for Management Table */}
            <div className="glass-panel p-4 rounded-2xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                    <div className="relative w-full md:w-60 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                            placeholder="Search by ID or Name..."
                            className="pl-10 h-10 rounded-xl border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <select
                            className="h-10 rounded-xl border border-slate-200 bg-white/50 px-3 text-xs font-bold text-slate-600 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer hover:bg-white"
                            value={filterGrade}
                            onChange={e => setFilterGrade(e.target.value)}
                        >
                            <option value="">All Grades</option>
                            {grades.map(g => <option key={g} value={g}>Grade {g}</option>)}
                        </select>
                        <select
                            className="h-10 rounded-xl border border-slate-200 bg-white/50 px-3 text-xs font-bold text-slate-600 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer hover:bg-white"
                            value={filterSection}
                            onChange={e => setFilterSection(e.target.value)}
                        >
                            <option value="">All Sections</option>
                            {sections.map(s => <option key={s} value={s}>Sec {s}</option>)}
                        </select>
                        <select
                            className="h-10 rounded-xl border border-slate-200 bg-white/50 px-3 text-xs font-bold text-slate-600 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer hover:bg-white"
                            value={filterGender}
                            onChange={e => setFilterGender(e.target.value)}
                        >
                            <option value="">All Genders</option>
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                        </select>
                        <select
                            className="h-10 rounded-xl border border-slate-200 bg-white/50 px-3 text-xs font-bold text-slate-600 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer hover:bg-white min-w-[150px]"
                            value={filterSubject}
                            onChange={e => setFilterSubject(e.target.value)}
                        >
                            <option value="">Detailed View (Select Subject)</option>
                            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Final Management Table or Detailed Result Table */}
            {
                filterSubject && filterGrade ? (
                    <div className="animate-fade-in-up space-y-4">
                        <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-xl border border-amber-200">
                            <Award className="h-6 w-6 text-amber-600" />
                            <div>
                                <h3 className="text-lg font-black text-amber-900">Detailed Assessment View: {filterSubject}</h3>
                                <p className="text-xs text-amber-700 font-bold">Viewing breakdown (Test, Mid, etc) for Grade {filterGrade} {filterSection || '(All Sections)'}</p>
                            </div>
                        </div>
                        <ResultTable
                            user={{ id: 'admin', role: 'admin', name: 'System Administrator', email: 'admin@school.com', image: '' } as any}
                            students={students.filter(s => {
                                const matchesGrade = String(s.grade) === filterGrade;
                                const matchesSection = !filterSection || String(s.section) === filterSection;
                                const matchesGender = !filterGender || normalizeGender(s.gender || s.sex) === filterGender;
                                return matchesGrade && matchesSection && matchesGender;
                            })}
                            subjects={[filterSubject]}
                            settings={settings}
                            classResults={[...publishedResults, ...pendingResults]}
                            onRefresh={() => {
                                // Trigger refresh if needed - for now just log
                                console.log("Refresh requested from detailed view");
                                // Ideally re-fetch results exposed via props?
                            }}
                            isHomeroomView={false} // Subject view
                        />
                    </div>
                ) : (
                    <ResultTableHarmonized
                        data={filteredResults}
                        title="Published Results Management"
                    />
                )
            }
        </div >
    );
}

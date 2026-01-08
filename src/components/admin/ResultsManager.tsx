'use client';

import { useState, useMemo } from 'react';
import { normalizeGender, cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Download, Upload, Plus, LayoutGrid, List, FileText, Search, RefreshCw, Award } from "lucide-react";
import { ResultStats } from './results/ResultStats';
import { ResultFilters } from './results/ResultFilters';
import { ManualEntryForm } from './results/ManualEntryForm';
import { ResultDirectoryTable } from './results/ResultDirectoryTable';
import { ResultTable } from '@/components/teacher/ResultTable';
import { parseCSV } from '@/lib/utils/export';
import type { User, PendingResult, PublishedResult, Subject } from '@/lib/types';
import { useToast } from '@/contexts/ToastContext';

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
    onRefresh?: () => void;
    onUnlock?: (id: string) => void;
    onTabChange?: (tab: string) => void;
}

export function ResultsManager({
    students,
    teachers,
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
    onRefresh,
    onUnlock,
    onTabChange
}: ResultsManagerProps) {
    const { success, error: notifyError } = useToast();
    const [view, setView] = useState<'directory' | 'manual' | 'subject'>('directory');

    // Filters
    const [search, setSearch] = useState('');
    const [filterGrade, setFilterGrade] = useState('');
    const [filterSection, setFilterSection] = useState('');
    const [filterGender, setFilterGender] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');

    const grades = useMemo(() => Array.from(new Set(students.map(s => String(s.grade || '')))).sort(), [students]);
    const sections = useMemo(() => Array.from(new Set(students.map(s => String(s.section || '')))).sort(), [students]);

    // Derived Data
    const filteredPublished = useMemo(() => {
        return (publishedResults as PublishedResult[]).filter(r => {
            const matchesGrade = !filterGrade || String(r.grade) === filterGrade;
            const matchesSection = !filterSection || String(r.section) === filterSection;
            const matchesGender = !filterGender || normalizeGender(r.gender || (r as any).sex) === filterGender;
            const matchesStatus = !filterStatus || (r.promotedOrDetained || r.promoted_or_detained) === filterStatus;
            const matchesSearch = !search ||
                r.studentName?.toLowerCase().includes(search.toLowerCase()) ||
                r.studentId?.toLowerCase().includes(search.toLowerCase()) ||
                String(r.rollNumber || (r as any).roll_number || '').includes(search);
            return matchesGrade && matchesSection && matchesGender && matchesStatus && matchesSearch;
        }).sort((a, b) => (a.rank || 999) - (b.rank || 999));
    }, [publishedResults, filterGrade, filterSection, filterGender, filterStatus, search]);

    const filteredPending = useMemo(() => {
        return pendingResults.filter(r => {
            const matchesGrade = !filterGrade || String(r.grade) === filterGrade;
            const matchesSection = !filterSection || String(r.section) === filterSection;
            const matchesGender = !filterGender || normalizeGender(r.gender || (r as any).sex) === filterGender;
            const matchesSearch = !search ||
                r.studentName?.toLowerCase().includes(search.toLowerCase()) ||
                r.studentId?.toLowerCase().includes(search.toLowerCase());
            return matchesGrade && matchesSection && matchesGender && matchesSearch;
        });
    }, [pendingResults, filterGrade, filterSection, filterGender, search]);

    const handleImportResults = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const text = event.target?.result as string;
                const rows = await parseCSV(text);

                if (rows && rows.length > 1) {
                    const headers = rows[0];
                    const dataRows = rows.slice(1);

                    const processedResults: Record<string, any> = {};

                    dataRows.forEach(row => {
                        const res: any = {};
                        headers.forEach((h, i) => {
                            const val = row[i];
                            if (h.toLowerCase() === 'studentid' || h.toLowerCase() === 'student_id') {
                                res.studentId = val;
                            } else if (h.toLowerCase() === 'name' || h.toLowerCase() === 'studentname') {
                                res.studentName = val;
                            } else if (subjects.includes(h)) {
                                if (!res.subjects) res.subjects = [];
                                res.subjects.push({ name: h, marks: parseFloat(val) || 0 });
                            } else {
                                res[h] = val;
                            }
                        });

                        if (res.studentId) {
                            processedResults[res.studentId] = res;
                        }
                    });

                    await onPublish(processedResults);
                    success('Import successful');
                }
            };
            reader.readAsText(file);
        } catch (err) {
            console.error('Import failed:', err);
            notifyError('Import failed. Please check the file format.');
        }
    };

    const handleExportXLSX = async () => {
        const ExcelJS = await import('exceljs');
        const { saveAs } = await import('file-saver');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Academic Results');

        // Dynamic Columns
        const columns = [
            { header: 'Rank', key: 'rank', width: 8 },
            { header: 'Student ID', key: 'studentId', width: 18 },
            { header: 'Name', key: 'studentName', width: 30 },
            { header: 'Grade', key: 'grade', width: 10 },
            { header: 'Section', key: 'section', width: 10 },
            ...subjects.map(s => ({ header: s, key: s, width: 12 })),
            { header: 'Average', key: 'average', width: 12 },
            { header: 'Decision', key: 'decision', width: 15 }
        ];

        worksheet.columns = columns;

        filteredPublished.forEach(r => {
            const marks: any = {};
            (r.subjects || []).forEach(s => marks[s.name] = s.marks);
            worksheet.addRow({
                rank: r.rank || '-',
                studentId: r.studentId,
                studentName: r.studentName,
                grade: r.grade,
                section: r.section,
                ...marks,
                average: r.average?.toFixed(1),
                decision: r.promotedOrDetained || r.promoted_or_detained
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `Excel_Academy_Results_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handlePrintSingle = async (result: PublishedResult) => {
        const jsPDF = (await import('jspdf')).default;
        const doc = new jsPDF();

        doc.setFontSize(22);
        doc.text("EXCEL ACADEMY", 105, 20, { align: 'center' });
        doc.setFontSize(14);
        doc.text("OFFICIAL REPORT CARD", 105, 30, { align: 'center' });

        doc.setLineWidth(0.5);
        doc.line(20, 35, 190, 35);

        doc.setFontSize(10);
        doc.text(`Name: ${result.studentName}`, 20, 45);
        doc.text(`ID: ${result.studentId}`, 20, 50);
        doc.text(`Grade/Section: ${result.grade} - ${result.section}`, 140, 45);
        doc.text(`Roll: ${result.rollNumber || '-'}`, 140, 50);

        let y = 65;
        doc.setFont("helvetica", "bold");
        doc.text("Subject", 20, y);
        doc.text("Marks (/100)", 100, y);
        doc.line(20, y + 2, 190, y + 2);

        doc.setFont("helvetica", "normal");
        y += 10;
        (result.subjects || []).forEach(s => {
            doc.text(s.name, 20, y);
            doc.text(String(s.marks || 0), 100, y);
            y += 8;
        });

        y += 10;
        doc.line(20, y - 5, 190, y - 5);
        doc.setFont("helvetica", "bold");
        doc.text(`Average: ${result.average?.toFixed(1)}%`, 20, y);
        doc.text(`Outcome: ${result.promotedOrDetained || result.promoted_or_detained || 'N/A'}`, 100, y);

        doc.save(`Report_${result.studentId}.pdf`);
    };

    const handleBatchPrint = async () => {
        if (filteredPublished.length === 0) return;
        const jsPDF = (await import('jspdf')).default;
        const doc = new jsPDF();

        for (let i = 0; i < filteredPublished.length; i++) {
            if (i > 0) doc.addPage();
            const r = filteredPublished[i];
            doc.text(`Excel Academy - ${r.studentName}`, 20, 20);
            doc.text(`Grade: ${r.grade} Section: ${r.section}`, 20, 30);
            doc.text(`Average: ${r.average?.toFixed(1)}%`, 20, 40);
        }
        doc.save(`Batch_Results_${filterGrade || 'Global'}.pdf`);
    };

    return (
        <div className="space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Award className="h-10 w-10 text-indigo-600" />
                        Academic Results Center
                    </h1>
                    <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-2 ml-1">Centralized verified records & performance oversight</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        variant="outline"
                        className="h-12 border-slate-200 bg-white shadow-sm hover:bg-slate-50 font-black rounded-2xl px-6 gap-2"
                        onClick={onRefresh}
                    >
                        <RefreshCw className="h-4 w-4" /> REFRESH
                    </Button>
                    <input type="file" id="results-import" className="hidden" accept=".csv" onChange={handleImportResults} />
                    <Button
                        variant="outline"
                        className="h-12 border-indigo-200 bg-indigo-50/50 text-indigo-700 shadow-sm hover:bg-indigo-100 font-black rounded-2xl px-6 gap-2"
                        onClick={() => document.getElementById('results-import')?.click()}
                    >
                        <Upload className="h-4 w-4" /> IMPORT CSV
                    </Button>
                    <Button
                        className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 font-black rounded-2xl px-8 gap-2"
                        onClick={handleExportXLSX}
                    >
                        <Download className="h-4 w-4" /> EXPORT PERFORMANCE
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <ResultStats published={filteredPublished} pending={filteredPending} />

            {/* Navigation Tabs */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl self-start w-fit">
                <button
                    onClick={() => setView('directory')}
                    className={cn(
                        "px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        view === 'directory' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    )}
                >
                    <List className="h-4 w-4 inline mr-2" /> Records Directory
                </button>
                <button
                    onClick={() => setView('manual')}
                    className={cn(
                        "px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        view === 'manual' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    )}
                >
                    <Plus className="h-4 w-4 inline mr-2" /> Manual Publishing
                </button>
                <button
                    onClick={() => setView('subject')}
                    className={cn(
                        "px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        view === 'subject' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    )}
                >
                    <LayoutGrid className="h-4 w-4 inline mr-2" /> Subject Analytics
                </button>
            </div>

            {/* Main Content Area */}
            {view === 'directory' && (
                <div className="space-y-8">
                    <ResultFilters
                        grades={grades}
                        sections={sections}
                        filterGrade={filterGrade}
                        setFilterGrade={setFilterGrade}
                        filterSection={filterSection}
                        setFilterSection={setFilterSection}
                        filterGender={filterGender}
                        setFilterGender={setFilterGender}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                        search={search}
                        setSearch={setSearch}
                        onReset={() => {
                            setFilterGrade('');
                            setFilterSection('');
                            setFilterGender('');
                            setFilterStatus('');
                            setSearch('');
                        }}
                    />

                    {filteredPending.length > 0 && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                            <ResultDirectoryTable
                                data={filteredPending}
                                isPendingView={true}
                                onApprovePending={onApprovePending}
                                onRejectPending={onRejectPending}
                                onPrintSingle={handlePrintSingle}
                                onBatchPrint={() => { }}
                                onApproveMany={onApproveMany}
                            />
                        </div>
                    )}

                    <div className="animate-in slide-in-from-top-4 duration-500">
                        <ResultDirectoryTable
                            data={filteredPublished}
                            isPendingView={false}
                            onDeletePublished={onDeletePublished}
                            onUnlock={onUnlock}
                            onPrintSingle={handlePrintSingle}
                            onBatchPrint={handleBatchPrint}
                            onGenerateLetter={(r) => {
                                const principalName = (settings && settings.principalName) ? String(settings.principalName) : 'Principal';
                                import('@/lib/utils/export').then(mod => mod.generateAppreciationLetter(r, principalName));
                            }}
                        />
                    </div>
                </div>
            )}

            {view === 'manual' && (
                <div className="animate-in zoom-in-95 duration-300">
                    <ManualEntryForm
                        students={students}
                        subjects={subjects}
                        publishedResults={publishedResults as PublishedResult[]}
                        pendingResults={pendingResults}
                        onPublish={onPublish}
                    />
                </div>
            )}

            {view === 'subject' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="glass-panel p-6 rounded-3xl bg-white flex items-center gap-6">
                        <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Analysis Subject</label>
                            <select
                                className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 transition-all hover:bg-white"
                                value={selectedSubject}
                                onChange={e => setSelectedSubject(e.target.value)}
                            >
                                <option value="">Global Breakdown...</option>
                                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Focus Grade</label>
                            <select
                                className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 transition-all hover:bg-white"
                                value={filterGrade}
                                onChange={e => setFilterGrade(e.target.value)}
                            >
                                <option value="">Specific Grade...</option>
                                {grades.map(g => <option key={g} value={g}>Grade {g}</option>)}
                            </select>
                        </div>
                    </div>

                    {selectedSubject && filterGrade ? (
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900">{selectedSubject} Detailed Performance - Grade {filterGrade}</h3>
                            </div>
                            <ResultTable
                                user={{ id: 'admin', role: 'admin' } as any}
                                students={students.filter(s => String(s.grade) === filterGrade)}
                                subjects={[selectedSubject]}
                                classResults={[...publishedResults, ...pendingResults]}
                                onRefresh={onRefresh || (() => { })}
                                isHomeroomView={false}
                            />
                        </div>
                    ) : (
                        <div className="py-20 text-center glass-panel rounded-3xl bg-slate-50/50 border-dashed border-2 border-slate-200">
                            <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <p className="font-black text-slate-400 uppercase tracking-widest text-sm">Select both a Subject and a Grade to view detailed analytics</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

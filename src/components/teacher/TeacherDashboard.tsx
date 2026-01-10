import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { CardHeader } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, FileCheck, Clock, TrendingUp, CheckCircle, AlertCircle, Loader2, ArrowRight, School, Search } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { calculateGrade, calculateConduct } from '@/lib/utils/gradingLogic';
import { normalizeGender, cn } from '@/lib/utils';
import type { User, PendingResult, PublishedResult, Subject } from '@/lib/types';

type AssessmentType = { id: string; label: string; maxMarks?: number; weight?: number };

interface TeacherOverviewProps {
    user: User;
    students: User[];
    classResults: Array<PublishedResult | PendingResult>;
    onExport: () => void;
    onImportClick: () => void;
    settings?: { assessmentTypes?: AssessmentType[] };
}

export function TeacherOverview({ user, students, classResults, onExport, onImportClick, settings }: TeacherOverviewProps) {
    const { success, error: notifyError } = useToast();
    const [search, setSearch] = useState('');
    const publishedCount = classResults.filter(r => r.status === 'published').length;
    const pendingCount = classResults.filter(r => r.status === 'pending').length;
    const draftCount = classResults.filter(r => r.status === 'draft').length;
    const isHomeRoom = user.grade && user.section && students.length > 0 && String(user.grade) === String(students[0]?.grade) && String(user.section) === String(students[0]?.section);

    const generateBulkReports = async () => {
        if (!classResults.length) return notifyError('No results to generate.');
        const jsPDF = (await import('jspdf')).default;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const assessmentTypes = settings?.assessmentTypes || [];

        for (let i = 0; i < classResults.length; i++) {
            const result = classResults[i];
            if (i > 0) doc.addPage();

            // --- Header ---
            doc.setFillColor(37, 99, 235); // Blue-600
            doc.rect(0, 0, pageWidth, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("EXCEL ACADEMY", pageWidth / 2, 20, { align: 'center' });
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.text("Official Student Report Card", pageWidth / 2, 30, { align: 'center' });

            // --- Student Details ---
            doc.setTextColor(30, 58, 138); // Blue-950
            let y = 60;
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text("STUDENT DETAILS", 20, 60);

            doc.setFont("helvetica", "normal");
            doc.text(`Name: ${result.studentName || (result as any).student_name || 'Student'}`, 20, 70);
            doc.text(`ID: ${result.studentId || (result as any).student_id || 'N/A'}`, 20, 78);
            doc.text(`Gender: ${normalizeGender(result.gender || (result as any).sex) || '-'}`, 20, 86);
            doc.text(`Grade: ${result.grade}-${result.section}`, 120, 70);
            doc.text(`Roll No: ${result.rollNumber || (result as any).roll_number || '-'}`, 120, 78);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 120, 86);

            y = 100;

            // --- Results Table Header ---
            doc.setFillColor(239, 246, 255); // Blue-50
            doc.rect(15, y - 5, pageWidth - 30, 10, 'F');
            doc.setFont("helvetica", "bold");
            doc.setTextColor(37, 99, 235); // Blue-600

            doc.text("SUBJECT", 20, y + 2);
            let xPos = 110;
            doc.text("MARKS", xPos, y + 2, { align: 'center' });
            xPos += 40;
            doc.text("GRADE", xPos, y + 2, { align: 'center' });

            y += 10;
            doc.setFont("helvetica", "normal");
            doc.setTextColor(30, 58, 138); // Blue-950

            // --- Rows ---
            (result.subjects || []).forEach((sub: Subject, idx: number) => {
                if (idx % 2 === 0) {
                    doc.setFillColor(248, 250, 252); // Slate-50 (or very light blue)
                    doc.rect(15, y - 6, pageWidth - 30, 10, 'F');
                }
                doc.text(sub.name, 20, y);
                doc.text(String(sub.marks), 110, y, { align: 'center' });

                const grade = calculateGrade(sub.marks ?? 0);
                doc.text(grade, 150, y, { align: 'center' });

                y += 10;
            });

            // --- Summary ---
            y += 10;
            doc.setDrawColor(37, 99, 235); // Blue-600
            doc.line(15, y, pageWidth - 15, y);
            y += 15;

            doc.setFont("helvetica", "bold");
            doc.text(`Total Score: ${result.total ?? 0}`, 20, y);
            doc.text(`Average: ${(result.average ?? 0).toFixed(1)} / 100`, 70, y);
            doc.text(`Conduct: ${calculateConduct(result.average ?? 0)}`, 130, y);

            y += 10;
            const status = result.promotedOrDetained;
            doc.text(`Result: ${status}`, 140, y);

            // --- Footer ---
            const bottomY = doc.internal.pageSize.getHeight() - 30;
            doc.setFontSize(10);
            doc.setTextColor(148, 163, 184); // Slate-400
            doc.text("Generated via Excel Academy Admin Portal", pageWidth / 2, bottomY, { align: 'center' });
        }

        doc.save(`Bulk_Report_Cards_${user.grade}-${user.section}.pdf`);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Header */}
            <div className="glass-panel overflow-hidden rounded-4xl shadow-sm relative group">
                <div className="absolute inset-0 bg-linear-to-br from-indigo-600/5 via-transparent to-blue-600/5 opacity-50"></div>
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-400 blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
                <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-400 blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity"></div>

                <div className="relative z-10 p-8 sm:p-12 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-12">
                    <div className="text-center md:text-left space-y-4">
                        <div className="space-y-1">
                            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-800">
                                Welcome, <span className="text-indigo-600">{user.name}</span>
                            </h1>
                            <p className="text-slate-500 text-lg font-bold flex items-center justify-center md:justify-start gap-2">
                                <School className="h-5 w-5 text-indigo-500" />
                                {user.grade && user.section ? (
                                    <>Assigned Room: Grade {user.grade} - Section {user.section}</>
                                ) : (
                                    <>Subject Faculty • No Homeroom Assigned</>
                                )}
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            <div className="glass-panel bg-white/40 px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest border-white/50 flex items-center gap-3 text-slate-600 shadow-xs">
                                <LayoutDashboard className="h-4 w-4 text-indigo-500" /> Administrative Overview
                            </div>
                        </div>
                    </div>

                    {user.grade === students[0]?.grade && user.section === students[0]?.section && (
                        <Button
                            onClick={generateBulkReports}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100 font-black rounded-2xl h-14 px-8 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                        >
                            <FileCheck className="h-5 w-5" />
                            <span>Download All Report Cards</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="glass-panel p-8 rounded-4xl shadow-sm flex items-center gap-6 group hover:bg-white transition-all duration-300">
                    <div className="h-16 w-16 rounded-2xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                        <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-4xl font-black text-slate-800 tracking-tight">{students.length}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Class Students</p>
                    </div>
                </div>

                <div className="glass-panel p-8 rounded-4xl shadow-sm flex items-center gap-6 group hover:bg-white transition-all duration-300">
                    <div className="h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                        <CheckCircle className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-4xl font-black text-slate-800 tracking-tight">{publishedCount}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Live Results</p>
                    </div>
                </div>

                <div className="glass-panel p-8 rounded-4xl shadow-sm flex items-center gap-6 group hover:bg-white transition-all duration-300">
                    <div className="h-16 w-16 rounded-2xl bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                        <Clock className="h-8 w-8 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-4xl font-black text-slate-800 tracking-tight">{pendingCount + draftCount}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Pending Actions</p>
                    </div>
                </div>
            </div>

            {/* Insights & To-Do */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-sm bg-white/40 overflow-hidden">
                    <CardHeader title="Academic Insights" description="Performance analytics" icon={TrendingUp} />
                    <div className="space-y-8 p-6 pt-0">
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Class Pass Rate</p>
                                    <span className="text-3xl font-black text-indigo-600">
                                        {students.length > 0 ? ((classResults.filter(r => r.result === 'PASS').length / students.length) * 100).toFixed(0) : 0}%
                                    </span>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">+2.4% vs last term</span>
                            </div>
                            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className="h-full bg-linear-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-1000 shadow-lg shadow-indigo-100"
                                    style={{ width: `${students.length > 0 ? (classResults.filter(r => r.result === 'PASS').length / students.length) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Process Completion</p>
                                    <span className="text-3xl font-black text-blue-600">
                                        {students.length > 0 ? ((publishedCount / students.length) * 100).toFixed(0) : 0}%
                                    </span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">On Schedule</span>
                            </div>
                            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className="h-full bg-linear-to-r from-blue-500 to-sky-400 rounded-full transition-all duration-1000 shadow-lg shadow-blue-100"
                                    style={{ width: `${students.length > 0 ? (publishedCount / students.length) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="border-none shadow-sm bg-white/40 overflow-hidden">
                    <CardHeader title="Task Center" description="Immediate items" icon={AlertCircle} />
                    <div className="px-6 pt-0">
                        {pendingCount === 0 && draftCount === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-4">
                                <div className="h-16 w-16 rounded-3xl bg-slate-50 flex items-center justify-center">
                                    <CheckCircle className="h-8 w-8 text-emerald-400 opacity-50" />
                                </div>
                                <p className="text-sm font-bold uppercase tracking-widest italic opacity-50">Operational excellence - All tasks clear</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingCount > 0 && (
                                    <div className="flex items-center gap-4 bg-white/80 p-5 rounded-2xl border border-blue-50 shadow-xs group hover:bg-white transition-colors">
                                        <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                                            <Clock className="h-6 w-6 text-blue-500" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{pendingCount} Verifications Pending</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Awaiting final admin signature</p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                )}
                                {draftCount > 0 && (
                                    <div className="flex items-center gap-4 bg-white/80 p-5 rounded-2xl border border-indigo-50 shadow-xs group hover:bg-white transition-colors">
                                        <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                                            <AlertCircle className="h-6 w-6 text-indigo-500" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{draftCount} Records for Review</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Input processing required</p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                )}
                                {isHomeRoom && draftCount > 0 && (
                                    <div className="bg-linear-to-r from-red-600 to-orange-600 p-1 rounded-2xl mt-4">
                                        <div className="bg-white/95 p-5 rounded-xl flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                                                <TrendingUp className="h-5 w-5 text-red-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-red-600 uppercase tracking-widest">Homeroom Priority</p>
                                                <p className="text-sm font-bold text-slate-800">Process {draftCount} submissions now</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Recent Table */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shadow-inner">
                            <FileCheck className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Recent Activity</h3>
                            <p className="text-xs text-slate-500 font-medium">Latest result processing snapshots.</p>
                        </div>
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search student or ID..."
                            className="pl-10 h-10 rounded-xl bg-white/50 border-slate-200 focus:ring-indigo-500 font-bold text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="glass-panel overflow-hidden rounded-4xl shadow-sm border border-slate-100">
                    {classResults.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="h-20 w-20 bg-slate-50 rounded-4xl flex items-center justify-center mx-auto mb-6">
                                <FileCheck className="h-10 w-10 text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">No activity logs recorded yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Student Information</th>
                                        <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Class / Roll</th>
                                        <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Gender</th>
                                        <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Assessments</th>
                                        <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Outcome</th>
                                        <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {classResults
                                        .filter(r =>
                                            (r.studentName || '').toLowerCase().includes(search.toLowerCase()) ||
                                            (r.studentId || '').toLowerCase().includes(search.toLowerCase())
                                        )
                                        .slice(0, 10)
                                        .map((result, idx) => (
                                            <tr key={result.id ?? idx} className="hover:bg-indigo-50/30 transition-all duration-300 group">
                                                <td className="p-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                                                            {(result.studentName ?? '').charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-800 group-hover:text-indigo-700 transition-colors leading-tight uppercase tracking-tight">{result.studentName ?? 'Student'}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">ID: {result.studentId}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <div className="inline-flex flex-col items-center">
                                                        <span className="text-xs font-black text-slate-700">{result.grade}-{result.section}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Roll: {result.rollNumber || (result as any).roll_number || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <span className={cn(
                                                        "text-[9px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider",
                                                        normalizeGender(result.gender || (result as any).sex) === 'M' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                            normalizeGender(result.gender || (result as any).sex) === 'F' ? "bg-pink-50 text-pink-600 border-pink-100" :
                                                                "bg-slate-50 text-slate-500 border-slate-100"
                                                    )}>
                                                        {normalizeGender(result.gender || (result as any).sex) || '-'}
                                                    </span>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <div className="flex flex-wrap justify-center gap-1 max-w-[200px] mx-auto">
                                                        {(result.subjects || []).map((sub: any) => (
                                                            <div key={sub.name} className="flex flex-col items-center p-1.5 rounded-lg bg-white border border-slate-100 shadow-xs min-w-[50px]">
                                                                <span className="text-[8px] font-black text-slate-400 uppercase truncate w-10 text-center">{sub.name}</span>
                                                                <span className="text-[11px] font-black text-indigo-600">{sub.marks}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <div className="inline-block relative">
                                                        <span className={`text-xl font-black ${(result.average ?? 0) >= 35 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                            {(result.average ?? 0).toFixed(1)}
                                                        </span>
                                                        <span className="text-[9px] text-slate-400 ml-0.5 font-bold">%</span>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-right">
                                                    <div className="flex flex-col items-end gap-1.5">
                                                        <span className={`text-[9px] px-2.5 py-1 rounded-lg font-black tracking-widest uppercase shadow-sm border ${result.status === 'published'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                            : 'bg-amber-50 text-amber-700 border-amber-100'
                                                            }`}>
                                                            {result.status || 'Draft'}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase">{new Date().toLocaleDateString()}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

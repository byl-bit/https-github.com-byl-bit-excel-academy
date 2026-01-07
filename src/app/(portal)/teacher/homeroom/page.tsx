'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileCheck, Users, Printer, AlertCircle } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { calculateGrade, calculateConduct } from '@/lib/utils/gradingLogic';

export default function HomeroomPage() {
    const { user } = useAuth();
    const { toast, success } = useToast();
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<any[]>([]);
    const [results, setResults] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>({});

    const isHomeroom = !!user?.grade && !!user?.section;

    useEffect(() => {
        if (!user || !isHomeroom) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const [usersRes, resultsRes, settingsRes] = await Promise.all([
                    fetch(`/api/users?role=student&grade=${user.grade}&section=${user.section}`),
                    fetch(`/api/results?grade=${user.grade}&section=${user.section}`, {
                        headers: { 'x-actor-role': 'teacher', 'x-actor-id': user.id }
                    }),
                    fetch('/api/settings')
                ]);

                if (usersRes.ok) {
                    const classStudents = await usersRes.json();
                    const activeStudents = classStudents.filter((u: any) => u.status === 'active');
                    activeStudents.sort((a: any, b: any) => {
                        const nameA = (a.name || a.fullName || '').toLowerCase();
                        const nameB = (b.name || b.fullName || '').toLowerCase();
                        if (nameA !== nameB) return nameA.localeCompare(nameB);
                        const rollA = parseInt(String(a.rollNumber || '0'));
                        const rollB = parseInt(String(b.rollNumber || '0'));
                        return rollA - rollB;
                    });
                    setStudents(activeStudents);
                }

                if (resultsRes.ok) {
                    const data = await resultsRes.json();
                    const published = Object.values(data.published || {});
                    const pending = Object.values(data.pending || {});
                    setResults([...published, ...pending]);
                }

                if (settingsRes.ok) {
                    setSettings(await settingsRes.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, isHomeroom]);

    const generateBulkReports = async () => {
        if (!results.length) {
            toast("There are no results to generate reports for.", "error");
            return;
        }

        try {
            const jsPDF = (await import('jspdf')).default;
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth(); // ~210mm

            // Filter only published results for reports? Usually yes, but let's allow all for now or filter.
            // Let's use all results that seem final (published).
            const reportableResults = results.filter(r => r.status === 'published');
            reportableResults.sort((a, b) => {
                const nameA = (a.studentName || '').toLowerCase();
                const nameB = (b.studentName || '').toLowerCase();
                if (nameA !== nameB) return nameA.localeCompare(nameB);
                const rollA = parseInt(String(a.rollNumber || '0'));
                const rollB = parseInt(String(b.rollNumber || '0'));
                return rollA - rollB;
            });

            if (reportableResults.length === 0) {
                toast("Only published results can be generated.", "error");
                return;
            }

            for (let i = 0; i < reportableResults.length; i++) {
                const result = reportableResults[i];
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
                doc.text(`Name: ${result.studentName || 'Student'}`, 20, 70);
                doc.text(`ID: ${result.studentId}`, 20, 78);
                doc.text(`Grade: ${result.grade}-${result.section}`, 120, 70);
                doc.text(`Date: ${new Date().toLocaleDateString()}`, 120, 78);

                y = 100;

                // --- Results Table Header ---
                doc.setFillColor(239, 246, 255); // Blue-50
                doc.rect(15, y - 5, pageWidth - 30, 10, 'F');
                doc.setFont("helvetica", "bold");
                doc.setTextColor(37, 99, 235); // Blue-600

                doc.text("SUBJECT", 20, y + 2);
                doc.text("MARKS", 110, y + 2, { align: 'center' });
                doc.text("GRADE", 150, y + 2, { align: 'center' });

                y += 10;
                doc.setFont("helvetica", "normal");
                doc.setTextColor(30, 58, 138); // Blue-950

                // --- Rows ---
                (result.subjects || []).forEach((sub: any, idx: number) => {
                    if (idx % 2 === 0) {
                        doc.setFillColor(248, 250, 252);
                        doc.rect(15, y - 6, pageWidth - 30, 10, 'F');
                    }
                    doc.text(sub.name, 20, y);
                    doc.text(String(sub.marks), 110, y, { align: 'center' });
                    doc.text(calculateGrade(sub.marks ?? 0), 150, y, { align: 'center' });
                    y += 10;
                });

                // --- Summary ---
                y += 10;
                doc.setDrawColor(37, 99, 235);
                doc.line(15, y, pageWidth - 15, y);
                y += 15;

                doc.setFont("helvetica", "bold");
                doc.text(`Total Score: ${result.total ?? 0}`, 20, y);
                doc.text(`Average: ${(result.average ?? 0).toFixed(1)} / 100`, 70, y);
                doc.text(`Conduct: ${calculateConduct(result.average ?? 0)}`, 130, y);

                y += 10;
                doc.text(`Result: ${result.promotedOrDetained || result.result}`, 140, y);

                // --- Footer ---
                const bottomY = doc.internal.pageSize.getHeight() - 30;
                doc.setFontSize(10);
                doc.setTextColor(148, 163, 184);
                doc.text("Generated via Excel Academy Admin Portal", pageWidth / 2, bottomY, { align: 'center' });
            }

            doc.save(`Homeroom_Report_${user?.grade}-${user?.section}.pdf`);
            success(`Generated ${reportableResults.length} report cards.`);

        } catch (e) {
            console.error(e);
            toast("Failed to generate reports.", "error");
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 text-blue-600 animate-spin" /></div>;

    if (!isHomeroom) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-orange-50 p-4 rounded-full mb-4">
                    <AlertCircle className="h-10 w-10 text-orange-500" />
                </div>
                <h2 className="text-xl font-bold text-blue-900">Not Assigned as Homeroom Teacher</h2>
                <p className="text-blue-500 max-w-md mt-2">You must be assigned to a specific Grade and Section as a Homeroom Teacher to access this portal.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-linear-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                        <Users className="h-7 w-7 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Homeroom Portal</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="bg-blue-100 text-blue-700 text-xs font-black px-2 py-0.5 rounded text-[10px] uppercase tracking-wide border border-blue-200">
                                Class {user.grade}-{user.section}
                            </span>
                            <span className="text-slate-400 font-bold text-xs">•</span>
                            <span className="text-slate-500 font-bold text-xs">{students.length} Students</span>
                        </div>
                    </div>
                </div>
                <Button
                    onClick={generateBulkReports}
                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 font-bold h-10 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                >
                    <Printer className="h-4 w-4" />
                    <span>Class Report Cards</span>
                </Button>
            </div>

            <div className="grid gap-3">
                {students.map(student => {
                    const studentRes = results.find(r => r.studentId === student.studentId || r.studentId === student.id);
                    const hasResult = !!studentRes;
                    const isPassed = hasResult && (studentRes.promotedOrDetained === 'PROMOTED' || studentRes.result === 'PASS');
                    const average = studentRes?.average || studentRes?.total / (studentRes?.subjects?.length || 1) || 0;

                    return (
                        <div key={student.id} className="glass-panel p-4 rounded-xl flex items-center justify-between hover:bg-white transition-all group border border-transparent hover:border-blue-100 hover:shadow-md">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-600 border border-slate-100 shadow-sm group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    {student.name?.charAt(0) || 'S'}
                                </div>
                                <div className="space-y-0.5">
                                    <p className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{student.name}</p>
                                    <p className="text-xs text-slate-400 font-mono tracking-tight">{student.rollNumber ? `Roll: ${student.rollNumber}` : 'No Roll #'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                {hasResult ? (
                                    <>
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Average</p>
                                            <p className={`font-black text-lg ${average >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                                                {average.toFixed(1)}<span className="text-xs text-slate-300 ml-0.5">%</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide border shadow-sm ${isPassed
                                                ? 'bg-green-100 text-green-700 border-green-200'
                                                : 'bg-red-100 text-red-700 border-red-200'
                                                }`}>
                                                {studentRes.promotedOrDetained || studentRes.result || 'PUBLISHED'}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <span className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-400 text-[10px] font-bold uppercase border border-slate-100">
                                        No Result
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}

                {students.length === 0 && (
                    <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                            <Users className="h-8 w-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">No Students Found</h3>
                        <p className="text-slate-400 text-sm max-w-xs mx-auto">
                            It looks like there are no students assigned to your homeroom class ({user.grade}-{user.section}) yet.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

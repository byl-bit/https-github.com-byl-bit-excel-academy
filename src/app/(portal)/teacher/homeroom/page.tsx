'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileCheck, Users, Printer, AlertCircle } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { calculateGrade, calculateConduct } from '@/lib/utils/gradingLogic';
import { ResultTable } from '@/components/teacher/ResultTable';
import { normalizeGender } from '@/lib/utils';

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

    // Derive all subjects from the results for the table view
    const allSubjects = Array.from(new Set(results.flatMap(r => r.subjects?.map((s: any) => s.name) || []))).sort();

    const generateBulkReports = async () => {
        if (!results.length) {
            toast("There are no results to generate reports for.", "error");
            return;
        }

        try {
            const jsPDF = (await import('jspdf')).default;
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth(); // ~210mm

            // 1. Prepare Data: Sync latest student details and calculate Ranks
            // Filter to include only results that match current students (to ensure sync)
            const reportData = results
                .map(r => {
                    const studentProfile = students.find(s =>
                        String(s.id || s.student_id || s.studentId) === String(r.studentId) ||
                        String(s.name) === String(r.studentName)
                    );

                    if (!studentProfile) return r; // Fallback to existing result data

                    // Sync latest details
                    return {
                        ...r,
                        studentName: studentProfile.fullName || studentProfile.name, // Sync Name
                        studentId: studentProfile.studentId || studentProfile.student_id || r.studentId, // Sync ID
                        gender: normalizeGender(studentProfile.gender || studentProfile.sex), // Sync Gender
                        rollNumber: studentProfile.rollNumber || r.rollNumber,
                        grade: studentProfile.grade || r.grade,
                        section: studentProfile.section || r.section
                    };
                })
                .filter(r => r.status === 'published' || r.status === 'approved'); // Only final results

            // Sort by Average for Rank Calculation
            reportData.sort((a, b) => b.average - a.average);

            // Assign Ranks
            reportData.forEach((r, index) => {
                r.rank = index + 1;
            });

            // Re-sort by Roll Number or Name for printing order
            reportData.sort((a, b) => {
                const rollA = parseInt(String(a.rollNumber || '0'));
                const rollB = parseInt(String(b.rollNumber || '0'));
                if (rollA !== rollB) return rollA - rollB;
                return (a.studentName || '').localeCompare(b.studentName || '');
            });

            if (reportData.length === 0) {
                toast("No published results found for active students.", "error");
                return;
            }

            for (let i = 0; i < reportData.length; i++) {
                const result = reportData[i];
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
                doc.text("STUDENT PROFILE", 20, 60);

                doc.setFont("helvetica", "normal");
                doc.text(`Name: ${result.studentName || 'Student'}`, 20, 70);
                doc.text(`ID: ${result.studentId}`, 20, 80);
                doc.text(`Gender: ${result.gender || 'N/A'}`, 20, 90);

                doc.text(`Grade: ${result.grade}-${result.section}`, 120, 70);
                doc.text(`Roll No: ${result.rollNumber || '-'}`, 120, 80);
                doc.text(`Date: ${new Date().toLocaleDateString()}`, 120, 90);

                // --- Rank Badge ---
                doc.setFillColor(254, 243, 199); // Amber-100
                doc.setDrawColor(245, 158, 11); // Amber-500
                doc.roundedRect(pageWidth - 50, 55, 30, 25, 3, 3, 'FD');
                doc.setTextColor(180, 83, 9); // Amber-700
                doc.setFontSize(9);
                doc.text("CLASS RANK", pageWidth - 35, 62, { align: 'center' });
                doc.setFontSize(18);
                doc.setFont("helvetica", "bold");
                doc.text(`${result.rank}`, pageWidth - 35, 73, { align: 'center' });

                y = 110;

                // --- Results Table Header ---
                doc.setFillColor(239, 246, 255); // Blue-50
                doc.rect(15, y - 5, pageWidth - 30, 10, 'F');
                doc.setFont("helvetica", "bold");
                doc.setTextColor(37, 99, 235); // Blue-600
                doc.setFontSize(10);

                doc.text("SUBJECT", 20, y + 2);
                doc.text("MARKS / 100", 110, y + 2, { align: 'center' });
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
                doc.text(`Total Score: ${Number.isInteger(result.total) ? result.total : result.total.toFixed(1)}`, 20, y);
                doc.text(`Average: ${(result.average ?? 0).toFixed(1)}%`, 80, y);
                doc.text(`Conduct: ${calculateConduct(result.average ?? 0)}`, 140, y);

                y += 15;
                const isPass = result.promotedOrDetained === 'PROMOTED' || result.result === 'PASS';
                doc.setTextColor(isPass ? 22 : 220, isPass ? 163 : 38, isPass ? 74 : 38); // Green-600 or Red-600
                doc.text(`FINAL RESULT: ${result.promotedOrDetained || result.result}`, 20, y);

                // --- Footer ---
                const bottomY = doc.internal.pageSize.getHeight() - 30;
                doc.setFontSize(10);
                doc.setTextColor(148, 163, 184);
                doc.text("Generated via Excel Academy Admin Portal", pageWidth / 2, bottomY, { align: 'center' });
            }

            doc.save(`Report_Cards_Class_${user?.grade}-${user?.section}.pdf`);
            success(`Generated ${reportData.length} report cards successfully.`);

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
                    <span>Generate Report Cards</span>
                </Button>
            </div>

            {/* Table View of Results */}
            <div className="glass-panel rounded-2xl p-1">
                <ResultTable
                    students={students}
                    subjects={allSubjects}
                    classResults={results}
                    user={user}
                    onRefresh={() => { }} // Read only, no refresh needed really
                    isHomeroomView={true}
                />
            </div>
        </div>
    );
}

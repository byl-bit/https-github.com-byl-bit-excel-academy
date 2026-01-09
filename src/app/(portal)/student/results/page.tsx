'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/glass-card";
import { MOCK_RESULTS, MOCK_USERS, StudentResult, User } from "@/lib/mockData";
import { useAuth } from '@/contexts/AuthContext';
import { Download, AlertCircle, FileText, Award } from "lucide-react";
import { calculateGrade } from '@/lib/utils/gradingLogic';

export default function StudentResultsPage() {
    const { user } = useAuth();
    const [result, setResult] = useState<StudentResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reportCardEnabled, setReportCardEnabled] = useState(true);
    const [certificateEnabled, setCertificateEnabled] = useState(true);
    const [assessmentTypes, setAssessmentTypes] = useState<any[]>([]);

    // Track if initial fetch has been done to prevent double-fetching
    const hasFetchedRef = useRef(false);
    // Store user ID to detect actual user changes
    const userIdRef = useRef<string | null>(null);

    const fetchResult = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const [uRes, rRes, sRes] = await Promise.all([
                fetch('/api/users'),
                fetch('/api/results', { headers: { 'x-actor-role': 'student', 'x-actor-id': user.id } }),
                fetch('/api/settings')
            ]);

            const users: User[] = uRes.ok ? await uRes.json() : [];
            const storedResults = rRes.ok ? await rRes.json() : {};
            const settings = sRes.ok ? await sRes.json() : {};

            if (settings.reportCardDownload !== undefined) setReportCardEnabled(settings.reportCardDownload);
            if (settings.certificateDownload !== undefined) setCertificateEnabled(settings.certificateDownload);
            if (settings.assessmentTypes) setAssessmentTypes(settings.assessmentTypes);

            let student = users.find(s => s.studentId === user.studentId || s.id === user.id);
            if (!student) student = MOCK_USERS.find(s => s.studentId === user.studentId);

            if (!student) {
                setError('Student record not found.');
                return;
            }

            let res = storedResults[student.id];
            if (!res) {
                res = Object.values(storedResults).find((r: any) =>
                    r.studentId === student?.studentId ||
                    r.studentId === user.studentId ||
                    r.studentId === user.id
                ) || null;
            }

            if (res) {
                const approvedSubjects = ((res as any).subjects || []).map((s: any) => ({
                    ...s,
                    name: s.name || s.subject || '',
                    marks: Number(s.marks || 0),
                    status: s.status || 'published'
                }));

                const total = approvedSubjects.reduce((sum: number, s: any) => sum + (s.marks || 0), 0);
                const average = approvedSubjects.length > 0 ? total / approvedSubjects.length : 0;

                const normalized = {
                    ...res,
                    studentId: (res as any).student_id || (res as any).studentId || student.id,
                    studentName: (res as any).student_name || (res as any).studentName || '',
                    subjects: approvedSubjects,
                    total: Math.round(total * 10) / 10,
                    average: Math.round(average * 10) / 10
                } as unknown as StudentResult;
                setResult(normalized);
                setError('');
            } else {
                setError('No results available yet.');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load results.');
        } finally {
            setLoading(false);
        }
    }, [user?.id, user?.studentId]);

    // Initial fetch - only runs once when user becomes available
    useEffect(() => {
        const currentUserId = user?.id || null;

        if (user && !hasFetchedRef.current) {
            hasFetchedRef.current = true;
            userIdRef.current = currentUserId;
            fetchResult();
        } else if (!user) {
            setLoading(false);
        }
    }, [user, fetchResult]);

    const downloadPDF = async () => {
        if (!result || !user) return;
        const jsPDF = (await import('jspdf')).default;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header Background
        doc.setFillColor(30, 64, 175);
        doc.rect(0, 0, pageWidth, 40, 'F');

        // School Name & Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("EXCEL ACADEMY", pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text("Official Student Report Card", pageWidth / 2, 30, { align: 'center' });

        // Simple Logo Placeholder if needed, omitted logic for brevity/consistency
        doc.setFillColor(255, 255, 255);
        doc.circle(30, 20, 12, 'F');
        doc.setTextColor(30, 64, 175);
        doc.setFontSize(8);
        doc.text("LOGO", 30, 21, { align: 'center' });

        // Student Details Box
        doc.setTextColor(0, 0, 0);
        let y = 60;
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(15, 50, pageWidth - 30, 35, 3, 3, 'FD');

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("STUDENT DETAILS", 20, 60);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Name:`, 20, 70);
        doc.setFont("helvetica", "bold");
        doc.text(`${user.name || user.fullName}`, 40, 70);
        doc.setFont("helvetica", "normal");
        doc.text(`Student ID:`, 20, 78);
        doc.setFont("helvetica", "bold");
        doc.text(`${user.studentId}`, 40, 78);

        doc.setFont("helvetica", "normal");
        doc.text(`Grade/Section:`, 120, 70);
        doc.setFont("helvetica", "bold");
        doc.text(`${user.grade || 'N/A'} - ${user.section || 'N/A'}`, 150, 70);
        doc.setFont("helvetica", "normal");
        doc.text(`Date Issued:`, 120, 78);
        doc.setFont("helvetica", "bold");
        doc.text(`${new Date().toLocaleDateString()}`, 150, 78);

        y = 100;
        // Results Table Header
        doc.setFillColor(219, 234, 254); // Blue 100
        doc.rect(15, y - 5, pageWidth - 30, 10, 'F');
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 58, 138); // Blue 900
        doc.text("SUBJECT", 20, y + 2);

        const assessments = assessmentTypes || [];
        let xPos = 90;
        const colWidth = 30;
        if (assessments.length > 0) {
            assessments.forEach((a: any) => {
                doc.text(`${a.label} (${a.maxMarks})`, xPos, y + 2, { align: 'center' });
                xPos += colWidth;
            });
            doc.text("TOTAL", xPos, y + 2, { align: 'center' });
            xPos += colWidth;
            doc.text("GRADE", xPos, y + 2, { align: 'center' });
        } else {
            doc.text("MARKS", 110, y + 2, { align: 'center' });
            doc.text("GRADE", 150, y + 2, { align: 'center' });
        }

        y += 10;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);

        result.subjects.forEach((sub, index) => {
            if (index % 2 === 0) {
                doc.setFillColor(239, 246, 255); // Blue 50
                doc.rect(15, y - 6, pageWidth - 30, 10, 'F');
            }
            doc.text(`${sub.name}`, 20, y);

            if (assessments.length > 0) {
                let x = 90;
                assessments.forEach((a: any) => {
                    const val = sub.assessments && sub.assessments[a.id] !== undefined ? String(sub.assessments[a.id]) : '-';
                    doc.text(val, x, y, { align: 'center' });
                    x += colWidth;
                });
                doc.text(`${sub.marks}`, x, y, { align: 'center' });
                x += colWidth;
                const grade = calculateGrade(sub.marks);
                doc.text(`${grade}`, x, y, { align: 'center' });
            } else {
                doc.text(`${sub.marks.toString()}`, 110, y, { align: 'center' });
                const grade = calculateGrade(sub.marks);
                doc.text(`${grade}`, 150, y, { align: 'center' });
            }
            y += 10;
        });

        doc.setDrawColor(30, 64, 175);
        doc.setLineWidth(0.5);
        doc.line(15, y, pageWidth - 15, y);
        y += 15;

        // Summary
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        const summaryY = y;
        doc.text("Total Score:", 20, summaryY);
        doc.text(`${result.total}`, 50, summaryY);
        doc.text("Average:", 80, summaryY);
        doc.setTextColor(37, 99, 235);
        doc.text(`${result.average.toFixed(2)}%`, 105, summaryY);
        doc.setTextColor(0, 0, 0);
        doc.text("Result:", 140, summaryY);
        doc.setTextColor(30, 64, 175); // Blue
        doc.text(`${result.promotedOrDetained}`, 160, summaryY);
        doc.setTextColor(0, 0, 0);

        doc.save(`report_card_${user.studentId}.pdf`);
    };

    if (loading) return <div className="text-center py-12 text-blue-600">Loading results...</div>;

    return (
        <div className="space-y-6 animate-fade-in-up">
            <Card className="bg-white border-blue-100 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-2">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-50 p-3 rounded-xl hidden sm:block">
                            <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-blue-900">Academic Results</h2>
                            <p className="text-sm text-blue-500">View your exam performance and download report cards.</p>
                        </div>
                    </div>

                    {result && (
                        <div className="flex gap-2">
                            {reportCardEnabled ? (
                                <Button onClick={downloadPDF} className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 border-none font-bold">
                                    <Download className="mr-2 h-4 w-4" /> Download Report
                                </Button>
                            ) : null}
                            {certificateEnabled && result.average >= 90 && (
                                <Button onClick={async () => {
                                    if (!result || !user) return;
                                    const jsPDF = (await import('jspdf')).default;
                                    const doc = new jsPDF('l', 'mm', 'a4');
                                    const width = doc.internal.pageSize.getWidth();
                                    const height = doc.internal.pageSize.getHeight();

                                    doc.setDrawColor(200, 150, 50);
                                    doc.setLineWidth(2);
                                    doc.rect(10, 10, width - 20, height - 20);
                                    doc.setDrawColor(30, 64, 175);
                                    doc.setLineWidth(1);
                                    doc.rect(15, 15, width - 30, height - 30);

                                    doc.setTextColor(30, 64, 175);
                                    doc.setFontSize(30);
                                    doc.setFont("helvetica", "bold");
                                    doc.text("EXCEL ACADEMY", width / 2, 50, { align: 'center' });

                                    doc.setTextColor(0, 0, 0);
                                    doc.setFontSize(18);
                                    doc.setFont("helvetica", "normal");
                                    doc.text("Certificate of Achievement", width / 2, 70, { align: 'center' });

                                    doc.setFontSize(14);
                                    doc.text("This is to certify that", width / 2, 90, { align: 'center' });

                                    doc.setFontSize(24);
                                    doc.setFont("helvetica", "bold");
                                    doc.text((user.name || user.fullName || 'Student'), width / 2, 110, { align: 'center' });

                                    doc.setFontSize(14);
                                    doc.setFont("helvetica", "normal");
                                    doc.text(`has successfully completed Grade ${user.grade || ''} - Section ${user.section || ''}`, width / 2, 130, { align: 'center' });

                                    doc.text(`with a total score of ${result.total || 0} and average ${(result.average || 0).toFixed(1)}%`, width / 2, 145, { align: 'center' });

                                    doc.setFontSize(18);
                                    doc.setTextColor(30, 64, 175);
                                    doc.text(result.promotedOrDetained || "PROMOTED", width / 2, 165, { align: 'center' });

                                    doc.setTextColor(0, 0, 0);
                                    doc.setFontSize(12);
                                    doc.text("__________________", width / 4, 180, { align: 'center' });
                                    doc.text("Principal", width / 4, 190, { align: 'center' });

                                    doc.text("__________________", (width / 4) * 3, 180, { align: 'center' });
                                    doc.text("Class Teacher", (width / 4) * 3, 190, { align: 'center' });

                                    doc.save(`Certificate_${user.studentId}.pdf`);
                                }} className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200 border-none font-bold">
                                    <Award className="mr-2 h-4 w-4" /> Download Certificate
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </Card>

            {
                error ? (
                    <Card className="border-l-4 border-l-amber-400" >
                        <div className="flex flex-col items-center justify-center py-12 text-center text-blue-500">
                            <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
                            <p className="font-medium text-lg text-blue-900">{error}</p>
                        </div>
                    </Card>
                ) : result ? (
                    <Card className="border-t-4 border-t-blue-500">
                        <CardHeader
                            title="Annual Report Card"
                            icon={Award}
                            className="pb-6"
                        >
                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-100 text-blue-700 border border-blue-200`}>
                                {result.promotedOrDetained}
                            </span>
                        </CardHeader>

                        <div className="grid gap-6">
                            {/* Highlights */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div className="p-4 rounded-xl bg-white border-blue-100 shadow-sm">
                                    <p className="text-xs font-bold uppercase text-blue-400 mb-1">Total Score</p>
                                    <p className="text-3xl font-black text-blue-900">{result.total}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white border-blue-100 shadow-sm">
                                    <p className="text-xs font-bold uppercase text-blue-400 mb-1">Average</p>
                                    <p className="text-3xl font-black text-blue-600">{result.average.toFixed(1)}<span className="text-lg text-blue-400 ml-1">%</span></p>
                                </div>
                                <div className="p-4 rounded-xl bg-white border-blue-100 shadow-sm">
                                    <p className="text-xs font-bold uppercase text-indigo-400 mb-1">Class Rank</p>
                                    <p className="text-3xl font-black text-indigo-900">#{result.rank}</p>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="rounded-xl overflow-x-auto border border-blue-100 shadow-sm scrollbar-thin">
                                <table className="w-full text-sm text-left min-w-[600px] sm:min-w-full">
                                    <thead className="bg-blue-50/50 text-blue-900">
                                        <tr>
                                            <th className="px-6 py-4 font-bold">Subject</th>
                                            {assessmentTypes.length > 0 && assessmentTypes.map((type: any) => (
                                                <th key={type.id} className="px-4 py-4 font-bold text-center text-xs uppercase">
                                                    {type.label}
                                                    <span className="block text-[8px] opacity-60">({type.maxMarks})</span>
                                                </th>
                                            ))}
                                            <th className="px-6 py-4 font-bold text-right">Total Marks</th>
                                            <th className="px-6 py-4 font-bold text-right">Grade</th>
                                            <th className="px-6 py-4 font-bold text-right hidden sm:table-cell">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-blue-100 bg-white/50">
                                        {result.subjects.map((sub: any, idx) => {
                                            const grade = calculateGrade(sub.marks);
                                            const passed = sub.marks >= 35;
                                            return (
                                                <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-blue-900">{sub.name}</td>
                                                    {assessmentTypes.length > 0 && assessmentTypes.map((type: any) => {
                                                        const key = String(type.id);
                                                        const val = sub.assessments?.[key];
                                                        return (
                                                            <td key={type.id} className="px-4 py-4 text-center text-blue-500" title={val === undefined ? `Missing ${key}. Available: ${JSON.stringify(Object.keys(sub.assessments || {}))}` : ''}>
                                                                {val !== undefined && val !== null ? val : '-'}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="px-6 py-4 text-right font-bold text-blue-900">{sub.marks}</td>
                                                    <td className="px-6 py-4 text-right font-bold text-blue-600">
                                                        <span className={`inline-block w-8 text-center rounded ${['F'].includes(grade) ? 'text-red-400' : 'text-blue-600'}`}>
                                                            {grade}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right hidden sm:table-cell">
                                                        {passed ? (
                                                            <span className="text-blue-600/80 text-xs font-bold bg-blue-50 px-2 py-1 rounded-full border border-blue-100">PASS</span>
                                                        ) : (
                                                            <span className="text-red-400 text-xs font-bold bg-red-50 px-2 py-1 rounded-full border border-red-100">FAIL</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Remarks */}
                            <div className="flex items-center gap-3 text-sm text-blue-900 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <span className="font-bold text-blue-700 uppercase text-xs tracking-wider">Remarks</span>
                                <div className="h-4 w-px bg-blue-200"></div>
                                <span>{result.conduct}</span>
                            </div>
                        </div>
                    </Card>
                ) : null}
        </div >
    );
}

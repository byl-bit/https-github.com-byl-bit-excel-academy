'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Award, FileText, Send, UserCheck, AlertCircle } from "lucide-react";
import type { User, Subject, PublishedResult, PendingResult } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ManualEntryFormProps {
    students: User[];
    subjects: string[];
    publishedResults: PublishedResult[];
    pendingResults: PendingResult[];
    onPublish: (result: Record<string, unknown>) => void;
}

export function ManualEntryForm({
    students,
    subjects,
    publishedResults,
    pendingResults,
    onPublish
}: ManualEntryFormProps) {
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [marks, setMarks] = useState<Record<string, number>>({});
    const [conduct, setConduct] = useState('Satisfactory');
    const [decision, setDecision] = useState<'PROMOTED' | 'DETAINED'>('PROMOTED');
    const [isSaving, setIsSaving] = useState(false);

    // Auto-calculate average and decision
    const subArray = subjects.map(s => ({ name: s, marks: marks[s] || 0 }));
    const total = subArray.reduce((acc, s) => acc + s.marks, 0);
    const average = subjects.length > 0 ? total / subjects.length : 0;

    useEffect(() => {
        // Auto-set decision based on average (threshold 50%)
        if (average >= 50) setDecision('PROMOTED');
        else setDecision('DETAINED');
    }, [average]);

    // Load existing data if student is selected
    useEffect(() => {
        if (!selectedStudentId) {
            setMarks({});
            setConduct('Satisfactory');
            return;
        }

        const student = students.find(s => s.id === selectedStudentId);
        const sid = student?.studentId || student?.student_id;

        const existing = [...publishedResults, ...pendingResults].find(r =>
            r.studentId === sid || r.student_id === sid
        );

        if (existing) {
            const m: Record<string, number> = {};
            (existing.subjects || []).forEach(s => {
                m[s.name] = s.marks || 0;
            });
            setMarks(m);
            setConduct(existing.conduct || 'Satisfactory');
            setDecision((existing.promotedOrDetained || existing.promoted_or_detained || 'PROMOTED') as any);
        } else {
            setMarks({});
            setConduct('Satisfactory');
        }
    }, [selectedStudentId, students, publishedResults, pendingResults]);

    const handleMarkChange = (sub: string, val: string) => {
        const num = parseFloat(val);
        if (isNaN(num)) {
            setMarks(prev => {
                const n = { ...prev };
                delete n[sub];
                return n;
            });
            return;
        }
        setMarks(prev => ({ ...prev, [sub]: Math.min(100, Math.max(0, num)) }));
    };

    const handleSave = async () => {
        if (!selectedStudentId) return;
        setIsSaving(true);

        const student = students.find(s => s.id === selectedStudentId);
        const sid = student?.studentId || student?.student_id || selectedStudentId;

        const resultData = {
            studentId: sid,
            studentName: student?.name || student?.fullName || 'Unknown Student',
            grade: String(student?.grade || ''),
            section: String(student?.section || ''),
            gender: student?.gender || student?.sex || '',
            rollNumber: student?.rollNumber || (student as any).roll_number || '',
            subjects: subjects.map(s => ({
                name: s,
                marks: marks[s] || 0,
                status: 'published'
            })),
            total,
            average,
            conduct,
            status: 'published',
            promotedOrDetained: decision
        };

        try {
            await onPublish({ [sid]: resultData });
            setSelectedStudentId('');
            setMarks({});
        } finally {
            setIsSaving(false);
        }
    };

    const [filterGrade, setFilterGrade] = useState('');
    const [filterSection, setFilterSection] = useState('');

    const grades = Array.from(new Set(students.map(s => String(s.grade || '')))).sort();
    const sections = Array.from(new Set(students.map(s => String(s.section || '')))).sort();

    const filteredStudents = students.filter(s => {
        const matchesGrade = !filterGrade || String(s.grade) === filterGrade;
        const matchesSection = !filterSection || String(s.section) === filterSection;
        return matchesGrade && matchesSection;
    });

    return (
        <Card className="border-none shadow-xl glass-panel bg-linear-to-br from-white to-slate-50/50 overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                        <FileText className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-black text-slate-800">Manual Entry Terminal</CardTitle>
                        <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Direct verification and publishing of academic records.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade Filter</Label>
                        <select
                            className="w-full h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none cursor-pointer transition-all hover:border-indigo-300"
                            value={filterGrade}
                            onChange={e => setFilterGrade(e.target.value)}
                        >
                            <option value="">All Grades</option>
                            {grades.map(g => <option key={g} value={g}>Grade {g}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Section Filter</Label>
                        <select
                            className="w-full h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none cursor-pointer transition-all hover:border-indigo-300"
                            value={filterSection}
                            onChange={e => setFilterSection(e.target.value)}
                        >
                            <option value="">All Sections</option>
                            {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Student Selection</Label>
                        <select
                            className="w-full h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none cursor-pointer transition-all hover:border-indigo-300"
                            value={selectedStudentId}
                            onChange={e => setSelectedStudentId(e.target.value)}
                        >
                            <option value="">Search Student...</option>
                            {filteredStudents.sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(s => (
                                <option key={s.id} value={s.id}>{s.name} - {s.studentId || (s as any).student_id || 'No ID'}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conduct Grade</Label>
                        <select
                            className="w-full h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none cursor-pointer transition-all hover:border-indigo-300"
                            value={conduct}
                            onChange={e => setConduct(e.target.value)}
                        >
                            <option value="Excellent">Excellent</option>
                            <option value="Very Good">Very Good</option>
                            <option value="Good">Good</option>
                            <option value="Satisfactory">Satisfactory</option>
                            <option value="Needs Improvement">Needs Improvement</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Decision</Label>
                        <select
                            className={cn(
                                "w-full h-12 rounded-2xl border px-4 text-sm font-black outline-none cursor-pointer transition-all",
                                decision === 'PROMOTED'
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:border-emerald-300"
                                    : "bg-red-50 text-red-700 border-red-100 hover:border-red-300"
                            )}
                            value={decision}
                            onChange={e => setDecision(e.target.value as any)}
                        >
                            <option value="PROMOTED">PROMOTED</option>
                            <option value="DETAINED">DETAINED</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Award className="h-4 w-4 text-indigo-400" />
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score Breakdown</h4>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {subjects.map(sub => (
                            <div key={sub} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs hover:border-indigo-100 transition-all group">
                                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-tight block mb-2 transition-colors group-hover:text-indigo-600 truncate">{sub}</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={marks[sub] ?? ''}
                                    onChange={e => handleMarkChange(sub, e.target.value)}
                                    placeholder="0"
                                    className="h-10 text-center font-black text-lg border-none bg-slate-50 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-8">
                        <div className="text-center md:text-left">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Score</p>
                            <p className="text-3xl font-black text-slate-900">{total.toFixed(0)}</p>
                        </div>
                        <div className="h-10 w-px bg-slate-100" />
                        <div className="text-center md:text-left">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Average</p>
                            <p className={cn(
                                "text-3xl font-black transition-colors",
                                average >= 50 ? "text-emerald-600" : "text-red-500"
                            )}>
                                {average.toFixed(1)}%
                            </p>
                        </div>
                    </div>

                    <Button
                        size="lg"
                        className="w-full md:w-auto min-w-[240px] h-14 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-slate-200 transition-all transform hover:scale-[1.02] active:scale-95 text-lg group"
                        disabled={!selectedStudentId || isSaving}
                        onClick={handleSave}
                    >
                        {isSaving ? "Publishing..." : "Commit & Publish Result"}
                        <Send className="h-5 w-5 ml-3 opacity-50 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Button>
                </div>

                {!selectedStudentId && (
                    <div className="flex items-center gap-2 justify-center p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-700 text-xs font-bold">
                        <AlertCircle className="h-4 w-4" />
                        Select a student above to start recording marks.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

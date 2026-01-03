'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResultTable } from '@/components/teacher/ResultTable';
import { Loader2 } from 'lucide-react';
import type { SubjectAllocation } from '@/lib/mockData';

export default function SubjectPortalPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [allocations, setAllocations] = useState<SubjectAllocation[]>([]);
    const [selectedAllocationId, setSelectedAllocationId] = useState<string>('');
    const [students, setStudents] = useState<any[]>([]);
    const [classResults, setClassResults] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>({});

    const currentAllocation = allocations.find(a => a.id === selectedAllocationId);

    // 1. Fetch Allocations
    useEffect(() => {
        if (!user) return;
        const fetchInitialData = async () => {
            try {
                const [allocRes, settingsRes] = await Promise.all([
                    fetch('/api/allocations'),
                    fetch('/api/settings')
                ]);

                const allAllocations = allocRes.ok ? await allocRes.json() : [];
                if (settingsRes.ok) setSettings(await settingsRes.json());

                const myAllocations = allAllocations.filter((a: any) => {
                    const tId = String(a.teacherId || a.teacher_id).toLowerCase();
                    const uId = String(user.id).toLowerCase();
                    const uTId = String(user.teacherId || '').toLowerCase();
                    const uName = String(user.name || user.fullName || '').toLowerCase();
                    const tName = String(a.teacherName || a.teacher_name || '').toLowerCase();

                    return (tId && (tId === uId || tId === uTId)) ||
                        (!tId && tName && uName && tName === uName);
                });

                setAllocations(myAllocations);
                if (myAllocations.length > 0) {
                    setSelectedAllocationId(myAllocations[0].id);
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchInitialData();
    }, [user]);

    // 2. Load Class Data (Students & Results) when allocation changes
    const loadClassData = useCallback(async () => {
        if (!user || !currentAllocation) return;

        setLoading(true);
        try {
            const grade = currentAllocation.grade;
            const section = currentAllocation.section;

            const [usersRes, resultsRes] = await Promise.all([
                fetch(`/api/users?role=student&grade=${grade}&section=${section}`),
                fetch(`/api/results?grade=${grade}&section=${section}`, {
                    headers: { 'x-actor-role': 'teacher', 'x-actor-id': user.id }
                })
            ]);

            if (usersRes.ok) {
                const classStudents = await usersRes.json();
                const activeStudents = classStudents.filter((u: any) => u.status === 'active');
                activeStudents.sort((a: any, b: any) => {
                    const nameA = (a.name || a.fullName || '').toLowerCase();
                    const nameB = (b.name || b.fullName || '').toLowerCase();
                    return nameA.localeCompare(nameB);
                });
                setStudents(activeStudents);
            }

            if (resultsRes.ok) {
                const data = await resultsRes.json();
                const published = data.published || {};
                const pending = data.pending || {};
                const arr = [] as any[];

                Object.keys(published).forEach(k => {
                    const r = published[k];
                    arr.push({ id: k, studentId: r.student_id || k, ...r, status: 'published' });
                });
                Object.keys(pending).forEach(k => {
                    const r = pending[k];
                    arr.push({ id: k, studentId: r.student_id || k, ...r, status: 'pending' });
                });
                setClassResults(arr);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user, currentAllocation]);

    useEffect(() => {
        if (currentAllocation) {
            loadClassData();
        } else if (allocations.length > 0 === false) {
            setLoading(false);
        }
    }, [loadClassData, currentAllocation, allocations.length]);


    if (loading && !currentAllocation && allocations.length === 0) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    if (allocations.length === 0) {
        return (
            <div className="text-center py-12">
                <p>No subjects allocated.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header / Selector */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-black text-blue-950">Subject Portal</h2>
                <div className="w-full sm:w-auto">
                    <Select value={selectedAllocationId} onValueChange={setSelectedAllocationId}>
                        <SelectTrigger className="w-full sm:w-[300px] h-11 rounded-xl border-blue-200 bg-white font-bold text-blue-900 shadow-sm">
                            <SelectValue placeholder="Select Class..." />
                        </SelectTrigger>
                        <SelectContent>
                            {allocations.map(a => (
                                <SelectItem key={a.id} value={a.id} className="font-medium">
                                    {a.grade}-{a.section} • {a.subject}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {currentAllocation && (
                <>
                    <Card className="bg-linear-to-br from-blue-50 to-white border-blue-100 p-6 hidden sm:block">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black text-blue-950">{currentAllocation.subject}</h2>
                                <p className="text-blue-500 font-medium mt-1">
                                    Class {currentAllocation.grade}-{currentAllocation.section} • {new Date().getFullYear()}-{new Date().getFullYear() + 1} Academic Year
                                </p>
                            </div>
                        </div>
                    </Card>

                    <ResultTable
                        students={students}
                        subjects={[currentAllocation.subject]}
                        classResults={classResults}
                        user={user}
                        onRefresh={loadClassData}
                        settings={settings}
                    />
                </>
            )}
        </div>
    );
}

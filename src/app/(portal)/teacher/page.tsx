'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { TeacherOverview } from '@/components/teacher/TeacherDashboard';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function TeacherPage() {
    // Ensure role is teacher
    const { user } = useRequireAuth(['teacher']) as any;

    const [loading, setLoading] = useState(true);
    const [allocations, setAllocations] = useState<any[]>([]);
    const [currentAllocation, setCurrentAllocation] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [classResults, setClassResults] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>({});

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Parallelize initial fetches
                const [allocRes, settingsRes] = await Promise.all([
                    fetch('/api/allocations'),
                    fetch('/api/settings')
                ]);

                const allAllocations = allocRes.ok ? await allocRes.json() : [];
                if (settingsRes.ok) setSettings(await settingsRes.json());

                // Filter allocations for current user
                const myAllocations = allAllocations.filter((a: any) => {
                    const tId = String(a.teacherId || a.teacher_id).toLowerCase();
                    const uId = String(user.id).toLowerCase();
                    const uTId = String(user.teacherId || '').toLowerCase();
                    const uName = String(user.name || user.fullName || '').toLowerCase();
                    const tName = String(a.teacherName || a.teacher_name || '').toLowerCase();

                    return (tId && (tId === uId || tId === uTId)) ||
                        (!tId && tName && uName && (tName.includes(uName) || uName.includes(tName)));
                });
                setAllocations(myAllocations);

                // Determine "Primary" context for the dashboard welcome screen
                // Homeroom takes precedence, then first subject allocation
                const isHomeroomTeacher = !!user.grade && !!user.section;
                const contextGrade = isHomeroomTeacher ? user.grade : myAllocations[0]?.grade;
                const contextSection = isHomeroomTeacher ? user.section : myAllocations[0]?.section;

                const activeAlloc = isHomeroomTeacher
                    ? { ...myAllocations[0], grade: user.grade, section: user.section, type: 'homeroom', subject: 'Homeroom' }
                    : myAllocations[0];

                setCurrentAllocation(activeAlloc);

                if (contextGrade && contextSection) {
                    // Fetch data for the primary context (Dashboard Stats)
                    const [usersRes, resRes] = await Promise.all([
                        fetch(`/api/users?role=student&grade=${contextGrade}&section=${contextSection}&status=active`),
                        fetch(`/api/results?grade=${contextGrade}&section=${contextSection}`, {
                            headers: { 'x-actor-role': 'teacher', 'x-actor-id': user.id }
                        })
                    ]);

                    if (usersRes.ok) {
                        const classStudents = await usersRes.json();
                        // Sort A-Z by name
                        const sortedStudents = [...classStudents].sort((a: any, b: any) => {
                            const nameA = (a.name || a.fullName || '').toLowerCase();
                            const nameB = (b.name || b.fullName || '').toLowerCase();
                            return nameA.localeCompare(nameB);
                        });
                        setStudents(sortedStudents);
                    }

                    if (resRes.ok) {
                        const data = await resRes.json();
                        const published = data.published || {};
                        const pending = data.pending || {};
                        const arr = [] as any[];

                        Object.keys(published).forEach(k => {
                            const r = published[k];
                            arr.push({ id: k, ...r, status: 'published' });
                        });
                        Object.keys(pending).forEach(k => {
                            const r = pending[k];
                            arr.push({ id: k, ...r, status: 'pending' });
                        });
                        setClassResults(arr);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    const hasResponsibility = (allocations.length > 0) || (!!user.grade && !!user.section);

    if (!hasResponsibility) {
        return (
            <Card className="text-center py-16 flex flex-col items-center justify-center border-dashed border-2 border-slate-200 bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900">No Assignments Yet</h3>
                <p className="text-slate-500 max-w-sm mt-2">
                    Contact the administrator to be assigned as a Homeroom Teacher or given Subject Allocations.
                </p>
            </Card>
        );
    }

    return (
        <TeacherOverview
            user={user}
            students={students}
            classResults={classResults}
            onExport={() => { }}
            onImportClick={() => { }}
            settings={settings}
        />
    );
}

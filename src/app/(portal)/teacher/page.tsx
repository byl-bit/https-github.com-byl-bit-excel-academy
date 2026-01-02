'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TeacherDashboard } from '@/components/teacher/TeacherDashboard';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function TeacherPage() {
    const { user } = useAuth();
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
                        (!tId && tName && uName && tName === uName);
                });
                setAllocations(myAllocations);

                const isHomeroomTeacher = !!user.grade && !!user.section;
                const contextGrade = isHomeroomTeacher ? user.grade : myAllocations[0]?.grade;
                const contextSection = isHomeroomTeacher ? user.section : myAllocations[0]?.section;

                const activeAlloc = isHomeroomTeacher
                    ? myAllocations.find((a: any) => String(a.grade) === String(user.grade) && String(a.section) === String(user.section)) || myAllocations[0]
                    : myAllocations[0];

                setCurrentAllocation(activeAlloc);

                if (contextGrade && contextSection) {
                    // Parallelize students and results fetching with server-side filters
                    const [usersRes, resRes] = await Promise.all([
                        fetch(`/api/users?role=student&grade=${contextGrade}&section=${contextSection}`),
                        fetch(`/api/results?grade=${contextGrade}&section=${contextSection}`, {
                            headers: { 'x-actor-role': 'teacher', 'x-actor-id': user.id }
                        })
                    ]);

                    if (usersRes.ok) {
                        const classStudents = await usersRes.json();
                        setStudents(classStudents.filter((u: any) => u.status === 'active'));
                    }

                    if (resRes.ok) {
                        const data = await resRes.json();
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
            <Card className="text-center py-16 flex flex-col items-center justify-center border-dashed border-2 border-blue-200 bg-blue-50/30">
                <h3 className="text-xl font-bold text-blue-900">No Assignments Yet</h3>
                <p className="text-blue-500 max-w-sm mt-2">Contact the administrator to be assigned as a Homeroom Teacher or given Subject Allocations.</p>
            </Card>
        );
    }

    return (
        <TeacherDashboard
            user={user}
            students={students}
            classResults={classResults}
            onExport={() => { }}
            onImportClick={() => { }}
            settings={settings}
        />
    );
}

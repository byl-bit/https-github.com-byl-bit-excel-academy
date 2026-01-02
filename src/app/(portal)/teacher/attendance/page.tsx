'use client';

import { useEffect, useState } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { AttendanceManager } from '@/components/teacher/AttendanceManager';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function AttendancePage() {
    const { user } = useRequireAuth(['teacher']) as any;
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<any[]>([]);

    useEffect(() => {
        if (!user) return;

        if (!user.grade || !user.section) {
            setLoading(false);
            return;
        }

        const fetchStudents = async () => {
            try {
                // Fetch only active students in this class
                const usersRes = await fetch(`/api/users?role=student&grade=${user.grade}&section=${user.section}&status=active`);
                if (usersRes.ok) {
                    const classStudents = await usersRes.json();
                    setStudents(classStudents);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [user]);

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 text-blue-600 animate-spin" /></div>;

    if (user && (!user.grade || !user.section)) {
        return (
            <div className="p-8">
                <Card className="text-center py-12 flex flex-col items-center justify-center border-dashed border-2 border-slate-200 bg-slate-50/50">
                    <h3 className="text-xl font-bold text-slate-900">Attendance Unavailable</h3>
                    <p className="text-slate-500 max-w-sm mt-2">
                        You must be a Homeroom Teacher (assigned Grade & Section) to manage attendance.
                    </p>
                </Card>
            </div>
        );
    }

    return <AttendanceManager user={user} students={students} />;
}

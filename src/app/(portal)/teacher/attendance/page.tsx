'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AttendanceManager } from '@/components/teacher/AttendanceManager';
import { Loader2 } from 'lucide-react';

export default function AttendancePage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<any[]>([]);

    useEffect(() => {
        if (!user || !user.grade || !user.section) {
            setLoading(false);
            return;
        }

        const fetchStudents = async () => {
            try {
                const usersRes = await fetch('/api/users');
                if (usersRes.ok) {
                    const allUsers = await usersRes.json();
                    const classStudents = allUsers.filter((u: any) =>
                        u.role === 'student' &&
                        String(u.grade) === String(user.grade) &&
                        String(u.section) === String(user.section) &&
                        u.status === 'active'
                    );
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

    return <AttendanceManager user={user} students={students} />;
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Check, X, Save, UserCheck, UserX, Loader2, CalendarCheck, Info, Users } from "lucide-react";
import { cn, normalizeGender } from "@/lib/utils";
import { CardContent } from "@/components/ui/card";

interface AttendanceManagerProps {
    user: any;
    students: any[];
}

export function AttendanceManager({ user, students }: AttendanceManagerProps) {
    const [date, setDate] = useState<Date>(new Date());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [attendance, setAttendance] = useState<string[]>([]); // Array of PRESENT student IDs
    const [hasRecord, setHasRecord] = useState(false); // If record already exists for this day

    // Fetch attendance for selected date
    useEffect(() => {
        const fetchAttendance = async () => {
            if (!user.grade || !user.section) return;
            setLoading(true);
            try {
                const dateStr = date.toISOString().split('T')[0];
                const res = await fetch(`/api/attendance?date=${dateStr}&grade=${user.grade}&section=${user.section}`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setAttendance(data.map((r: any) => r.student_id || r.id));
                        setHasRecord(true);
                    } else {
                        // Default to ALL PRESENT if no record
                        setAttendance(students.map(s => s.student_id || s.id));
                        setHasRecord(false);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [date, user, students]);

    const toggleStatus = (studentId: string) => {
        setAttendance(prev => {
            if (prev.includes(studentId)) {
                return prev.filter(id => id !== studentId); // Mark Absent
            } else {
                return [...prev, studentId]; // Mark Present
            }
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const dateStr = date.toISOString().split('T')[0];
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: dateStr,
                    grade: user.grade,
                    section: user.section,
                    presentStudentIds: attendance,
                    teacherId: user.id
                })
            });

            if (res.ok) {
                setHasRecord(true);
                // Optional toast here
            } else {
                alert('Failed to save');
            }
        } catch (e) {
            console.error(e);
            alert('Error saving');
        } finally {
            setSaving(false);
        }
    };

    const presentCount = attendance.length;
    const absentCount = students.length - attendance.length;

    if (!user.grade || !user.section) {
        return (
            <Card className="text-center py-12 flex flex-col items-center justify-center border-dashed border-2 border-slate-200 bg-slate-50/50">
                <Info className="h-12 w-12 text-blue-300 mb-4" />
                <h3 className="text-lg font-bold text-blue-900">Attendance Unavailable</h3>
                <p className="text-blue-500 max-w-sm mt-2 text-sm">
                    You must be assigned a Home Room (Grade/Section) to take attendance.
                </p>
            </Card>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <Card className="bg-linear-to-br from-blue-50 to-white border-blue-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-100 p-3 rounded-xl">
                            <CalendarCheck className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-blue-950">Daily Attendance</h2>
                            <p className="text-blue-500 font-medium text-sm">
                                Manage records for Class {user.grade}-{user.section}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-blue-100 shadow-xs">
                        <div className="relative">
                            <input
                                type="date"
                                className="h-9 rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-1 text-sm text-blue-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                value={date ? date.toISOString().split('T')[0] : ''}
                                onChange={(e) => setDate(e.target.value ? new Date(e.target.value) : new Date())}
                            />
                        </div>

                        <Button
                            onClick={handleSave}
                            disabled={saving || loading}
                            className={cn(
                                "h-9 font-bold shadow-sm transition-all",
                                hasRecord ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            )}
                        >
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {hasRecord ? 'Update Record' : 'Save New Record'}
                        </Button>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    <Card className="p-0 overflow-hidden">
                        <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between">
                            <h3 className="font-bold text-blue-900 flex items-center gap-2">
                                <Users className="h-4 w-4 text-blue-500" />
                                Student List
                            </h3>
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                                {date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="py-12 flex flex-col items-center justify-center text-blue-400 animate-pulse">
                                    <Loader2 className="h-8 w-8 mb-2 animate-spin text-blue-300" />
                                    <p className="text-sm font-medium">Loading roster...</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-blue-50">
                                    {/* Header Row */}
                                    <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-black uppercase text-blue-400 tracking-wider bg-blue-50/30">
                                        <div className="col-span-1">Roll</div>
                                        <div className="col-span-2">ID</div>
                                        <div className="col-span-4">Student Name</div>
                                        <div className="col-span-2 text-center">Gender</div>
                                        <div className="col-span-3 text-right">Status</div>
                                    </div>

                                    {students.length === 0 ? (
                                        <div className="py-12 text-center text-blue-400">
                                            <p className="font-bold">No students found for this class.</p>
                                            <p className="text-xs">Students must be active and correctly assigned to this Grade and Section.</p>
                                        </div>
                                    ) : (
                                        [...students].sort((a, b) => (a.fullName || a.name || '').localeCompare(b.fullName || b.name || '')).map(student => {
                                            const sid = student.student_id || student.id;
                                            const isPresent = attendance.includes(sid);
                                            return (
                                                <div
                                                    key={sid}
                                                    onClick={() => toggleStatus(sid)}
                                                    className={cn(
                                                        "grid grid-cols-12 gap-4 items-center px-4 py-3 cursor-pointer transition-all hover:bg-blue-50/50 group",
                                                        !isPresent && "bg-rose-50/30 hover:bg-rose-50/50"
                                                    )}
                                                >
                                                    <div className="col-span-1 font-bold text-xs text-blue-600">
                                                        {student.rollNumber || '--'}
                                                    </div>
                                                    <div className="col-span-2 font-mono text-[10px] text-blue-400 font-bold group-hover:text-blue-600 transition-colors">
                                                        {student.studentId || student.student_id || 'ID'}
                                                    </div>
                                                    <div className="col-span-4 font-bold text-sm text-blue-900 truncate">
                                                        {student.fullName || student.name}
                                                    </div>
                                                    <div className="col-span-2 text-center text-[10px] font-black text-slate-400">
                                                        {normalizeGender(student.gender || student.sex) || '-'}
                                                    </div>
                                                    <div className="col-span-3 flex justify-end">
                                                        <div className={cn(
                                                            "px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 transition-all w-24 justify-center shadow-xs border",
                                                            isPresent
                                                                ? "bg-emerald-100/50 text-emerald-700 border-emerald-200"
                                                                : "bg-rose-100/50 text-rose-700 border-rose-200"
                                                        )}>
                                                            {isPresent ? (
                                                                <>
                                                                    <UserCheck className="h-3 w-3" />
                                                                    PRESENT
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <UserX className="h-3 w-3" />
                                                                    ABSENT
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader className="p-4 pb-2">
                            <h3 className="text-lg font-black text-blue-900 flex items-center gap-2">
                                <Info className="h-5 w-5 text-blue-600" />
                                Daily Summary
                            </h3>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-2">
                            <div className="flex justify-between items-center p-4 bg-emerald-50 border border-emerald-100 text-emerald-900 rounded-xl shadow-xs">
                                <span className="font-bold flex items-center gap-2 text-sm">
                                    <div className="bg-white p-1 rounded-full">
                                        <Check className="h-3 w-3 text-emerald-600" />
                                    </div>
                                    Present
                                </span>
                                <span className="text-2xl font-black">{presentCount}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-rose-50 border border-rose-100 text-rose-900 rounded-xl shadow-xs">
                                <span className="font-bold flex items-center gap-2 text-sm">
                                    <div className="bg-white p-1 rounded-full">
                                        <X className="h-3 w-3 text-rose-600" />
                                    </div>
                                    Absent
                                </span>
                                <span className="text-2xl font-black">{absentCount}</span>
                            </div>

                            <div className="pt-4 border-t border-blue-100 mt-2">
                                <div className="flex justify-between text-sm items-end">
                                    <span className="text-blue-500 font-medium">Attendance Rate</span>
                                    <span className={`text-xl font-black ${presentCount === students.length ? 'text-emerald-500' : 'text-blue-600'}`}>
                                        {students.length > 0
                                            ? Math.round((presentCount / students.length) * 100)
                                            : 0}%
                                    </span>
                                </div>
                                <div className="w-full bg-blue-100 h-2 rounded-full mt-2 overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                        style={{ width: `${students.length > 0 ? (presentCount / students.length) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

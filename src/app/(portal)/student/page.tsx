'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardHeader } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { FileText, User, Calendar, BookOpen, Bell, TrendingUp, Award, Clock, GraduationCap, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { AnnouncementList } from '@/components/AnnouncementList';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

export default function StudentDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [academicSummary, setAcademicSummary] = useState<any>(null);
    const [attendanceCount, setAttendanceCount] = useState(0);
    const [maintenanceMode, setMaintenanceMode] = useState(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('excel_academy_maintenance') === 'true';
        return false;
    });

    if (!user) return null;

    const fetchData = async () => {
        if (!user) return;
        try {
            // Parallelize requests and use specific student filters
            const [resRes, attRes] = await Promise.all([
                fetch(`/api/results?studentId=${user.id}`, {
                    headers: { 'x-actor-role': 'student', 'x-actor-id': user.id }
                }),
                fetch(`/api/attendance?studentId=${user.id}`)
            ]);

            if (resRes.ok) {
                const data = await resRes.json();
                // API now returns specific result for studentId if provided
                let summary = data[user.id];
                if (!summary) {
                    summary = Object.values(data).find((r: any) =>
                        r.studentId === user.studentId ||
                        r.studentId === user.id
                    );
                }
                if (summary) setAcademicSummary(summary);
            }

            if (attRes.ok) {
                const data = await attRes.json();
                setAttendanceCount(data.length);
            }
        } catch (e) {
            console.error("Failed to fetch dashboard data");
        }
    };

    useEffect(() => {
        fetchData();

        // Listen for global sync from Navbar
        const syncHandler = () => fetchData();
        window.addEventListener('systemSync', syncHandler);
        return () => window.removeEventListener('systemSync', syncHandler);
    }, [user]);

    useAutoRefresh(fetchData, {
        enabled: !!user,
        interval: 30000,
        refreshOnFocus: true,
        refreshOnMount: false
    });

    return (
        <div className="space-y-8 pb-10 animate-fade-in">
            {/* Hero Section */}
            <div className="glass-panel overflow-hidden rounded-4xl shadow-sm relative group">
                <div className="absolute inset-0 bg-linear-to-br from-blue-600/5 via-transparent to-indigo-600/5 opacity-50"></div>
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-400 blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-400 blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity"></div>

                <div className="relative z-10 p-8 sm:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                    <div className="relative">
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-4xl border-4 border-white shadow-xl overflow-hidden bg-slate-100 group-hover:scale-105 transition-transform duration-500">
                            {user.photo ? (
                                <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-slate-100 to-slate-200">
                                    <User className="h-12 w-12 text-slate-300" />
                                </div>
                            )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-6 h-6 rounded-xl border-4 border-white shadow-lg animate-pulse" title="Account Verified"></div>
                    </div>

                    <div className="text-center md:text-left flex-1 space-y-4">
                        <div className="space-y-1">
                            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-800">
                                Welcome, <span className="text-blue-600">{user.name?.split(' ')[0]}</span>
                            </h1>
                            <p className="text-slate-500 text-lg font-bold flex items-center justify-center md:justify-start gap-2">
                                <GraduationCap className="h-5 w-5 text-blue-500" />
                                {user.fullName} • Grade {user.grade}-{user.section}
                            </p>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                            <div className="glass-panel bg-white/40 px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest border-white/50 flex items-center gap-3 text-slate-600 shadow-xs">
                                <Award className="h-4 w-4 text-amber-500" /> ID: {user.studentId}
                            </div>
                            <div className="glass-panel bg-white/40 px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest border-white/50 flex items-center gap-3 text-slate-600 shadow-xs">
                                <Clock className="h-4 w-4 text-blue-500" /> Term 2024-25
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {/* Academic Performance Card */}
                <Card className="lg:col-span-2 relative overflow-hidden group border-none shadow-sm h-full bg-white/40">
                    <CardHeader
                        title="Academic Summary"
                        description="Performance Overview"
                        icon={TrendingUp}
                        className="flex justify-between items-center"
                    >
                        <Button variant="ghost" size="sm" asChild className="rounded-xl text-blue-600 font-black text-[10px] uppercase tracking-widest hover:bg-blue-50">
                            <Link href="/student/results">Full Transcript <ArrowRight className="ml-2 h-3 w-3" /></Link>
                        </Button>
                    </CardHeader>

                    <div className="p-1">
                        <Link href="/student/results" className="block cursor-pointer group/card">
                            {academicSummary ? (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center p-4">
                                    <div className="sm:col-span-1 flex flex-col items-center justify-center p-8 bg-blue-600 rounded-4xl shadow-xl shadow-blue-200 group-hover/card:scale-105 transition-transform duration-500">
                                        <div className="text-6xl font-black text-white mb-1 leading-none">{academicSummary.average.toFixed(0)}<span className="text-2xl opacity-60">%</span></div>
                                        <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Global Avg</p>
                                    </div>
                                    <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                                        <div className="p-6 glass-panel bg-white/60 rounded-2xl shadow-xs group-hover/card:bg-white transition-colors">
                                            <div className="text-3xl font-black text-slate-800 mb-1">#{academicSummary.rank}</div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Class Position</p>
                                        </div>
                                        <div className="p-6 glass-panel bg-white/60 rounded-2xl shadow-xs group-hover/card:bg-white transition-colors">
                                            <div className="text-3xl font-black text-slate-800 mb-1">{academicSummary.total}</div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Points Earned</p>
                                        </div>
                                        <div className="col-span-2 p-5 glass-panel bg-emerald-50 border-emerald-100/50 rounded-2xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                                                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                                                </div>
                                                <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">Final Status</span>
                                            </div>
                                            <span className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-emerald-600 text-white shadow-lg shadow-emerald-100">
                                                {academicSummary.promotedOrDetained}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center group-hover/card:bg-slate-50/50 transition-colors rounded-3xl">
                                    <div className="h-20 w-20 bg-slate-50 rounded-4xl flex items-center justify-center mb-6 group-hover/card:bg-white shadow-sm transition-colors">
                                        <FileText className="h-10 w-10 text-slate-300" />
                                    </div>
                                    <h4 className="text-xl font-black text-slate-800 mb-2">No results found</h4>
                                    <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto">Your evaluations are currently being processed by the administration.</p>
                                    <div className="mt-6 text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                        Check Grade Details <ArrowRight className="h-3 w-3" />
                                    </div>
                                </div>
                            )}
                        </Link>
                    </div>
                </Card>

                {/* Quick Stats / Attendance */}
                <Card className="h-full border-none shadow-sm bg-white/40">
                    <CardHeader title="Engagement" description="Total Attendance" icon={Calendar} />
                    <div className="flex flex-col items-center justify-center py-4">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full group-hover:bg-blue-500/20 transition-all"></div>
                            <svg className="w-40 h-40 transform -rotate-90 relative z-10 transition-transform duration-1000 group-hover:rotate-0">
                                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * 0.92)} className="text-blue-600 shadow-xl" strokeLinecap="round" />
                            </svg>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-20">
                                <span className="text-5xl font-black text-slate-800 leading-none">{attendanceCount}</span>
                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Sessions</span>
                            </div>
                        </div>
                        <div className="mt-8 px-6 py-3 rounded-2xl bg-white shadow-sm border border-slate-100">
                            <p className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp className="h-3 w-3 text-emerald-500" /> Excellent tracking
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Quick Links Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'My Identity', icon: User, href: '/student/profile', color: 'text-blue-600', bg: 'bg-blue-100' },
                    { label: 'Evaluation', icon: FileText, href: '/student/results', color: 'text-indigo-600', bg: 'bg-indigo-100' },
                    { label: 'Resource Hub', icon: BookOpen, href: '/student/library', color: 'text-sky-600', bg: 'bg-sky-100' },
                    { label: 'Newsroom', icon: Bell, href: '/student/announcements', color: 'text-amber-600', bg: 'bg-amber-100' },
                ].map((item, i) => (
                    <Link key={i} href={item.href} className="group">
                        <div className="glass-panel h-full flex flex-col items-center justify-center p-8 transition-all duration-500 cursor-pointer border-transparent hover:border-white hover:bg-white hover:shadow-xl hover:-translate-y-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                <item.icon className="h-16 w-16" />
                            </div>
                            <div className={`p-5 rounded-3xl ${item.bg}/50 mb-4 group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
                                <item.icon className={`h-8 w-8 ${item.color}`} />
                            </div>
                            <span className="font-black text-sm text-slate-700 uppercase tracking-wider group-hover:text-blue-600 transition-colors">{item.label}</span>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Announcements Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shadow-inner">
                            <Bell className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Latest Announcements</h3>
                            <p className="text-xs text-slate-500 font-medium">Internal school updates and news.</p>
                        </div>
                    </div>
                    <Button variant="ghost" className="text-blue-600 font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 rounded-xl px-6" asChild>
                        <Link href="/student/announcements">News Archive <ArrowRight className="ml-2 h-3 w-3" /></Link>
                    </Button>
                </div>

                <div className="glass-panel p-2 rounded-4xl shadow-sm">
                    <AnnouncementList limit={3} />
                </div>
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useRouter, usePathname } from 'next/navigation';
import { GraduationCap, Bell, LogOut, LayoutDashboard, BookOpen, Users, CalendarCheck, Loader2, Menu, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PortalSidebarLayout } from '@/components/PortalSidebarLayout';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useRequireAuth(['teacher']) as any;
    const pathname = usePathname();
    const [currentUser, setCurrentUser] = useState(user);
    const [hasAllocations, setHasAllocations] = useState(false);
    const [loadingAllocations, setLoadingAllocations] = useState(true);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [announcements, setAnnouncements] = useState<any[]>([]);

    useEffect(() => {
        if (!user) return;

        const syncData = async () => {
            try {
                // Parallelize all baseline sync calls for speed
                const [userRes, allocRes, notifRes] = await Promise.all([
                    fetch(`/api/users?id=${user.id}`),
                    fetch('/api/allocations'),
                    fetch('/api/notifications', {
                        headers: { 'x-actor-role': 'teacher', 'x-actor-id': user.id }
                    })
                ]);

                if (userRes.ok) {
                    const userData = await userRes.json();
                    const latestUser = Array.isArray(userData) ? userData.find((u: any) => u.id === user.id) : userData;
                    if (latestUser) setCurrentUser(latestUser);
                }

                if (allocRes.ok) {
                    const allAllocations = await allocRes.json();
                    const myAllocations = allAllocations.filter((a: any) => {
                        const tId = String(a.teacherId || a.teacher_id).toLowerCase();
                        const uId = String(user.id).toLowerCase();
                        const uTId = String(user.teacherId || '').toLowerCase();
                        const uName = String(user.name || user.fullName || '').toLowerCase();
                        const tName = String(a.teacherName || a.teacher_name || '').toLowerCase();

                        return (tId && (tId === uId || tId === uTId)) ||
                            (!tId && tName && uName && (tName.includes(uName) || uName.includes(tName)));
                    });
                    setHasAllocations(myAllocations.length > 0);
                }

                if (notifRes.ok) {
                    const data = await notifRes.json();
                    setNotifications(data.notifications || []);
                    setUnreadCount(data.unreadCount || 0);
                }

                // Fetch Announcements
                const annRes = await fetch('/api/announcements', {
                    headers: { 'x-actor-role': 'teacher' }
                });
                if (annRes.ok) {
                    setAnnouncements(await annRes.json());
                }
            } catch (e) {
                console.error('Failed to sync teacher layout data', e);
            } finally {
                setLoadingAllocations(false);
            }
        };

        syncData();
    }, [user]);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                    <p className="text-blue-900 font-bold animate-pulse">Loading Teacher Portal...</p>
                </div>
            </div>
        );
    }

    const isHomeroomTeacher = !!currentUser?.grade && !!currentUser?.section;

    const navItems = [
        { id: 'dashboard', href: '/teacher', label: 'Overview', icon: LayoutDashboard, show: true },
        { id: 'subjects', href: '/teacher/subjects', label: 'Subject Portal', icon: BookOpen, show: hasAllocations },
        { id: 'homeroom', href: '/teacher/homeroom', label: 'Homeroom', icon: Users, show: isHomeroomTeacher },
        { id: 'notifications', href: '/teacher/notifications', label: 'Notifications', icon: Bell, show: true },
        { id: 'attendance', href: '/teacher/attendance', label: 'Attendance', icon: CalendarCheck, show: true },
        { id: 'profile', href: '/teacher/profile', label: 'My Profile', icon: UserIcon, show: true },
    ];

    const menuGroups = [
        {
            label: 'Home',
            icon: LayoutDashboard,
            items: ['dashboard', 'notifications']
        },
        {
            label: 'Announcements',
            icon: Bell,
            customContent: (
                <div className="relative grid gap-1">
                    {announcements.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 font-medium text-xs">No recent announcements</div>
                    ) : (
                        announcements.slice(0, 5).map((ann) => (
                            <div key={ann.id} className="p-3 rounded-xl hover:bg-orange-50 transition-colors group/ann">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={cn(
                                        "text-[8px] font-black uppercase px-1.5 py-0.5 rounded",
                                        ann.type === 'emergency' ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                                    )}>
                                        {ann.type}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium">{ann.date}</span>
                                </div>
                                <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover/ann:text-orange-700">{ann.title}</h4>
                                <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{ann.body}</p>
                            </div>
                        ))
                    )}
                    <Link href="/teacher/notifications" className="block p-2 text-center text-[10px] font-black text-blue-600 hover:text-blue-700 bg-blue-50/50 rounded-lg mt-1 underline underline-offset-4">
                        View All Announcements
                    </Link>
                </div>
            )
        },
        {
            label: 'Academic',
            icon: BookOpen,
            items: ['subjects', 'attendance']
        },
        {
            label: 'Management',
            icon: Users,
            items: ['homeroom', 'profile']
        }
    ].filter(group => (group.items && group.items.some(id => navItems.find(n => n.id === id)?.show)) || group.customContent);

    const TeacherHeaderMenus = (
        <div className="flex items-center gap-4">
            {menuGroups.map((group) => (
                <div key={group.label} className="relative group">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50/50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 font-bold text-sm transition-all shadow-sm ring-1 ring-blue-100/50 group-hover:bg-blue-100 group-hover:text-blue-800">
                        <group.icon className="h-4 w-4" />
                        <span>{group.label}</span>
                        <Menu className="h-3 w-3 opacity-30 group-hover:rotate-180 transition-transform" />
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute top-full left-0 mt-1 w-64 p-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 z-50 overflow-hidden">
                        <div className="absolute inset-0 bg-linear-to-br from-blue-50/20 to-indigo-50/20 pointer-events-none" />
                        <div className="relative grid gap-1">
                            {group.customContent ? group.customContent : group.items?.map(itemId => {
                                const item = navItems.find(n => n.id === itemId);
                                if (!item || !item.show) return null;
                                const isActive = item.href === '/teacher'
                                    ? pathname === '/teacher'
                                    : pathname.startsWith(item.href!);
                                return (
                                    <Link
                                        key={itemId}
                                        href={item.href!}
                                        className={cn(
                                            "flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-black transition-all group/item",
                                            isActive
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                                : "text-slate-600 hover:bg-blue-50/50 hover:text-blue-700"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                                                isActive ? "bg-white/20" : "bg-slate-50 group-hover/item:bg-blue-100"
                                            )}>
                                                <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-500 group-hover/item:text-blue-600")} />
                                            </div>
                                            <span className="uppercase tracking-tight underline-offset-4 decoration-2 group-hover/item:underline decoration-blue-200/50">{item.label}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <PortalSidebarLayout
            role="teacher"
            title="Faculty Portal"
            user={user}
            navItems={navItems as any}
            headerContent={TeacherHeaderMenus}
            hideSidebar={true}
            logout={logout}
            notificationCount={unreadCount}
        >
            {children}
        </PortalSidebarLayout>
    );
}

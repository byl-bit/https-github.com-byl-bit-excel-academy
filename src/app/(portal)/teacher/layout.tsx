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
                            (!tId && tName && uName && tName === uName);
                    });
                    setHasAllocations(myAllocations.length > 0);
                }

                if (notifRes.ok) {
                    const data = await notifRes.json();
                    setNotifications(data.notifications || []);
                    setUnreadCount(data.unreadCount || 0);
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
        { href: '/teacher', label: 'Dashboard', icon: LayoutDashboard, show: true },
        { href: '/teacher/subjects', label: 'Subject Portal', icon: BookOpen, show: hasAllocations },
        { href: '/teacher/homeroom', label: 'Homeroom Portal', icon: Users, show: isHomeroomTeacher },
        { href: '/teacher/attendance', label: 'Attendance', icon: CalendarCheck, show: true },
        { href: '/teacher/profile', label: 'My Profile', icon: UserIcon, show: true },
    ];

    const TeacherHeaderMenus = (
        <div className="flex items-center gap-3 w-full max-w-4xl mx-auto">
            {navItems.filter(i => i.show !== false).map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ring-1 ring-blue-100/50 whitespace-nowrap",
                            isActive
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-200 ring-blue-600"
                                : "bg-blue-50/50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                        )}
                    >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                    </Link>
                );
            })}
        </div>
    );

    return (
        <PortalSidebarLayout
            role="teacher"
            title="Teacher Portal"
            user={user}
            navItems={navItems}
            headerContent={TeacherHeaderMenus}
            hideSidebar={true}
            logout={logout}
            notificationCount={unreadCount}
        >
            {children}
        </PortalSidebarLayout>
    );
}

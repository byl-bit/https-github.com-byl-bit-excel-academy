'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { User, LogOut, LayoutDashboard, FileText, Calendar, BookOpen, Menu, X, GraduationCap, Bell } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PortalSidebarLayout } from '@/components/PortalSidebarLayout';

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/auth/login');
        } else if (!loading && user?.role !== 'student') {
            if (user?.role === 'admin') router.push('/admin');
            else if (user?.role === 'teacher') router.push('/teacher');
            else router.push('/');
        }
    }, [isAuthenticated, user, loading, router]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-linear-to-br from-blue-50 to-indigo-50">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                    <p className="text-blue-600 font-bold tracking-widest text-sm uppercase">Loading Portal...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const navItems = [
        { href: '/student', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/student/results', label: 'Results', icon: FileText },
        { href: '/student/announcements', label: 'News', icon: Calendar },
        { href: '/student/library', label: 'Library', icon: BookOpen },
        { href: '/student/notifications', label: 'Notifications', icon: Bell },
        { href: '/student/profile', label: 'My Profile', icon: User },
    ];

    const StudentHeaderMenus = (
        <div className="flex items-center gap-1">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm ring-1 ring-blue-100/50",
                            isActive
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-200 ring-blue-600"
                                : "bg-blue-50/50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </div>
    );

    return (
        <PortalSidebarLayout
            role="student"
            title="Student Portal"
            user={user}
            navItems={navItems}
            headerContent={StudentHeaderMenus}
            hideSidebar={true}
            logout={logout}
        >
            {children}
        </PortalSidebarLayout>
    );
}

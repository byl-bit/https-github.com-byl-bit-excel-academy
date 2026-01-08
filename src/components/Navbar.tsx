'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { User, LogOut, GraduationCap, LayoutDashboard, Menu, X } from 'lucide-react';

export function Navbar() {
    const { user, logout, isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [teacherPortalEnabled, setTeacherPortalEnabled] = useState<boolean>(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const isHomePage = pathname === '/';

    useEffect(() => {
        try { setTeacherPortalEnabled(localStorage.getItem('teacher_portal_enabled') === 'true'); } catch (e) { setTeacherPortalEnabled(true); }
        const handler = (e: any) => {
            try {
                if (typeof e?.detail !== 'undefined') setTeacherPortalEnabled(Boolean(e.detail));
                else setTeacherPortalEnabled(localStorage.getItem('teacher_portal_enabled') === 'true');
            } catch (err) { /* ignore */ }
        };
        window.addEventListener('teacherPortalToggle', handler);
        return () => window.removeEventListener('teacherPortalToggle', handler);
    }, []);

    const handleLogout = () => {
        logout();
        router.push('/auth/login');
    };

    const getDashboardLink = () => {
        if (!user) return '/';
        return user.role === 'admin' ? '/admin' :
            user.role === 'teacher' ? '/teacher' :
                user.role === 'student' ? '/student' : '/';
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/30 backdrop-blur-lg shadow-none transition-all duration-300 dark:border-gray-700 dark:bg-gray-800/30 dark:backdrop-blur-lg">
            <div className="container flex h-16 sm:h-20 items-center justify-between">
                <div className="flex items-center gap-4 sm:gap-8">
                    <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group" onClick={() => setMobileMenuOpen(false)}>
                        <div className="h-10 w-10 sm:h-12 sm:w-12 relative hover:scale-105 transition-transform duration-300 rounded-full overflow-hidden border border-white/50 shadow-md bg-white p-0.5">
                            <img src="/school-logo-new.png" alt="Excel Academy" className="h-full w-full object-cover" />
                        </div>
                        {/* <span className="font-extrabold text-lg sm:text-2xl tracking-tight text-blue-900">Excel Academy <span className="animate-santa">🎅</span></span>*/}
                    </Link>
                    <div className="hidden md:flex gap-8 text-sm font-semibold text-slate-600">
                        <Link href="/" className="hover:text-blue-600 transition-colors py-2 border-b-2 border-transparent hover:border-blue-600">
                            Home
                        </Link>
                        {isAuthenticated && user?.role === 'admin' && (
                            <Link href="/admin" className="hover:text-blue-600 transition-colors py-2 border-b-2 border-transparent hover:border-blue-600">
                                Admin Dashboard
                            </Link>
                        )}
                        {isAuthenticated && user?.role === 'student' && (
                            <Link href="/student" className="hover:text-blue-600 transition-colors py-2 border-b-2 border-transparent hover:border-blue-600">
                                Student Portal
                            </Link>
                        )}
                        {isAuthenticated && user?.role === 'teacher' && (
                            <Link href="/teacher" className="font-bold text-blue-600 border-2 border-blue-600 px-4 py-1.5 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                Teacher Portal
                            </Link>
                        )}
                        <Link href="/announcements" className="hover:text-blue-600 transition-colors py-2 border-b-2 border-transparent hover:border-blue-600">
                            Announcements
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    {isAuthenticated && user ? (
                        <>
                            <div className="hidden md:flex items-center gap-3 text-sm bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                                <User className="h-4 w-4 text-blue-600" />
                                <span className="font-bold text-blue-900 line-clamp-1">{user.fullName || user.name}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden xs:flex text-red-500 hover:text-red-700 hover:bg-red-50">
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </Button>
                        </>
                    ) : (
                        <div className="hidden sm:flex items-center gap-3">
                            <Button variant="ghost" asChild className="text-slate-600 hover:text-blue-600 font-bold hover:bg-blue-50">
                                <Link href="/auth/login">Login</Link>
                            </Button>
                            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full px-5 shadow-sm hover:shadow-md transition-all">
                                <Link href="/admissions/apply">Get Started</Link>
                            </Button>
                        </div>
                    )}

                    {/* Mobile Menu Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden text-slate-600"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-white border-b shadow-xl animate-in slide-in-from-top-2 duration-200 z-50">
                    <div className="flex flex-col p-4 gap-4">
                        <Link
                            href="/"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 font-semibold"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Home
                        </Link>
                        {isAuthenticated ? (
                            <>
                                <Link
                                    href={getDashboardLink()}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 text-blue-700 font-bold"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <LayoutDashboard className="h-5 w-5" />
                                    Your Dashboard
                                </Link>
                                <Link
                                    href="/announcements"
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 font-semibold"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Announcements
                                </Link>
                                <div className="border-t pt-4 mt-2">
                                    <div className="flex items-center gap-3 p-3 text-slate-600">
                                        <User className="h-5 w-5" />
                                        <span className="font-medium">{user?.fullName || user?.name}</span>
                                    </div>
                                    <button
                                        onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                                        className="flex items-center gap-3 p-3 w-full text-red-600 font-bold hover:bg-red-50 rounded-lg text-left"
                                    >
                                        <LogOut className="h-5 w-5" />
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col gap-2 pt-2">
                                <Button asChild variant="outline" className="w-full justify-start h-12" onClick={() => setMobileMenuOpen(false)}>
                                    <Link href="/auth/login">Login</Link>
                                </Button>
                                <Button asChild className="w-full justify-start h-12 bg-blue-600" onClick={() => setMobileMenuOpen(false)}>
                                    <Link href="/admissions/apply">Apply Now</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}

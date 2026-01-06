'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X, Shield, Bell, CheckCircle } from 'lucide-react';

interface NavItem {
    label: string;
    href?: string; // Optional if onClick is used
    icon: React.ElementType;
    show?: boolean; // Default true
    onClick?: () => void; // For state-based navigation
    isActive?: boolean; // For manual active state
    badge?: number | string; // For notifications/counts
}

interface PortalSidebarLayoutProps {
    role: 'admin' | 'student' | 'teacher';
    title: string;
    user: any;
    navItems: NavItem[];
    logout: () => void;
    children: React.ReactNode;
    headerContent?: React.ReactNode;
    hideSidebar?: boolean;
    notificationCount?: number;
}

export function PortalSidebarLayout({
    role,
    title,
    user,
    navItems,
    logout,
    children,
    headerContent,
    hideSidebar = false,
    notificationCount = 0
}: PortalSidebarLayoutProps) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [pageTitle, setPageTitle] = useState(title);

    // Update page title based on active route
    useEffect(() => {
        const active = navItems.find(item => item.href === pathname);
        if (active) setPageTitle(active.label);
        else if (pathname === `/${role}`) setPageTitle('Dashboard');
        else if (pathname === `/${role}/profile`) setPageTitle('My Profile');
    }, [pathname, navItems, role]);

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white/70 backdrop-blur-xl border-r border-slate-100 text-slate-600 supports-backdrop-filter:bg-white/60">
            {/* Logo */}
            <div className="p-6 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white transform transition-transform hover:scale-110 duration-300">
                        <Shield className="h-5 w-5 fill-current" />
                    </div>
                    <div>
                        <h1 className="font-extrabold text-xl tracking-tight text-slate-900 leading-none">EXCEL</h1>
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] leading-none mt-1.5 opacity-90">ACADEMY</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="lg:hidden text-slate-400" onClick={() => setMobileOpen(false)}>
                    <X className="h-5 w-5" />
                </Button>
            </div>

            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-2">
                <div className="px-2 mb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Menu</p>
                </div>
                {navItems.filter(i => i.show !== false).map((item, idx) => {
                    const isActive = item.isActive !== undefined ? item.isActive : pathname === item.href;

                    const content = (
                        <>
                            <div className="flex items-center gap-3.5">
                                <item.icon className={cn("h-[18px] w-[18px] transition-all duration-300",
                                    isActive ? "text-blue-600 fill-blue-600/10" : "text-slate-400 group-hover:text-blue-500"
                                )} />
                                <span className="truncate">{item.label}</span>
                            </div>
                            {item.badge ? (
                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto shadow-sm",
                                    isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600"
                                )}>
                                    {item.badge}
                                </span>
                            ) : null}
                        </>
                    );

                    const className = cn(
                        "flex items-center justify-between w-full gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-semibold text-[13px] text-left relative overflow-hidden",
                        isActive
                            ? "bg-blue-50/80 text-blue-700 shadow-sm ring-1 ring-blue-100"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    );

                    if (item.onClick) {
                        return (
                            <button
                                key={item.label + idx}
                                onClick={() => {
                                    setMobileOpen(false);
                                    item.onClick!();
                                }}
                                className={className}
                            >
                                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />}
                                {content}
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={item.href || idx}
                            href={item.href || '#'}
                            onClick={() => setMobileOpen(false)}
                            className={className}
                        >
                            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />}
                            {content}
                        </Link>
                    )
                })}
            </nav>

            {/* User Profile */}
            <div className="p-4 shrink-0">
                {role !== 'admin' ? (
                    <Link href={`/${role}/profile`} className="relative overflow-hidden flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-linear-to-br from-slate-50 to-white shadow-sm group hover:shadow-md hover:border-blue-100 transition-all duration-300">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-linear-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white group-hover:scale-105 transition-transform overflow-hidden">
                            {user?.photo ? (
                                <img src={user.photo} alt="" className="w-full h-full object-cover" />
                            ) : (
                                (user?.name || user?.fullName)?.[0]?.toUpperCase() || 'U'
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-700 transition-colors">{user?.name || user?.fullName || 'User'}</p>
                            <p className="text-[10px] font-semibold text-slate-400 truncate uppercase tracking-tight">{role === 'student' ? user?.studentId : (user?.teacherId || role)}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); e.stopPropagation(); logout(); }} className="shrink-0 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl h-8 w-8 transition-colors">
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </Link>
                ) : (
                    <div className="relative overflow-hidden flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-linear-to-br from-slate-50 to-white shadow-sm group hover:shadow-md transition-all duration-300">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-linear-to-tr from-red-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white">
                            {(user?.name || user?.fullName)?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{user?.name || user?.fullName || 'Admin'}</p>
                            <p className="text-[10px] font-semibold text-slate-400 truncate uppercase tracking-tight">System Administrator</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={logout} className="shrink-0 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl h-8 w-8 transition-colors">
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 flex font-sans">
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden animate-in fade-in duration-200" onClick={() => setMobileOpen(false)} />
            )}

            {/* Sidebar (Desktop + Mobile) */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 shadow-2xl lg:shadow-none transition-transform duration-300",
                mobileOpen ? "translate-x-0" : "-translate-x-full",
                !hideSidebar ? "lg:translate-x-0 lg:w-72" : "lg:hidden"
            )}>
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <main className={cn(
                "flex-1 min-h-screen flex flex-col transition-all duration-300",
                !hideSidebar && "lg:ml-72"
            )}>
                {/* Top Header (Mobile Toggle + Page Title) */}
                <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-3 sm:px-8 flex items-center justify-between shadow-sm">
                    <div className="flex items-center min-w-0 shrink-0">
                        <Button variant="ghost" size="icon" className="lg:hidden text-slate-500 hover:bg-slate-50 mr-1 sm:mr-2 shrink-0" onClick={() => setMobileOpen(true)}>
                            <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                        </Button>

                        {hideSidebar && (
                            <div className="flex items-center gap-1.5 sm:gap-3 mr-2 sm:mr-4 shrink-0">
                                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white transform transition-transform hover:scale-105 duration-300">
                                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                                </div>
                                <div className="flex flex-col leading-none">
                                    <h1 className="font-black text-[10px] sm:text-base md:text-lg tracking-tighter text-slate-900 uppercase">Excel</h1>
                                    <p className="text-[7px] sm:text-[9px] font-extrabold text-blue-500 uppercase tracking-widest mt-0.5 opacity-90">Academy</p>
                                </div>
                            </div>
                        )}

                        <div className="h-6 w-px bg-slate-200 mx-1 sm:mx-2 shrink-0 hidden sm:block" />

                        {role !== 'admin' && (
                            <div className="min-w-0 ml-1 sm:ml-2">
                                <h2 className="text-sm sm:text-xl md:text-2xl font-black text-slate-800 tracking-tight truncate uppercase opacity-90">{pageTitle}</h2>
                            </div>
                        )}
                    </div>

                    <div className="hidden lg:flex flex-1 justify-center px-4">
                        <div className="flex items-center gap-2 max-w-full">
                            {headerContent}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                        {role === 'admin' ? (
                            <div className="flex items-center gap-3 p-1.5 pl-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm">
                                <div className="hidden sm:flex flex-col items-end text-right mr-2">
                                    <span className="text-[10px] font-black text-slate-900 leading-none">ADMINISTRATOR</span>
                                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-1">
                                        ID: {user?.adminId || `AD-${new Date().getFullYear()}-001`}
                                    </span>
                                </div>

                                <div className="h-8 w-px bg-slate-200 hidden sm:block mx-1" />

                                <div className="flex items-center gap-1">
                                    <div className="relative">
                                        <div className="text-slate-400 hover:text-blue-600 rounded-xl h-9 w-9 flex items-center justify-center transition-colors cursor-pointer group">
                                            <Bell className="h-4 w-4" />
                                            {notificationCount > 0 && (
                                                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[8px] font-black text-white ring-2 ring-white animate-pulse">
                                                    {notificationCount > 9 ? '9+' : notificationCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={logout}
                                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl h-9 w-9 transition-colors"
                                        title="Logout"
                                    >
                                        <LogOut className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="hidden lg:flex flex-col items-end mr-2 text-right">
                                    <span className="text-sm font-black text-slate-900 leading-none capitalize">{role}</span>
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">
                                        ID: {role === 'student' ? (user?.studentId || user?.id) : (user?.teacherId || user?.id)}
                                    </span>
                                </div>

                                <div className="relative shrink-0">
                                    <div className="text-slate-400 hover:text-blue-600 rounded-full h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center transition-colors cursor-pointer relative group">
                                        <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                                        {notificationCount > 0 && (
                                            <span className="absolute top-0 right-0 sm:top-1 sm:right-1 flex h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 items-center justify-center rounded-full bg-red-600 text-[8px] sm:text-[10px] font-black text-white ring-2 ring-white animate-pulse">
                                                {notificationCount > 9 ? '9+' : notificationCount}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <Link href={`/${role}/profile`} className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 rounded-full bg-linear-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-[10px] sm:text-sm shadow-md ring-2 ring-white hover:scale-105 transition-transform overflow-hidden">
                                    {user?.photo ? (
                                        <img src={user.photo} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        (user?.name || user?.fullName)?.[0]?.toUpperCase() || 'U'
                                    )}
                                </Link>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={logout}
                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full h-8 w-8 sm:h-10 sm:w-10 transition-colors shrink-0"
                                    title="Logout"
                                >
                                    <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                                </Button>
                            </>
                        )}
                    </div>
                </header>

                <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
                    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
                        {children}
                    </div>
                </div>
            </main>
        </div >
    );
}

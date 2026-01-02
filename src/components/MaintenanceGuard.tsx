'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { Lock } from 'lucide-react';

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const pathname = usePathname();
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Check maintenance status
        const checkMaintenance = () => {
            const maintenance = localStorage.getItem('excel_academy_maintenance') === 'true';
            setIsMaintenance(maintenance);
            setIsLoaded(true);
        };

        checkMaintenance();

        // Listen for storage changes (in case logged in as admin in another tab)
        window.addEventListener('storage', checkMaintenance);
        return () => window.removeEventListener('storage', checkMaintenance);
    }, []);

    // Allow admins to bypass
    const isAdmin = user?.role === 'admin';

    // Always allow login/register
    const isAuthPage = pathname?.startsWith('/auth') || pathname === '/login' || pathname === '/admin';

    if (!isLoaded) return null;

    if (isMaintenance && !isAdmin && !isAuthPage) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 text-white text-center">
                <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full">
                    <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-blue-400" />
                    </div>
                    <h1 className="text-3xl font-bold mb-4 bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        Portal Maintenance
                    </h1>
                    <p className="text-slate-400 mb-8">
                        The Student Portal is currently undergoing scheduled maintenance.
                        Please check back later.
                    </p>
                    <div className="text-xs text-slate-600 font-mono">
                        Error Code: 503_SERVICE_UNAVAILABLE
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

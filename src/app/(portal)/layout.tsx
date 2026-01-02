'use client';

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import MaintenanceGuard from "@/components/MaintenanceGuard";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Enable session timeout for authenticated users
    useSessionTimeout();

    return (
        <MaintenanceGuard>
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-1 w-full">
                    {children}
                </main>
                <Footer />
            </div>
        </MaintenanceGuard>
    );
}

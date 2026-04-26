"use client";

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
        <main className="flex-1 w-full">{children}</main>
      </div>
    </MaintenanceGuard>
  );
}

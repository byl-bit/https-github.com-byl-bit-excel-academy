'use client';

import { PortalSidebarLayout } from '@/components/PortalSidebarLayout';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminData } from '@/hooks/useAdminData';
import {
    LogOut, Users, CheckCircle, Award, Library,
    Settings, Clock, Megaphone, Shield, LayoutDashboard,
    AlertCircle, RefreshCw, BookOpen, ShieldAlert, Menu, X, Trophy
} from "lucide-react";

import { AdminOverview } from '@/components/admin/AdminOverview';
import { UserApprovals } from '@/components/admin/UserApprovals';
import { ResultsManager } from '@/components/admin/ResultsManager';
import { StudentDirectory } from '@/components/admin/StudentDirectory';
import { TeacherDirectory } from '@/components/admin/TeacherDirectory';
import { LibraryManager } from '@/components/admin/LibraryManager';
import { SettingsManager } from '@/components/admin/SettingsManager';
import { ActivityLogs } from '@/components/admin/ActivityLogs';
import { Notifications } from '@/components/admin/Notifications';
import { SubjectAllocations } from '@/components/admin/SubjectAllocations';
import { AnnouncementManager } from '@/components/AnnouncementManager';
import { ResetApprovals } from '@/components/admin/ResetApprovals';
import { AppreciationLetters } from '@/components/admin/AppreciationLetters';
import { Button } from "@/components/ui/button";
import { logActivity } from "@/lib/utils/activityLog";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

export default function AdminPage() {
    const { user, logout, isAuthenticated } = useRequireAuth(['admin']) as any;
    // Enable session timeout for admin portal
    useSessionTimeout();
    const { success, error: notifyError, info } = useToast();
    const router = useRouter();
    const {
        isLoading, error, users, admissions, subjects,
        allResults, pendingResults, books, announcements, systemStats,
        activityLogs, notifications, unreadNotifications, settings, allocations, resetRequests, refresh
    } = useAdminData();

    const [activeTab, setActiveTab] = useState('overview');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [maintenanceMode, setMaintenanceMode] = useState(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('excel_academy_maintenance') === 'true';
        return false;
    });

    // --- Actions ---

    const handleApproveUser = async (userId: string) => {
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'x-actor-role': 'admin',
                'x-actor-id': user?.id || ''
            };
            // If provided identifier is a Student ID, send as studentId to the API
            const payload: any = (String(userId).startsWith('ST-')) ? { studentId: userId, status: 'active' } : { id: userId, status: 'active' };
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                logActivity({ userId: user?.id || '', userName: user?.name || 'Admin', action: 'Approved User', category: 'user', details: `Approved user ${userId}` });
                success('User approved successfully');
                refresh(true);
            }
        } catch (e) { notifyError('Failed to approve user'); }
    };

    const handleRejectUser = async (userId: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            const headers: Record<string, string> = {
                'x-actor-role': 'admin',
                'x-actor-id': user?.id || ''
            };
            // Support deleting by studentId if provided
            const query = String(userId).startsWith('ST-') ? `?studentId=${encodeURIComponent(userId)}` : `?id=${encodeURIComponent(userId)}`;
            const res = await fetch(`/api/users${query}`, {
                method: 'DELETE',
                headers
            });
            if (res.ok) {
                logActivity({ userId: user?.id || '', userName: user?.name || 'Admin', action: 'Deleted User', category: 'user', details: `Deleted user ${userId}` });
                success('User deleted');
                refresh(true);
            }
        } catch (e) { notifyError('Failed to delete user'); }
    };

    const handleUpdateUser = async (userId: string, data: any) => {
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'x-actor-role': 'admin',
                'x-actor-id': user?.id || ''
            };
            const payload = String(userId).startsWith('ST-') ? { studentId: userId, ...data } : { id: userId, ...data };
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                logActivity({ userId: user?.id || '', userName: user?.name || 'Admin', action: 'Updated User', category: 'user', details: `Updated profile for ${userId}` });
                success('Profile updated');
                refresh(true);
            } else {
                const err = await res.json().catch(() => ({ error: 'Update failed' }));
                notifyError(err.error || 'Update failed');
            }
        } catch (e) { notifyError('Update failed: Connection error'); }
    };

    const handleAcceptAdmission = async (app: any) => {
        if (!confirm(`Enroll ${app.familyFullName}?`)) return;
        try {
            const studentId = `ST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
            const newUser = {
                id: `user-${Date.now()}`,
                name: app.studentName || app.familyFullName,
                email: app.email,
                password: 'password123',
                role: 'student',
                status: 'active',
                studentId,
                grade: app.grade,
                section: 'A',
                gender: app.gender
            };

            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });

            if (res.ok) {
                await fetch(`/api/admissions?id=${app.id}`, { method: 'DELETE' });
                logActivity({ userId: user?.id || '', userName: user?.name || 'Admin', action: 'Enrolled Student', category: 'user', details: `Enrolled ${app.familyFullName} from Admissions` });
                refresh(true);
                success(`Enrolled! ID: ${studentId}, Password: password123`);
            }
        } catch (e) { notifyError('Enrollment failed'); }
    };

    const handleRejectAdmission = async (id: string) => {
        if (!confirm('Reject this application?')) return;
        try {
            const res = await fetch(`/api/admissions?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                logActivity({ userId: user?.id || '', userName: user?.name || 'Admin', action: 'Rejected Admission', category: 'user', details: `Rejected application ID ${id}` });
                refresh(true);
                info('Application rejected');
            }
        } catch (e) { notifyError('Failed to reject application'); }
    };

    const handlePublishResult = async (result: any) => {
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'x-actor-role': 'admin',
                'x-actor-id': user?.id || ''
            };
            const res = await fetch('/api/results', {
                method: 'POST',
                headers,
                body: JSON.stringify({ [result.studentId]: result })
            });
            if (res.ok) {
                logActivity({ userId: user?.id || '', userName: user?.name || 'Admin', action: 'Published Result', category: 'result', details: `Manually published result for ${result.studentName}` });
                refresh(true);
                success('Result published successfully');
            }
        } catch (e) { notifyError('Failed to publish'); }
    };

    const handleApprovePendingResult = async (key: string, name: string) => {
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'x-actor-role': 'admin',
                'x-actor-id': user?.id || ''
            };
            const res = await fetch('/api/results', {
                method: 'PUT',
                headers,
                body: JSON.stringify({ approve: [key] })
            });
            if (res.ok) {
                logActivity({ userId: user?.id || '', userName: user?.name || 'Admin', action: 'Approved Result', category: 'result', details: `Approved results for ${name}` });
                success(`Approved ${name}`);
                refresh(true);
            }
        } catch (e) { notifyError('Approval failed'); }
    };

    const handleApproveSubjectMarks = async (studentKey: string, subjectName: string) => {
        try {
            const res = await fetch('/api/results', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-actor-role': 'admin', 'x-actor-id': user?.id || '' },
                body: JSON.stringify({
                    approveSubject: { studentKey, subjectName }
                })
            });
            if (res.ok) {
                success(`Approved ${subjectName} marks`);
                refresh(true);
            }
        } catch (e) { notifyError('Subject approval failed'); }
    };

    const handleApproveManyResults = async (keys: string[], teacherName: string) => {
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'x-actor-role': 'admin',
                'x-actor-id': user?.id || ''
            };
            const res = await fetch('/api/results', {
                method: 'PUT',
                headers,
                body: JSON.stringify({ approve: keys })
            });
            if (res.ok) {
                logActivity({ userId: user?.id || '', userName: user?.name || 'Admin', action: 'Approved Bulk Results', category: 'result', details: `Approved ${keys.length} results submitted by ${teacherName}` });
                refresh(true);
            }
        } catch (e) { notifyError('Bulk approval failed'); }
    };

    const handleRejectPendingResult = async (key: string, name: string) => {
        if (!confirm(`Reject results for ${name}?`)) return;
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'x-actor-role': 'admin',
                'x-actor-id': user?.id || ''
            };
            const res = await fetch('/api/results', {
                method: 'PUT',
                headers,
                body: JSON.stringify({ reject: [key] })
            });
            if (res.ok) {
                logActivity({ userId: user?.id || '', userName: user?.name || 'Admin', action: 'Rejected Result', category: 'result', details: `Rejected pending results for ${name}` });
                refresh(true);
            }
        } catch (e) { notifyError('Rejection failed'); }
    };

    const handleDeletePublishedResult = async (id: string) => {
        if (!confirm('Delete this published result?')) return;
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'x-actor-role': 'admin',
                'x-actor-id': user?.id || ''
            };
            const res = await fetch('/api/results', {
                method: 'PUT',
                headers,
                body: JSON.stringify({ deletePublished: [id] })
            });
            if (res.ok) {
                logActivity({ userId: user?.id || '', userName: 'Admin', action: 'Deleted Result', category: 'result', details: `Deleted result ID ${id}` });
                refresh(true);
            }
        } catch (e) { notifyError('Deletion failed'); }
    };

    const handleUnlockResult = async (id: string) => {
        if (!confirm('Unlock this result for teacher editing? It will be removed from published and moved back to drafts.')) return;
        try {
            const res = await fetch('/api/results', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-actor-role': 'admin', 'x-actor-id': user?.id || '' },
                body: JSON.stringify({ unlock: [id] })
            });
            if (res.ok) {
                logActivity({ userId: user?.id || '', userName: 'Admin', action: 'Unlocked Result', category: 'result', details: `Unlocked result ID ${id} for editing` });
                success('Result unlocked and moved to drafts');
                refresh(true);
            }
        } catch (e) { notifyError('Unlock failed'); }
    };

    const handleAddBook = async (book: any) => {
        try {
            const res = await fetch('/api/resources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: book.title,
                    author: book.author,
                    description: book.description,
                    grade: book.grade,
                    subject: book.subject,
                    file_url: book.downloadUrl,
                    video_url: book.videoUrl
                })
            });
            if (res.ok) {
                logActivity({ userId: user?.id || '', userName: user?.name || 'Admin', action: 'Added Resource', category: 'library', details: `Added resource: ${book.title}` });
                refresh(true);
            }
        } catch (e) { notifyError('Failed to add resource'); }
    };

    const handleDeleteBook = async (id: string) => {
        if (!confirm('Delete this resource?')) return;
        try {
            const res = await fetch(`/api/resources?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                logActivity({ userId: user?.id || '', userName: user?.name || 'Admin', action: 'Deleted Resource', category: 'library', details: `Deleted resource ID ${id}` });
                refresh(true);
            }
        } catch (e) { notifyError('Failed to delete resource'); }
    };

    const handleToggleMaintenance = () => {
        const next = !maintenanceMode;
        setMaintenanceMode(next);
        localStorage.setItem('excel_academy_maintenance', String(next));
        logActivity({ userId: user?.id || '', userName: user?.name || 'Admin', action: 'Toggle Maintenance', category: 'system', details: `Maintenance mode set to ${next}` });
    };

    const handleAddSubject = async (name: string) => {
        const updated = [...subjects, name];
        await fetch('/api/subjects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
        localStorage.setItem('excel_academy_subjects', JSON.stringify(updated));
        logActivity({ userId: user?.id || '', userName: user?.name || 'Admin', action: 'Added Subject', category: 'system', details: `Added ${name} to subjects` });
        refresh();
    };

    const handleDeleteSubject = async (name: string) => {
        const updated = subjects.filter(s => s !== name);
        await fetch('/api/subjects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
        localStorage.setItem('excel_academy_subjects', JSON.stringify(updated));
        logActivity({ userId: user?.id || '', userName: user?.name || 'Admin', action: 'Deleted Subject', category: 'system', details: `Removed ${name} from subjects` });
        refresh();
    };

    const handleChangeAdminPassword = async (pass: string) => {
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'x-actor-role': 'admin',
                'x-actor-id': user?.id || ''
            };

            const res = await fetch('/api/users', {
                method: 'PUT',
                headers,
                body: JSON.stringify({ id: user?.id, password: pass })
            });

            if (res.ok) {
                logActivity({ userId: user?.id || '', userName: user?.name || 'Admin', action: 'Changed Password', category: 'system', details: `Admin password changed` });
                success('Password updated successfully');
                return true;
            } else if (res.status === 403) {
                notifyError('Unauthorized: You must be an admin to change this password (re-login may be required).');
                return false;
            } else {
                const body = await res.json().catch(() => null);
                notifyError(body?.error || 'Failed to update password');
                return false;
            }
        } catch (e) {
            console.error('handleChangeAdminPassword error', e);
            notifyError('Failed to update password');
            return false;
        }
    };

    const handleUpdateSettings = async (key: string, value: any) => {
        try {
            const updatedSettings = { ...settings, [key]: value };
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedSettings)
            });
            if (res.ok) {
                success('Settings saved');
                refresh(true); // Silent refresh to avoid unmounting components
            } else {
                notifyError('Failed to save settings');
            }
        } catch (e) {
            console.error(e);
            notifyError('Failed to update setting');
        }
    };

    const handleApproveReset = async (requestId: string) => {
        try {
            const res = await fetch('/api/admin/reset-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-actor-role': 'admin',
                    'x-actor-id': user?.id || ''
                },
                body: JSON.stringify({ requestId, action: 'approve' })
            });
            if (res.ok) {
                success('Password reset approved');
                refresh(true);
            }
        } catch (e) { notifyError('Approval failed'); }
    };

    const handleRejectReset = async (requestId: string) => {
        try {
            const res = await fetch('/api/admin/reset-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-actor-role': 'admin',
                    'x-actor-id': user?.id || ''
                },
                body: JSON.stringify({ requestId, action: 'reject' })
            });
            if (res.ok) {
                info('Reset request rejected');
                refresh(true);
            }
        } catch (e) { notifyError('Rejection failed'); }
    };

    const handleResetSystem = async () => {
        if (!confirm('CRITICAL: You are about to RESET the entire system. This will delete ALL students, results, and data.\n\nA backup PDF of all results will be generated first. Continue?')) return;

        try {
            // 1. Fetch all data for backup
            const res = await fetch('/api/results', {
                headers: {
                    'x-actor-role': 'admin',
                    'x-actor-id': user?.id || ''
                }
            });
            const data = await res.json();
            const published = data.published || {};

            // 2. Generate PDF
            const jsPDF = (await import('jspdf')).default;
            const doc = new jsPDF();

            doc.setFontSize(18);
            doc.text("Excel Academy - System Master Sheet (Backup)", 14, 22);
            doc.setFontSize(11);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

            let y = 40;
            // Simple textual representation for backup (robustness over style for raw backup)
            doc.setFont("helvetica", "bold");
            doc.text("ID       | Name                | Class | Avg   | Result", 14, y);
            doc.line(14, y + 2, 196, y + 2);
            y += 10;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);

            const resultsArray = Object.values(published) as any[];
            resultsArray.sort((a, b) => (a.grade || '').localeCompare(b.grade || ''));

            resultsArray.forEach((r: any) => {
                const name = (r.studentName || 'Unknown').substring(0, 18).padEnd(18);
                const id = (r.studentId || '----').substring(0, 8).padEnd(8);
                const cls = `${r.grade}-${r.section}`.padEnd(5);
                const avg = `${r.average}%`.padEnd(5);
                const res = r.result || '-';

                const line = `${id} | ${name} | ${cls} | ${avg} | ${res}`;
                doc.text(line, 14, y);
                y += 6;
                if (y > 280) {
                    doc.addPage();
                    y = 20;
                }
            });

            doc.save(`Academy_Backup_${new Date().toISOString().split('T')[0]}.pdf`);

            // --- EXTENDED BACKUP: REPORT CARDS ---
            // If the user wants a full backup, we should ideally include report cards.
            // Let's add them to the SAME PDF for a single-file backup.
            if (resultsArray.length > 0) {
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();

                resultsArray.forEach((result) => {
                    doc.addPage();

                    // Re-using Report Card Design from ResultsManager
                    doc.setFillColor(30, 64, 175);
                    doc.rect(0, 0, pageWidth, 25, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(18);
                    doc.setFont("helvetica", "bold");
                    doc.text("EXCEL ACADEMY", pageWidth / 2, 12, { align: 'center' });
                    doc.setFontSize(10);
                    doc.text("STUDENT PROGRESS REPORT", pageWidth / 2, 18, { align: 'center' });

                    doc.setTextColor(0, 0, 0);
                    doc.setDrawColor(200, 200, 200);
                    doc.rect(10, 30, pageWidth - 20, 25);

                    doc.setFontSize(9);
                    doc.setFont("helvetica", "normal");
                    doc.text(`Name: ${result.studentName || 'Unknown'}`, 15, 38);
                    doc.text(`Student ID: ${result.studentId || '-'}`, 15, 45);
                    doc.text(`Grade/Section: ${result.grade || '-'} - ${result.section || '-'}`, 120, 38);
                    doc.text(`Date: ${new Date().toLocaleDateString()}`, 120, 45);

                    // Table Header
                    let y = 65;
                    doc.setFillColor(240, 240, 240);
                    doc.rect(10, y - 5, pageWidth - 20, 8, 'F');
                    doc.setFont("helvetica", "bold");
                    doc.text("SUBJECT", 15, y);
                    doc.text("MARKS", 110, y, { align: 'center' });
                    doc.text("RESULT", 160, y, { align: 'center' });

                    y += 8;
                    doc.setFont("helvetica", "normal");
                    (result.subjects || []).forEach((sub: any, sIdx: number) => {
                        if (sIdx % 2 === 0) {
                            doc.setFillColor(252, 252, 252);
                            doc.rect(10, y - 5, pageWidth - 20, 8, 'F');
                        }
                        doc.text(sub.name || 'Subject', 15, y);
                        doc.text(String(sub.marks || 0), 110, y, { align: 'center' });
                        doc.text((sub.marks || 0) >= 40 ? 'PASS' : 'FAIL', 160, y, { align: 'center' });
                        y += 8;
                    });

                    // Summary
                    y += 10;
                    doc.setFont("helvetica", "bold");
                    doc.text(`TOTAL SCORE: ${result.total || 0}`, 15, y);
                    doc.text(`AVERAGE: ${(result.average || 0).toFixed(1)} / 100`, 80, y);
                    doc.text(`STATUS: ${result.promotedOrDetained || '-'}`, 140, y);

                    y += 10;
                    doc.text(`Conduct: ${result.conduct || 'Satisfactory'}`, 15, y);

                    doc.setFontSize(8);
                    doc.text("System Backup Generated Record", pageWidth / 2, pageHeight - 10, { align: 'center' });
                    doc.rect(5, 5, pageWidth - 10, pageHeight - 10, 'S');
                });

                // Overwrite generic save with full save
                doc.save(`Excel_Academy_FULL_System_Backup_${new Date().toISOString().split('T')[0]}.pdf`);
            } else {
                doc.save(`Academy_Backup_${new Date().toISOString().split('T')[0]}.pdf`);
            }

            // 3. Confirmation to proceed with destructive action
            if (!confirm('Backup PDF downloaded. Do you want to proceed with DELETING all data now?')) return;

            alert('Performing system reset...');

            // Execute Comprehensive Reset
            const actorRole = user?.role || 'admin';
            const actorId = user?.id || '';

            await fetch('/api/admin/reset-system', {
                method: 'POST',
                headers: {
                    'x-actor-role': actorRole,
                    'x-actor-id': actorId
                }
            });

            logActivity({ userId: actorId, userName: user?.name || 'Admin', action: 'SYSTEM RESET COMPLETE', category: 'system', details: `Full factory reset performed - All academic modules cleared` });
            logActivity({ userId: user?.id || '', userName: user?.name || 'Admin', action: 'SYSTEM RESET', category: 'system', details: `RESET PERFORMED - Backup generated` });
            window.location.reload();
        } catch (e) { notifyError('Reset failed during backup or execution.'); }
    };

    const handleAllocate = async (allocation: any) => {
        try {
            const res = await fetch('/api/allocations', {
                method: 'POST',
                body: JSON.stringify(allocation)
            });
            if (res.ok) {
                success('Subject assigned successfully');
                refresh(true);
            } else {
                notifyError('Failed to assign subject');
            }
        } catch (e) { notifyError('Allocation failed'); }
    };

    const handleDeallocate = async (id: string) => {
        await fetch(`/api/allocations?id=${id}`, { method: 'DELETE' });
        refresh(true);
    };

    // --- Rendering ---

    if (isLoading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
            <RefreshCw className="h-10 w-10 text-blue-600 animate-spin" />
            <p className="font-medium text-slate-600 animate-pulse">Synchronizing Academy Core...</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <p className="text-xl font-bold">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry Connection</Button>
        </div>
    );

    const tabs: any[] = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'approvals', label: 'Approvals', icon: CheckCircle, badge: admissions.length + users.filter(u => u.status === 'pending').length + pendingResults.length + resetRequests.length },
        { id: 'resets', label: 'Resets', icon: ShieldAlert, badge: resetRequests.length },
        { id: 'allocations', label: 'Allocations', icon: BookOpen },
        { id: 'results', label: 'Results', icon: Award, badge: pendingResults.length },
        { id: 'students', label: 'Students', icon: Users },
        { id: 'teachers', label: 'Teachers', icon: Shield },
        { id: 'announcements', label: 'News', icon: Megaphone },
        { id: 'letters', label: 'Certificates', icon: Trophy },
        { id: 'library', label: 'Library', icon: Library },
        { id: 'notifications', label: 'Notifications', icon: AlertCircle, badge: unreadNotifications },
        { id: 'activity', label: 'Logs', icon: Clock },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    const navItems = tabs.map(tab => ({
        label: tab.label,
        icon: tab.icon,
        onClick: () => setActiveTab(tab.id),
        isActive: activeTab === tab.id,
        badge: tab.badge,
        href: '#' // Dummy
    }));

    const menuGroups = [
        {
            label: 'Home',
            icon: LayoutDashboard,
            items: ['overview']
        },
        {
            label: 'Personnel',
            icon: Users,
            items: ['students', 'teachers', 'library']
        },
        {
            label: 'Academic',
            icon: Award,
            items: ['results', 'allocations', 'letters', 'announcements']
        },
        {
            label: 'Governance',
            icon: Shield,
            items: ['approvals', 'resets', 'activity']
        },
        {
            label: 'System',
            icon: Settings,
            items: ['settings', 'notifications']
        }
    ];

    const AdminHeaderMenus = (
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
                            {group.items.map(tabId => {
                                const tab = tabs.find(t => t.id === tabId);
                                if (!tab) return null;
                                const isActive = activeTab === tabId;
                                return (
                                    <button
                                        key={tabId}
                                        onClick={() => setActiveTab(tabId)}
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
                                                <tab.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-500 group-hover/item:text-blue-600")} />
                                            </div>
                                            <span className="uppercase tracking-tight underline-offset-4 decoration-2 group-hover/item:underline decoration-blue-200/50">{tab.label}</span>
                                        </div>
                                        {tab.badge > 0 && (
                                            <span className={cn(
                                                "px-2 py-1 rounded-lg text-[10px] font-black tracking-widest border",
                                                isActive ? "bg-white/20 text-white border-white/30" : "bg-blue-100/50 text-blue-700 border-blue-200/50"
                                            )}>
                                                {tab.badge}
                                            </span>
                                        )}
                                    </button>
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
            role="admin"
            title="Administrator Portal"
            user={user}
            navItems={navItems}
            headerContent={AdminHeaderMenus}
            hideSidebar={true}
            notificationCount={admissions.length + users.filter(u => u.status === 'pending').length + pendingResults.length + resetRequests.length}
            logout={() => {
                logout();
                router.push('/auth/login');
            }}
        >
            <div className="space-y-6 animate-fade-in-up">
                {/* Header for content area is already handled by layout mostly, but we can add tab-specific if needed or leave empty to use default */}

                {activeTab === 'overview' && (
                    <AdminOverview
                        stats={systemStats!}
                        pendingCount={admissions.length + users.filter(u => u.status === 'pending').length}
                    />
                )}

                {activeTab === 'approvals' && (
                    <UserApprovals
                        pendingUsers={users.filter(u => u.status === 'pending')}
                        admissionApplications={admissions}
                        pendingResults={pendingResults}
                        onApprove={handleApproveUser}
                        onReject={handleRejectUser}
                        onAcceptAdmission={handleAcceptAdmission}
                        onRejectAdmission={handleRejectAdmission}
                        onApproveResult={handleApprovePendingResult}
                        onApproveSubject={handleApproveSubjectMarks}
                        onRejectResult={handleRejectPendingResult}
                        onTabChange={setActiveTab}
                        refresh={refresh}
                    />
                )}

                {activeTab === 'resets' && (
                    <ResetApprovals
                        requests={resetRequests}
                        onApprove={handleApproveReset}
                        onReject={handleRejectReset}
                    />
                )}

                {activeTab === 'allocations' && (
                    <SubjectAllocations
                        allocations={allocations}
                        teachers={users.filter(u => u.role === 'teacher')}
                        subjects={subjects}
                        onAllocate={handleAllocate}
                        onDeallocate={handleDeallocate}
                    />
                )}

                {activeTab === 'results' && (
                    <ResultsManager
                        students={users.filter(u => u.role === 'student' && u.status === 'active')}
                        teachers={users.filter(u => u.role === 'teacher')}
                        publishedResults={allResults}
                        pendingResults={pendingResults}
                        subjects={subjects}
                        settings={settings}
                        onPublish={handlePublishResult}
                        onApprovePending={handleApprovePendingResult}
                        onApproveSubject={handleApproveSubjectMarks}
                        onApproveMany={handleApproveManyResults}
                        onRejectPending={handleRejectPendingResult}
                        onDeletePublished={handleDeletePublishedResult}
                        onUnlock={handleUnlockResult}
                        onTabChange={setActiveTab}
                    />
                )}

                {activeTab === 'students' && (
                    <StudentDirectory
                        students={users.filter(u => u.role === 'student' && u.status === 'active')}
                        onDelete={handleRejectUser}
                        onUpdate={handleUpdateUser}
                    />
                )}

                {activeTab === 'teachers' && (
                    <TeacherDirectory
                        teachers={users.filter(u => u.role === 'teacher')}
                        onDelete={handleRejectUser}
                        onUpdate={handleUpdateUser}
                    />
                )}

                {activeTab === 'announcements' && (
                    <AnnouncementManager isAdmin={true} initialData={announcements} />
                )}

                {activeTab === 'letters' && (
                    <AppreciationLetters
                        students={users.filter(u => u.role === 'student' && u.status === 'active')}
                        results={allResults}
                    />
                )}

                {activeTab === 'library' && (
                    <LibraryManager
                        books={books}
                        onAddBook={handleAddBook}
                        onDeleteBook={handleDeleteBook}
                    />
                )}

                {activeTab === 'activity' && (
                    <ActivityLogs logs={activityLogs} />
                )}

                {activeTab === 'notifications' && (
                    <Notifications
                        notifications={notifications}
                        onMarkRead={async (id: string) => {
                            try {
                                const res = await fetch('/api/notifications', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'x-actor-role': 'admin',
                                        'x-actor-id': user?.id || ''
                                    },
                                    body: JSON.stringify({ id })
                                });
                                if (res.ok) {
                                    success('Notification marked read');
                                    refresh();
                                }
                            } catch (e) {
                                console.error('Failed to mark notification read', e);
                            }
                        }}
                    />
                )}

                {activeTab === 'settings' && (
                    <SettingsManager
                        maintenanceMode={maintenanceMode}
                        onToggleMaintenance={handleToggleMaintenance}
                        subjects={subjects}
                        onAddSubject={handleAddSubject}
                        onDeleteSubject={handleDeleteSubject}
                        onResetSystem={handleResetSystem}
                        onChangeAdminPassword={handleChangeAdminPassword}
                        settings={settings}
                        onUpdateSettings={handleUpdateSettings}
                    />
                )}
            </div>
        </PortalSidebarLayout>
    );
}

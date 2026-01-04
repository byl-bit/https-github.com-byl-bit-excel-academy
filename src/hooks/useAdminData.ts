'use client';

import { useState, useEffect, useCallback } from 'react';
import { normalizeGender } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { calculateStats, type SystemStats } from "@/lib/utils/stats";
import { getActivityLogs, type ActivityLog } from "@/lib/utils/activityLog";
import type { SubjectAllocation } from "@/lib/mockData";
import type { PendingResult, PublishedResult } from '@/lib/types';

export interface User {
    id: string;
    name: string;
    fullName?: string;
    email: string;
    role: 'admin' | 'student' | 'teacher';
    status: 'active' | 'pending';
    studentId?: string;
    teacherId?: string;
    grade?: string;
    section?: string;
    gender?: string;
    createdAt?: string;
}

export interface AdmissionApplication {
    id: string;
    studentName?: string;
    familyFullName: string;
    email: string;
    phoneNumber: string;
    grade: string;
    age: string;
    gender: string;
    previousSchool: string;
    location: string;
    fileName?: string;
    submittedAt: string;
}

export interface Book {
    id: string;
    title: string;
    author: string;
    grade: string;
    subject: string;
    downloadUrl?: string; // Mapped from file_url
    description: string;
    uploadedAt: string; // Mapped from created_at
    videoUrl?: string; // Added field
}

export interface Announcement {
    id: string;
    title: string;
    body: string;
    date: string;
    type: 'general' | 'academic' | 'event';
    imageUrl?: string;
}

export function useAdminData() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [users, setUsers] = useState<User[]>([]);
    const [admissions, setAdmissions] = useState<AdmissionApplication[]>([]);
    const [subjects, setSubjects] = useState<string[]>([]);
    const [allResults, setAllResults] = useState<PublishedResult[]>([]);
    const [pendingResults, setPendingResults] = useState<PendingResult[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
    const [settings, setSettings] = useState<Record<string, unknown>>({});
    const [allocations, setAllocations] = useState<SubjectAllocation[]>([]);
    const [resetRequests, setResetRequests] = useState<unknown[]>([]);

    const loadData = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        setError(null);
        try {
            // Disable hydration/browser caching for admin data
            const noCache = { cache: 'no-store' } as RequestInit;

            const [userRes, appRes, subRes, resRes, bookRes, announceRes, settingsRes, allocRes, resetRes, notificationsRes] = await Promise.all([
                fetch('/api/users', noCache),
                fetch('/api/admissions', noCache),
                fetch('/api/subjects', noCache),
                fetch('/api/results', {
                    headers: {
                        'x-actor-role': 'admin',
                        'x-actor-id': user?.id || ''
                    },
                    ...noCache
                }),
                fetch('/api/resources', noCache), // Use new resources API
                fetch('/api/announcements', noCache),
                fetch('/api/settings', noCache),
                fetch('/api/allocations', noCache),
                fetch('/api/admin/reset-requests', { headers: { 'x-actor-role': 'admin' }, ...noCache }),
                fetch('/api/notifications', { headers: { 'x-actor-role': 'admin' }, ...noCache })
            ]);

            const fetchedUsers = userRes.ok ? await userRes.json() : [];
            const fetchedAdmissions = appRes.ok ? await appRes.json() : [];
            const fetchedSubjects = subRes.ok ? await subRes.json() : [];
            const fetchedResultsRaw = resRes.ok ? await resRes.json() : { published: {}, pending: {} };
            const fetchedBooks = bookRes.ok ? await bookRes.json() : [];
            console.log('UseAdminData: Fetched Resources:', fetchedBooks);
            const fetchedAnnouncements = announceRes.ok ? await announceRes.json() : [];
            const fetchedSettings = settingsRes.ok ? await settingsRes.json() : {};
            const fetchedAllocations = allocRes.ok ? await allocRes.json() : [];
            const fetchedResetRequests = resetRes.ok ? await resetRes.json() : [];

            setUsers(fetchedUsers);
            setAdmissions(fetchedAdmissions);
            setSubjects(fetchedSubjects.length ? fetchedSubjects : [
                'Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Computer Science'
            ]);

            const fetchedResults = (typeof fetchedResultsRaw === 'object' && fetchedResultsRaw !== null)
                ? (fetchedResultsRaw as { published?: Record<string, Record<string, unknown>>, pending?: Record<string, Record<string, unknown>> })
                : { published: {}, pending: {} };

            const published = fetchedResults.published || {};
            const pending = fetchedResults.pending || {};

            setAllResults(Object.keys(published).map(k => {
                const r = (published[k] as unknown as Record<string, unknown>) || {};
                return ({
                    key: k,
                    studentId: (r['student_id'] ?? r['studentId'] ?? k) as string,
                    studentName: (r['student_name'] ?? r['studentName'] ?? '') as string,
                    grade: String(r['grade'] ?? ''),
                    section: String(r['section'] ?? ''),
                    rollNumber: r['roll_number'] ?? r['rollNumber'] ?? null,
                    gender: normalizeGender(r['gender'] ?? r['sex'] ?? null) || null,
                    subjects: ((r['subjects'] || []) as any[]).map(s => ({
                        name: s.name || s.subject || '',
                        marks: Number(s.marks || 0),
                        status: s.status || 'published',
                        ...(s.assessments ? { assessments: s.assessments } : {})
                    })),
                    total: Number(r['total'] ?? 0),
                    average: Number(r['average'] ?? 0),
                    rank: r['rank'] ?? null,
                    conduct: r['conduct'] ?? null,
                    result: r['result'] ?? null,
                    promotedOrDetained: r['promoted_or_detained'] ?? r['promotedOrDetained'] ?? null,
                    status: r['status'] ?? 'published',
                    published_at: r['published_at'] ?? r['publishedAt'] ?? null
                } as unknown as PublishedResult);
            }));

            setPendingResults(Object.keys(pending).map(k => {
                const r = (pending[k] as unknown as Record<string, unknown>) || {};
                return ({
                    key: k,
                    studentId: (r['student_id'] ?? r['studentId'] ?? k) as string,
                    studentName: (r['student_name'] ?? r['studentName'] ?? '') as string,
                    grade: String(r['grade'] ?? ''),
                    section: String(r['section'] ?? ''),
                    rollNumber: r['roll_number'] ?? r['rollNumber'] ?? null,
                    gender: normalizeGender(r['gender'] ?? r['sex'] ?? null) || null,
                    subjects: ((r['subjects'] || []) as any[]).map(s => ({
                        name: s.name || s.subject || '',
                        marks: Number(s.marks || 0),
                        status: s.status || 'pending_admin',
                        ...(s.assessments ? { assessments: s.assessments } : {})
                    })),
                    total: Number(r['total'] ?? 0),
                    average: Number(r['average'] ?? 0),
                    rank: r['rank'] ?? null,
                    conduct: r['conduct'] ?? null,
                    result: r['result'] ?? null,
                    promotedOrDetained: r['promoted_or_detained'] ?? r['promotedOrDetained'] ?? null,
                    status: r['status'] ?? 'pending',
                    submitted_by: r['submitted_by'] ?? r['submittedBy'] ?? null,
                    submitted_at: r['submitted_at'] ?? r['submittedAt'] ?? null
                } as unknown as PendingResult);
            }));

            // Map resources to Book interface
            setBooks(fetchedBooks.map((r: any) => ({
                id: r.id,
                title: r.title,
                author: r.author || '',
                grade: r.grade || '',
                subject: r.subject || '',
                downloadUrl: r.file_url,
                videoUrl: r.video_url,
                description: r.description || '',
                uploadedAt: r.created_at
            })));

            setAnnouncements(fetchedAnnouncements);

            setSystemStats(calculateStats(fetchedUsers, published, pending, fetchedAnnouncements, fetchedBooks)); // fetchedBooks is now resources list, stats might need adjustment if it expects Book type, but stats logic usually counts length, which is array so it works.
            setActivityLogs(getActivityLogs());

            // Notifications fetched from server
            try {
                const notifBody = notificationsRes.ok ? await notificationsRes.json() : { notifications: [], unreadCount: 0 };
                setNotifications(notifBody.notifications || []);
                setUnreadNotifications(notifBody.unreadCount || 0);
            } catch (notifErr) {
                console.error('Failed to parse notifications', notifErr);
                setNotifications([]);
                setUnreadNotifications(0);
            }

            setSettings(fetchedSettings as Record<string, unknown>);
            setAllocations(fetchedAllocations);
            setResetRequests(fetchedResetRequests as unknown[]);

        } catch (e) {
            console.error("Failed to load admin data", e);
            setError("Failed to load system data. Please refresh.");
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]); // Added dependency

    useEffect(() => {
        if (isAuthenticated && user?.role === 'admin') {
            loadData();
        }
    }, [isAuthenticated, user, loadData]);

    return {
        isLoading,
        error,
        users,
        admissions,
        subjects,
        allResults,
        pendingResults,
        books,
        announcements,
        systemStats,
        activityLogs,
        notifications,
        unreadNotifications,
        settings,
        allocations,
        resetRequests,
        refresh: loadData
    };
}

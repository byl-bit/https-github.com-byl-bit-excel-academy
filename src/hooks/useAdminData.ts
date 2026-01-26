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
    student_id: string;
    key?: string;
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
    audience?: 'all' | 'students' | 'teachers';
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

    const [loadedCategories, setLoadedCategories] = useState<Set<string>>(new Set());

    const loadData = useCallback(async (silent = false, category: 'all' | 'essentials' | 'users' | 'results' | 'admissions' | 'resources' = 'all') => {
        if (!silent) setIsLoading(true);
        setError(null);
        try {
            const noCache = { cache: 'no-store' } as RequestInit;
            const authHeaders = {
                headers: {
                    'x-actor-role': 'admin',
                    'x-actor-id': user?.id || ''
                },
                ...noCache
            };

            // ESSENTIALS (Fast, required for Overview)
            if (category === 'all' || category === 'essentials') {
                const [settingsRes, announceRes, subRes, statsRes, notificationsRes] = await Promise.all([
                    fetch('/api/settings', noCache),
                    fetch('/api/announcements', noCache),
                    fetch('/api/subjects', noCache),
                    fetch('/api/admin/stats', authHeaders),
                    fetch('/api/notifications', authHeaders)
                ]);

                const fetchedSettings = settingsRes.ok ? await settingsRes.json() : {};
                const fetchedAnnouncements = (announceRes.ok ? await announceRes.json() : []) || [];
                const fetchedSubjects = (subRes.ok ? await subRes.json() : []) || [];
                const fetchedStats = statsRes.ok ? await statsRes.json() : null;

                setSettings(fetchedSettings);
                setAnnouncements(fetchedAnnouncements);
                setSubjects(Array.isArray(fetchedSubjects) && fetchedSubjects.length ? fetchedSubjects : ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Computer Science']);
                if (fetchedStats) setSystemStats(fetchedStats);

                try {
                    const notifBody = notificationsRes.ok ? await notificationsRes.json() : { notifications: [], unreadCount: 0 };
                    setNotifications(notifBody.notifications || []);
                    setUnreadNotifications(notifBody.unreadCount || 0);
                } catch (e) { console.error('Notif parse err'); }

                setLoadedCategories(prev => new Set(prev).add('essentials'));

                // If loading all or specifically heavy categories, don't return, continue below
                if (category === 'essentials') return;
            }

            // HEAVY DATA (Background load or On-Demand)
            if (category === 'all' || category === 'users' || category === 'results' || category === 'admissions' || category === 'resources') {
                const tasks: Promise<any>[] = [];
                const taskMap: string[] = [];

                if (category === 'all' || category === 'users') { tasks.push(fetch('/api/users', noCache)); taskMap.push('users'); }
                if (category === 'all' || category === 'results') { tasks.push(fetch('/api/results', authHeaders)); taskMap.push('results'); }
                if (category === 'all' || category === 'admissions') { tasks.push(fetch('/api/admissions', noCache)); taskMap.push('admissions'); }
                if (category === 'all' || category === 'resources') { tasks.push(fetch('/api/resources', noCache)); taskMap.push('resources'); }
                tasks.push(fetch('/api/allocations', noCache)); taskMap.push('allocations');
                tasks.push(fetch('/api/admin/reset-requests', authHeaders)); taskMap.push('resets');

                const results = await Promise.all(tasks);

                for (let i = 0; i < results.length; i++) {
                    const res = results[i];
                    const type = taskMap[i];
                    if (!res.ok) continue;

                    try {
                        const data = await res.json();

                        if (type === 'users') {
                            setUsers(data);
                        } else if (type === 'results') {
                            const published = data.published || {};
                            const pending = data.pending || {};

                            setAllResults(Object.keys(published).map(k => {
                                const r = (published[k] as any) || {};
                                return {
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
                                } as PublishedResult;
                            }));

                            setPendingResults(Object.keys(pending).map(k => {
                                const r = (pending[k] as any) || {};
                                return {
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
                                } as PendingResult;
                            }));
                        } else if (type === 'admissions') {
                            setAdmissions(data);
                        } else if (type === 'resources') {
                            setBooks(data.map((r: any) => ({
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
                        } else if (type === 'allocations') {
                            setAllocations(data);
                        } else if (type === 'resets') {
                            setResetRequests((data as any[]).map(r => {
                                const userData = Array.isArray(r.users) ? r.users[0] : r.users;
                                return {
                                    id: r.id,
                                    userId: r.user_id,
                                    userName: userData?.name || 'User',
                                    userRole: userData?.role || 'student',
                                    email: userData?.email || '',
                                    grade: userData?.grade || '',
                                    section: userData?.section || '',
                                    rollNumber: userData?.roll_number || '',
                                    gender: userData?.gender || '',
                                    photo: userData?.photo || '',
                                    studentId: userData?.student_id || '',
                                    teacherId: userData?.teacher_id || '',
                                    timestamp: r.created_at,
                                    token: r.token,
                                    expires_at: r.expires_at
                                };
                            }));
                        }
                    } catch (err) {
                        console.error(`Error parsing ${type} data:`, err);
                    }
                }

                setLoadedCategories(prev => {
                    const next = new Set(prev);
                    if (category === 'all') {
                        ['users', 'results', 'admissions', 'resources'].forEach(c => next.add(c));
                    } else {
                        next.add(category);
                    }
                    return next;
                });
            }

            setActivityLogs(getActivityLogs());
        } catch (e) {
            console.error("Failed to load admin data", e);
            setError("Failed to load system data. Please refresh.");
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (isAuthenticated && user?.role === 'admin') {
            // Loading sequence: 1. Essentials first, then everything else
            const init = async () => {
                await loadData(false, 'essentials');
                await loadData(true, 'all');
            };
            init();
        }
    }, [isAuthenticated, user?.role, loadData]); // Removed unnecessary dependencies and fixed trigger

    useEffect(() => {
        // Only calculate stats on client if we have the full data and server stats haven't loaded yet
        // In most cases, we prefer the server-calculated stats for accuracy and speed
        if (users.length > 0 && (allResults.length > 0 || pendingResults.length > 0)) {
            const resultsRecord: Record<string, any> = {};
            allResults.forEach(r => { if (r.studentId) resultsRecord[r.studentId] = r; });
            const pendingRecord: Record<string, any> = {};
            pendingResults.forEach(r => { if (r.studentId) pendingRecord[r.studentId] = r; });

            setSystemStats(prev => ({
                ...(prev || {}),
                ...calculateStats(users, resultsRecord, pendingRecord, announcements, books)
            } as SystemStats));
        }
    }, [users, allResults, pendingResults, announcements, books]);

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

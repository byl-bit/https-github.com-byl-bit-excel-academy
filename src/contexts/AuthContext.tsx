'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
    id: string;
    name: string;
    studentId?: string;
    teacherId?: string;
    role: 'admin' | 'student' | 'teacher';
    status: 'active' | 'pending';
    grade?: string;
    section?: string;
    email?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    fullName?: string; // Keep for backward compat if needed, but we'll try to migrate
    photo?: string; // base64 encoded photo or URL
    gender?: string; // Gender: Male, Female, Other
    rollNumber?: string; // Class Roll Number
    adminId?: string; // Admin ID for recovery/identification
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<{ success: boolean; message?: string; user?: User }>;
    logout: () => void;
    register: (firstName: string, middleName: string, lastName: string, password: string, grade?: string, section?: string, photo?: string, gender?: string, rollNumber?: string) => Promise<{ success: boolean; message?: string; studentId?: string }>;
    registerTeacher: (fullName: string, sex: string, grade: string, section: string, password: string, photo?: string) => Promise<{ success: boolean; message?: string; teacherId?: string }>;
    isAuthenticated: boolean;
    isLoading: boolean;
    getPendingUsers: () => User[];
    approveUser: (userId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Mock database - In production, this would be an actual database
const STORAGE_KEYS = {
    USERS: 'excel_academy_users',
    CURRENT_USER: 'excel_academy_current_user',
    PENDING_USERS: 'excel_academy_pending_users',
};

// Initialize with default admin
const initializeDefaultUsers = () => {
    if (typeof window === 'undefined') return;

    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!users) {
        const defaultUsers = [
            {
                id: `AD-${new Date().getFullYear()}-001`,
                adminId: `AD-${new Date().getFullYear()}-001`,
                fullName: 'Admin User',
                email: 'administrator@excel.edu',
                password: 'Admin123', // In production, this should be hashed
                role: 'admin',
                status: 'active',
            },
        ];
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
    }
};

// Generate unique student ID
const generateStudentId = (): string => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ST-${year}-${random}`;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Proactive cleanup for legacy storage that might be filling up quota
    useEffect(() => {
        try {
            const legacyUsers = localStorage.getItem(STORAGE_KEYS.USERS);
            if (legacyUsers && legacyUsers.length > 2 * 1024 * 1024) {
                console.info('Clearing large legacy local users data to free up quota.');
                localStorage.removeItem(STORAGE_KEYS.USERS);
            }
        } catch (e) { }
    }, []);

    useEffect(() => {
        // Check if user is logged in
        const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                setUser(parsedUser);
                setIsAuthenticated(true);
            } catch (e) {
                console.error("Failed to parse user session", e);
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (emailOrId: string, password: string): Promise<{ success: boolean; message?: string; user?: User }> => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailOrId, password })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Login failed' }));
                return { success: false, message: err.error || 'Invalid credentials' };
            }

            const payload = await res.json();
            if (!payload.success || !payload.user) return { success: false, message: payload.error || 'Invalid credentials' };

            const userSession: User = payload.user;

            if (userSession.status === 'pending') {
                return { success: false, message: 'Your account is pending admin approval' };
            }

            setUser(userSession);
            setIsAuthenticated(true);

            try {
                localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userSession));
            } catch (err) {
                console.warn('LocalStorage quota exceeded. Storing user session without photo.', err);
                try {
                    // Try saving without the photo (usually the largest part)
                    const { photo, ...strippedUser } = userSession;
                    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(strippedUser));
                } catch (innerErr) {
                    console.error('Failed to save even stripped user session to localStorage:', innerErr);
                    // At this point, localStorage is completely full. 
                    // We might want to clear other keys, but for now we just fail silently to not crash the login experience.
                }
            }

            return { success: true, user: userSession };
        } catch (error) {
            console.error(error);
            return { success: false, message: 'Login service unavailable' };
        }
    };

    const register = async (
        firstName: string,
        middleName: string,
        lastName: string,
        password: string,
        grade?: string,
        section?: string,
        photo?: string,
        gender?: string,
        rollNumber?: string
    ): Promise<{ success: boolean; message?: string; studentId?: string }> => {
        try {
            if (rollNumber) {
                const roll = parseInt(rollNumber);
                if (isNaN(roll) || roll < 1 || roll > 100) {
                    return { success: false, message: 'Roll number must be between 1 and 100.' };
                }
            }

            // 1. SMART MATCHING: Check for collisions based on Full Name within the target class
            let existingMatch = null;
            if (grade && section) {
                const checkRes = await fetch(`/api/users?role=student&grade=${grade}&section=${section}`);
                const classUsers = checkRes.ok ? await checkRes.json() : [];
                const cleanNormalize = (s: string) => (s || '').trim().replace(/\s+/g, ' ').toLowerCase();
                const targetFullName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim().replace(/\s+/g, ' ').toLowerCase();

                existingMatch = classUsers.find((u: any) =>
                    cleanNormalize(u.name || u.fullName || '') === targetFullName
                );
            }

            const clean = (s: string) => (s || '').trim().replace(/\s+/g, ' ');
            const fullName = [clean(firstName), clean(middleName), clean(lastName)].filter(Boolean).join(' ');

            // If an active account already exists with this identity, block duplication
            if (existingMatch && existingMatch.password) {
                return { success: false, message: 'You already have an account.' };
            }

            // Always generate a FRESH Student ID during registration (as requested)
            const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
            const year = new Date().getFullYear();
            const finalStudentId = `ST-${year}-${randomPart}`;

            let isUpdate = false;
            let placeholder: any = null;

            if (existingMatch && !existingMatch.password) {
                // It's a placeholder from CSV import - we will sync the new ID and credentials to it
                placeholder = existingMatch;
                isUpdate = true;
            }

            const newUser = {
                id: `user-${Date.now()}`, // Always use a unique ID for the application record
                name: fullName,
                firstName,
                middleName,
                lastName,
                email: isUpdate ? placeholder.email : `${finalStudentId.toLowerCase()}@excel.edu`,
                studentId: finalStudentId,
                password,
                role: 'student',
                // Student accounts require admin approval before being active
                status: 'pending',
                grade,
                section,
                rollNumber,
                photo,
                gender,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isImported: isUpdate // Flag to help admin linking
            };

            let postRes: Response;

            if (isUpdate && placeholder && placeholder.id) {
                // Update the existing placeholder record instead of inserting a new one
                const { isImported, ...payloadBase } = newUser as any;
                const payload = { ...payloadBase, id: placeholder.id };
                postRes = await fetch('/api/users', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                postRes = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newUser)
                });
            }

            const data = await postRes.json().catch(() => ({}));

            if (postRes.ok) {
                return {
                    success: true,
                    message: 'Registration submitted. Await admin approval to access the system.',
                    studentId: finalStudentId
                };
            } else {
                return { success: false, message: data.error || data.message || 'Registration failed server-side.' };
            }
        } catch (e) {
            console.error('Registration error:', e);
            return { success: false, message: 'Registration error.' };
        }
    };

    // Teacher registration: creates a pending teacher account for admin approval
    const registerTeacher = async (
        fullName: string,
        sex: string,
        grade: string,
        section: string,
        password: string,
        photo?: string
    ): Promise<{ success: boolean; message?: string; teacherId?: string }> => {
        try {
            // We no longer fetch all users here. The backend will handle duplicate checks.

            const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
            const teacherId = `TE-${new Date().getFullYear()}-${randomPart}`;

            const newUser = {
                id: `teacher-${Date.now()}`,
                name: fullName,
                email: `${teacherId.toLowerCase()}@excel.edu`,
                teacherId,
                password,
                role: 'teacher',
                status: 'pending',
                grade,
                section,
                gender: sex,
                photo,
                createdAt: new Date().toISOString(),
            };

            const postRes = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });

            if (postRes.ok) {
                return { success: true, message: 'Teacher registration submitted. Await admin approval.', teacherId };
            }
            return { success: false, message: 'Failed to submit registration.' };
        } catch (e) {
            console.error(e);
            return { success: false, message: 'Registration error.' };
        }
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    };

    // Admin Helper to get pending users (Not typically used in context but exposed)
    const getPendingUsers = () => {
        // This function is synchronous in the interface but needs to be async or handled in component
        // For backwards compatibility, we warn or return empty and let AdminPage handle fetching independently
        console.warn("getPendingUsers in AuthContext is deprecated. Use direct API fetch.");
        return [];
    };

    // Admin Helper to approve user
    const approveUser = (userId: string) => {
        // Fire and forget update - admin page should reload data after calling this
        const update = async () => {
            try {
                await fetch('/api/users', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: userId, status: 'active' })
                });
            } catch (error) {
                console.error('Failed to approve user:', error);
            }
        };
        update();
        return true;
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register, registerTeacher, isAuthenticated, isLoading, getPendingUsers, approveUser } as any}>
            {children}
        </AuthContext.Provider>
    );
};

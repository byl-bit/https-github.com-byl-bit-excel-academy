'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useRequireAuth(allowedRoles?: ('admin' | 'teacher' | 'student')[]) {
    const auth = useAuth();
    const { user, isAuthenticated } = auth;
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }

        if (allowedRoles && user && !allowedRoles.includes(user.role)) {
            // Redirect to user's appropriate portal or home
            if (user.role === 'admin') {
                router.push('/admin');
            } else if (user.role === 'student') {
                router.push('/student');
            } else if (user.role === 'teacher') {
                router.push('/teacher');
            } else {
                router.push('/');
            }
        }
    }, [isAuthenticated, user, allowedRoles, router]);

    return { ...auth };
}

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout

export function useSessionTimeout() {
    const { logout } = useAuth();
    const router = useRouter();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef<number>(0);

    const resetTimeout = useCallback(() => {
        lastActivityRef.current = Date.now();

        // Clear existing timeouts
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (warningTimeoutRef.current) {
            clearTimeout(warningTimeoutRef.current);
        }

        const schedule = () => {
            // Set warning timeout (5 minutes before session expires)
            warningTimeoutRef.current = setTimeout(() => {
                const timeLeft = Math.ceil(WARNING_TIME / 1000 / 60); // Time left until logout
                const shouldExtend = window.confirm(
                    `Your session will expire in ${timeLeft} minutes. Click OK to extend your session, or Cancel to logout now.`
                );
                if (shouldExtend) {
                    schedule();
                } else {
                    logout();
                    router.push('/auth/login');
                }
            }, SESSION_TIMEOUT - WARNING_TIME);

            // Set logout timeout
            timeoutRef.current = setTimeout(() => {
                alert('Your session has expired due to inactivity. You will be logged out.');
                logout();
                router.push('/auth/login');
            }, SESSION_TIMEOUT);
        };

        schedule();
    }, [logout, router]);

    useEffect(() => {
        // Set up activity listeners
        const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        const handleActivity = () => {
            const timeSinceLastActivity = Date.now() - lastActivityRef.current;
            // Only reset if user has been active in the last minute (prevents constant resets)
            if (timeSinceLastActivity > 60000) {
                resetTimeout();
            }
        };

        activities.forEach(activity => {
            document.addEventListener(activity, handleActivity, true);
        });

        // Initialize activity timestamp and setup timeout
        lastActivityRef.current = Date.now();
        resetTimeout();

        // Cleanup
        return () => {
            activities.forEach(activity => {
                document.removeEventListener(activity, handleActivity, true);
            });
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (warningTimeoutRef.current) {
                clearTimeout(warningTimeoutRef.current);
            }
        };
    }, [resetTimeout]);
}


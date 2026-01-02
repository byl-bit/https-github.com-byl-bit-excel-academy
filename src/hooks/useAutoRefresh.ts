'use client';

import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook to automatically refresh data when:
 * 1. Page/tab becomes visible (user switches back to tab)
 * 2. After a specified interval
 * 3. On manual trigger
 * 
 * Includes debounce logic to prevent excessive refreshes
 */
export function useAutoRefresh(
    refreshFn: () => void | Promise<void>,
    options: {
        enabled?: boolean;
        interval?: number; // Refresh interval in milliseconds (default: 60 seconds)
        refreshOnFocus?: boolean; // Refresh when tab becomes visible (default: true)
        refreshOnMount?: boolean; // Refresh on component mount (default: true)
        minInterval?: number; // Minimum time between refreshes (default: 5 seconds)
    } = {}
) {
    const {
        enabled = true,
        interval = 60000, // 60 seconds default (increased from 30)
        refreshOnFocus = true,
        refreshOnMount = true,
        minInterval = 5000 // Minimum 5 seconds between refreshes
    } = options;

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const refreshFnRef = useRef(refreshFn);
    const lastRefreshRef = useRef<number>(0);
    const isRefreshingRef = useRef<boolean>(false);
    const mountedRef = useRef<boolean>(false);

    // Keep refresh function reference updated
    useEffect(() => {
        refreshFnRef.current = refreshFn;
    }, [refreshFn]);

    const refresh = useCallback(async () => {
        // Prevent concurrent refreshes
        if (isRefreshingRef.current) {
            return;
        }

        // Debounce: prevent refreshes that are too close together
        const now = Date.now();
        if (now - lastRefreshRef.current < minInterval) {
            return;
        }

        try {
            isRefreshingRef.current = true;
            lastRefreshRef.current = now;
            await refreshFnRef.current();
        } catch (error) {
            console.error('Auto-refresh error:', error);
        } finally {
            isRefreshingRef.current = false;
        }
    }, [minInterval]);

    // Track mount state
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Initial refresh on mount - only once
    useEffect(() => {
        if (enabled && refreshOnMount && mountedRef.current) {
            // Use a small delay to prevent immediate double-fetch scenarios
            const timeout = setTimeout(() => {
                if (mountedRef.current) {
                    refresh();
                }
            }, 100);
            return () => clearTimeout(timeout);
        }
    }, [enabled, refreshOnMount, refresh]);

    // Set up interval refresh
    useEffect(() => {
        if (!enabled || interval <= 0) return;

        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(() => {
            if (mountedRef.current) {
                refresh();
            }
        }, interval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [enabled, interval, refresh]);

    // Refresh on page visibility change (user switches tabs)
    useEffect(() => {
        if (!enabled || !refreshOnFocus) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && mountedRef.current) {
                // Add a small delay for visibility change to prevent rapid refreshes
                setTimeout(() => {
                    if (mountedRef.current && document.visibilityState === 'visible') {
                        refresh();
                    }
                }, 200);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [enabled, refreshOnFocus, refresh]);

    return { refresh };
}


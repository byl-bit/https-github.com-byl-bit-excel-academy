// Activity Log System for tracking admin actions

export interface ActivityLog {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    action: string;
    category: 'user' | 'result' | 'system' | 'announcement' | 'library' | 'teacher' | 'settings' | 'attendance';
    details: string;
    targetId?: string;
    targetName?: string;
    ipAddress?: string;
}

const ACTIVITY_LOG_KEY = 'excel_academy_activity_log';

export const logActivity = (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    // If on server, just log to console for now (or TODO: insert into Supabase logs table)
    if (typeof window === 'undefined') {
        console.log(`[ACTIVITY LOG] ${activity.action} by ${activity.userName}: ${activity.details}`);
        return;
    }

    try {
        const logs = getActivityLogs();
        const newLog: ActivityLog = {
            ...activity,
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
        };
        logs.unshift(newLog); // Add to beginning

        // Keep only last 200 logs to prevent localStorage quota issues
        if (logs.length > 200) {
            logs.splice(200);
        }

        localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(logs));
    } catch (e) {
        console.warn('Failed to log activity to localStorage:', e);
        // Optional: clear oldest logs or clear everything if quota hit
        if (e instanceof Error && e.name === 'QuotaExceededError') {
            try {
                localStorage.removeItem(ACTIVITY_LOG_KEY);
            } catch (clearErr) {
                console.error('Failed to even clear logs:', clearErr);
            }
        }
    }
};

export const getActivityLogs = (): ActivityLog[] => {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(ACTIVITY_LOG_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Failed to read activity logs:', e);
        return [];
    }
};

export const clearActivityLogs = () => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(ACTIVITY_LOG_KEY);
    } catch (e) {
        console.error('Failed to clear activity logs:', e);
    }
};

export const filterActivityLogs = (
    logs: ActivityLog[],
    filters: {
        category?: string;
        action?: string;
        userId?: string;
        dateFrom?: string;
        dateTo?: string;
        search?: string;
    }
): ActivityLog[] => {
    return logs.filter(log => {
        if (filters.category && log.category !== filters.category) return false;
        if (filters.action && !log.action.toLowerCase().includes(filters.action.toLowerCase())) return false;
        if (filters.userId && log.userId !== filters.userId) return false;
        if (filters.dateFrom && log.timestamp < filters.dateFrom) return false;
        if (filters.dateTo && log.timestamp > filters.dateTo) return false;
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            return (
                log.action.toLowerCase().includes(searchLower) ||
                log.details.toLowerCase().includes(searchLower) ||
                log.userName.toLowerCase().includes(searchLower) ||
                (log.targetName && log.targetName.toLowerCase().includes(searchLower))
            );
        }
        return true;
    });
};


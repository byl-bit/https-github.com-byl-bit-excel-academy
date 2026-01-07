'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Notifications } from '@/components/Notifications';
import { useToast } from '@/contexts/ToastContext';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function TeacherNotificationsPage() {
    const { user } = useRequireAuth(['teacher']) as any;
    const { success, error: notifyError } = useToast();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const res = await fetch('/api/notifications', {
                headers: {
                    'x-actor-role': 'teacher',
                    'x-actor-id': user.id
                }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
            }
        } catch (e) {
            console.error('Failed to fetch notifications', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [user]);

    const handleMarkRead = async (id: string) => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-actor-role': 'teacher',
                    'x-actor-id': user?.id || ''
                },
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                success('Notification marked read');
                fetchNotifications();
            }
        } catch (e) {
            console.error('Failed to mark notification read', e);
            notifyError('Failed to update notification');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight underline decoration-blue-500/20 underline-offset-8">Notifications</h1>
            </div>

            {notifications.length === 0 ? (
                <Card className="p-12 text-center border-dashed border-2 flex flex-col items-center gap-4 bg-slate-50/50">
                    <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                        <span className="text-2xl">🔔</span>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-sm italic">You have no new notifications.</p>
                </Card>
            ) : (
                <Notifications
                    notifications={notifications}
                    onMarkRead={handleMarkRead}
                />
            )}
        </div>
    );
}

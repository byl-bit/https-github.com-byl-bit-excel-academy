'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bell, BookOpen, AlertCircle, FileText, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/ToastContext';

interface Notification {
    id: string;
    type: string;
    category: string;
    action: string;
    details: string;
    is_read: boolean;
    created_at: string;
}

export default function StudentNotifications() {
    const { user } = useAuth();
    const { success, toast } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            // Fetch notifications for this specific user OR broadcast ones (where user_id is null)
            const res = await fetch(`/api/notifications?userId=${user.id}`, {
                headers: {
                    'x-actor-role': 'student',
                    'x-actor-id': user.id
                }
            });
            if (res.ok) {
                const data = await res.json();
                // Handle the { notifications: [], unreadCount: 0 } structure
                setNotifications(data.notifications || []);
            }
        } catch (e) {
            console.error('Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [user]);

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch(`/api/notifications`, {
                method: 'POST', // Use POST as defined in the route for updating
                headers: {
                    'Content-Type': 'application/json',
                    'x-actor-role': 'student',
                    'x-actor-id': user?.id || ''
                },
                body: JSON.stringify({ id, is_read: true })
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
                success("Marked as read");
            }
        } catch (e) {
            console.error('Failed to mark as read');
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            const res = await fetch(`/api/notifications?id=${id}`, {
                method: 'DELETE',
                headers: {
                    'x-actor-role': 'student',
                    'x-actor-id': user?.id || ''
                }
            });
            if (res.ok) {
                setNotifications(prev => prev.filter(n => n.id !== id));
                success("Notification deleted");
            }
        } catch (e) {
            console.error('Failed to delete notification');
        }
    };

    const getIcon = (category: string) => {
        switch (category) {
            case 'library': return <BookOpen className="h-5 w-5 text-blue-500" />;
            case 'announcement': return <AlertCircle className="h-5 w-5 text-amber-500" />;
            case 'result': return <FileText className="h-5 w-5 text-emerald-500" />;
            default: return <Bell className="h-5 w-5 text-slate-500" />;
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading notifications...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">System Notifications</h1>
                    <p className="text-slate-500 font-bold mt-1">Stay updated with the latest school activity.</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
                    <Bell className="h-6 w-6 text-blue-600" />
                </div>
            </div>

            {notifications.length === 0 ? (
                <Card className="border-dashed bg-slate-50/50">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-6">
                            <CheckCircle2 className="h-10 w-10 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-black text-slate-400">All caught up!</h3>
                        <p className="text-slate-400 font-medium max-w-xs mt-2">There are no new notifications for you at the moment.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {notifications.map((notif) => (
                        <Card key={notif.id} className={`relative overflow-hidden transition-all duration-300 hover:shadow-md border-none ${notif.is_read ? 'bg-white/60 opacity-80' : 'bg-white shadow-sm ring-1 ring-blue-100'}`}>
                            {!notif.is_read && <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />}
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-2xl ${notif.is_read ? 'bg-slate-100' : 'bg-blue-50'}`}>
                                        {getIcon(notif.category)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className={`font-black text-lg ${notif.is_read ? 'text-slate-600' : 'text-slate-800'}`}>
                                                {notif.action}
                                            </h4>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(notif.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-slate-500 font-medium leading-relaxed">{notif.details}</p>
                                        <div className="flex items-center gap-3 pt-3">
                                            {!notif.is_read && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => markAsRead(notif.id)}
                                                    className="h-8 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-700"
                                                >
                                                    Mark as Read
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => deleteNotification(notif.id)}
                                                className="h-8 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

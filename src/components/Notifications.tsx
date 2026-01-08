'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Notification {
    id: string;
    type: string;
    category: string;
    user_id?: string;
    user_name?: string;
    action: string;
    details?: string;
    target_id?: string;
    target_name?: string;
    is_read?: boolean;
    created_at?: string;
}

interface NotificationsProps {
    notifications: Notification[];
    onMarkRead?: (id: string) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    onMarkAllRead?: () => Promise<void>;
    onDeleteAll?: () => Promise<void>;
}

export function Notifications({ notifications, onMarkRead, onDelete, onMarkAllRead, onDeleteAll }: NotificationsProps) {
    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-slate-700" />
                    Notifications
                    {unreadCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">
                            {unreadCount} new
                        </span>
                    )}
                </CardTitle>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[10px] font-black uppercase tracking-widest border-blue-100 text-blue-600 hover:bg-blue-50"
                            onClick={onMarkAllRead}
                        >
                            Read All
                        </Button>
                    )}
                    {notifications.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[10px] font-black uppercase tracking-widest border-red-100 text-red-600 hover:bg-red-50"
                            onClick={onDeleteAll}
                        >
                            Clear All
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {notifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No notifications</div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map(notif => (
                            <div key={notif.id} className={`p-3 rounded-lg border ${notif.is_read ? 'bg-slate-50' : 'bg-white'} flex items-start justify-between gap-4`}>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-semibold">{notif.action}</div>
                                        <div className="text-[11px] text-muted-foreground">{notif.created_at ? new Date(notif.created_at).toLocaleString() : ''}</div>
                                    </div>
                                    <div className="text-xs text-slate-600 mt-1">{notif.details}</div>
                                    <div className="text-[10px] uppercase tracking-wider text-blue-600 mt-1 font-bold">{notif.user_name}</div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {!notif.is_read && (
                                        <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => onMarkRead && onMarkRead(notif.id)}>
                                            <Check className="h-3 w-3 mr-1" /> Read
                                        </Button>
                                    )}
                                    <Button size="sm" variant="ghost" className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete && onDelete(notif.id)}>
                                        <X className="h-3 w-3 mr-1" /> Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

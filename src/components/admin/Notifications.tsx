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
}

export function Notifications({ notifications, onMarkRead }: NotificationsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-slate-700" />
                    Notifications
                </CardTitle>
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
                                        <Button size="sm" onClick={() => onMarkRead && onMarkRead(notif.id)}>
                                            <Check className="h-4 w-4 mr-1" /> Mark read
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

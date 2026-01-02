'use client';

import { Card, CardHeader } from '@/components/ui/glass-card';
import { useAuth } from '@/contexts/AuthContext';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { Bell, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function StudentAnnouncementsPage() {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState<any[]>([]);

    const fetchData = async () => {
        if (!user) return;
        try {
            const res = await fetch('/api/announcements');
            if (res.ok) {
                const data = await res.json();
                setAnnouncements(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error("Failed to fetch announcements");
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    useAutoRefresh(fetchData, {
        enabled: !!user,
        interval: 30000,
        refreshOnFocus: true,
        refreshOnMount: false
    });

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-fade-in-up">
            <Card className="bg-white border-slate-100 shadow-sm">
                <div className="flex items-center gap-4 p-2">
                    <div className="bg-blue-50 p-3 rounded-xl hidden sm:block">
                        <Bell className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-blue-900">School Announcements</h2>
                        <p className="text-sm text-blue-500">Stay updated with the latest news, events, and circulars.</p>
                    </div>
                </div>
            </Card>

            <div className="space-y-6">
                {announcements.length > 0 ? (
                    announcements.map((announcement) => (
                        <Card key={announcement.id} className="overflow-hidden border-t-4 border-t-blue-500 hover:shadow-lg transition-all bg-white border-slate-100">
                            <CardHeader className="pb-3 border-b border-blue-50/50 flex justify-between items-start">
                                <div className="flex items-start gap-3">
                                    <div className="bg-blue-50 p-2 rounded-lg mt-1">
                                        <Bell className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-blue-900 leading-tight">{announcement.title}</h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100`}>
                                                {announcement.type}
                                            </span>
                                            <div className="flex items-center text-blue-500 text-xs font-medium bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                                <Calendar className="mr-2 h-3.5 w-3.5" />
                                                {new Date(announcement.date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <div className="p-6 pt-4">
                                <p className="text-base text-blue-900/80 leading-relaxed whitespace-pre-wrap">
                                    {announcement.body}
                                </p>
                                {(announcement.media && announcement.media.length > 0) ? (() => {
                                    const media = announcement.media;
                                    const count = media.length;
                                    return (
                                        <div className={`mt-6 grid gap-4 ${count === 1 ? 'grid-cols-1' :
                                            count === 2 ? 'grid-cols-2' :
                                                'grid-cols-2 md:grid-cols-3'
                                            }`}>
                                            {media.map((m: any, idx: number) => (
                                                <div key={idx} className={`rounded-xl overflow-hidden border border-blue-100 shadow-sm bg-blue-50/20 ${count === 1 ? 'max-h-[500px]' : 'aspect-square'
                                                    }`}>
                                                    {m.type === 'image' ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={m.url}
                                                            alt={`${announcement.title} ${idx}`}
                                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <video src={m.url} className="w-full h-full object-cover" controls />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })() : announcement.imageUrl ? (
                                    <div className="mt-6 rounded-xl overflow-hidden border border-blue-100 shadow-sm bg-blue-50/20">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={announcement.imageUrl}
                                            alt={announcement.title}
                                            className="w-full h-auto max-h-[500px] object-cover hover:scale-[1.01] transition-transform duration-500"
                                        />
                                    </div>
                                ) : null}
                            </div>
                        </Card>
                    ))
                ) : (
                    <Card>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100">
                                <Bell className="h-8 w-8 text-blue-300" />
                            </div>
                            <h3 className="text-lg font-bold text-blue-900">No Announcements</h3>
                            <p className="text-blue-400">There are no new announcements at the moment.</p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
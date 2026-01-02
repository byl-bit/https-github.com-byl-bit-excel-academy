'use client';

import { useState, useEffect } from 'react';
import { Calendar, Bell } from 'lucide-react';

interface Announcement {
    id: string | number;
    title: string;
    body: string;
    date: string;
    type: string;
    isNew?: boolean;
    media?: Array<{ type: 'image' | 'video'; url: string; name?: string | null }>
}

interface AnnouncementListProps {
    limit?: number;
}

export function AnnouncementList({ limit }: AnnouncementListProps) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const url = limit ? `/api/announcements?limit=${limit}` : '/api/announcements';
                const res = await fetch(url);
                const data = await res.json();
                if (Array.isArray(data)) {
                    setAnnouncements(data);
                }
            } catch (error) {
                console.error('Failed to fetch announcements:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncements();
    }, []);

    if (loading) {
        return (
            <div className="space-y-4 py-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex gap-4">
                        <div className="h-10 w-10 bg-blue-50 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-blue-50 rounded w-1/4" />
                            <div className="h-3 bg-blue-50 rounded w-3/4" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const displayItems = limit ? announcements.slice(0, limit) : announcements;

    if (displayItems.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p>No announcements at this time.</p>
            </div>
        );
    }

    return (
        <div className="divide-y text-left">
            {displayItems.map((ann) => (
                <div key={ann.id} className="py-4 first:pt-0 last:pb-0 group">
                    <div className="flex justify-between items-start mb-1 gap-2">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${ann.type === 'academic' ? 'border-blue-100 text-blue-600 bg-blue-50/50' :
                            ann.type === 'event' ? 'border-sky-100 text-sky-600 bg-sky-50/50' :
                                'border-blue-100 text-blue-500 bg-blue-50/30'
                            }`}>
                            {ann.type}
                        </span>
                        <span className="text-[10px] font-medium text-blue-400 shrink-0 flex items-center gap-1 group-hover:text-blue-500 transition-colors">
                            <Calendar className="h-3 w-3" />
                            {new Date(ann.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="flex-1">
                            <h4 className="font-bold text-blue-900 group-hover:text-blue-600 transition-colors mb-1 line-clamp-1">
                                {ann.title}
                            </h4>
                            <p className="text-sm text-blue-500 line-clamp-2 leading-relaxed mb-3">
                                {ann.body}
                            </p>

                            {(ann.media && ann.media.length > 0) && (() => {
                                const media = ann.media;
                                const count = media.length;
                                return (
                                    <div className={`grid gap-2 mb-2 ${count === 1 ? 'grid-cols-1' :
                                        count === 2 ? 'grid-cols-2' :
                                            'grid-cols-3'
                                        }`}>
                                        {media.map((m, idx) => (
                                            <div key={idx} className={`relative rounded-md overflow-hidden bg-blue-50/50 border border-blue-100 ${count === 1 ? 'aspect-video w-full max-w-sm' : 'aspect-square'
                                                }`}>
                                                {m.type === 'image' ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={m.url} alt={`${ann.title} ${idx}`} className="object-cover w-full h-full" />
                                                ) : (
                                                    <video src={m.url} className="object-cover w-full h-full" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

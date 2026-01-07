'use client';

import { useState, useEffect } from 'react';
import { Calendar, Bell, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { FormattedText } from './FormattedText';
import { SlideshowMedia } from './SlideshowMedia';
import { Button } from './ui/button';

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
    const { user } = useAuth() as any;
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [likes, setLikes] = useState<Record<string, { likes: number, dislikes: number, myVote?: 'like' | 'dislike' }>>({});

    // Initialize likes from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('announcement_votes');
        if (saved) {
            try { setLikes(JSON.parse(saved)); } catch (e) { }
        }
    }, []);

    const handleVote = (id: string | number, vote: 'like' | 'dislike') => {
        const key = String(id);
        const current = likes[key] || { likes: Math.floor(Math.random() * 10), dislikes: Math.floor(Math.random() * 3) };

        let newVote: 'like' | 'dislike' | undefined = vote;
        let newLikes = current.likes;
        let newDislikes = current.dislikes;

        if (current.myVote === vote) {
            // Undo vote
            newVote = undefined;
            if (vote === 'like') newLikes--;
            else newDislikes--;
        } else {
            // New vote or change vote
            if (current.myVote === 'like') newLikes--;
            if (current.myVote === 'dislike') newDislikes--;

            if (vote === 'like') newLikes++;
            else newDislikes++;
        }

        const updated = { ...likes, [key]: { likes: newLikes, dislikes: newDislikes, myVote: newVote } };
        setLikes(updated);
        localStorage.setItem('announcement_votes', JSON.stringify(updated));
    };

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const url = limit ? `/api/announcements?limit=${limit}` : '/api/announcements';
                const headers: Record<string, string> = {};
                if (user?.role) headers['x-actor-role'] = user.role;

                const res = await fetch(url, { headers });
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setAnnouncements(data);
                } else {
                    const { MOCK_ANNOUNCEMENTS } = await import('@/lib/mockData');
                    setAnnouncements(MOCK_ANNOUNCEMENTS as any);
                }
            } catch (error) {
                console.error('Failed to fetch announcements:', error);
                try {
                    const { MOCK_ANNOUNCEMENTS } = await import('@/lib/mockData');
                    setAnnouncements(MOCK_ANNOUNCEMENTS as any);
                } catch (e) { }
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncements();
    }, [limit, user?.role]);

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
                            <div className="text-sm text-blue-500 leading-relaxed mb-3">
                                <FormattedText text={ann.body} />
                            </div>

                            {(ann.media && ann.media.length > 0) && (
                                <div className="mb-3 max-w-xl">
                                    <SlideshowMedia media={ann.media as any} title={ann.title} />
                                </div>
                            )}

                            {ann.type === 'event' && (
                                <div className="flex items-center gap-4 mt-2 pt-2 border-t border-blue-50">
                                    <button
                                        onClick={() => handleVote(ann.id, 'like')}
                                        className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${likes[String(ann.id)]?.myVote === 'like' ? 'text-blue-600' : 'text-slate-400 hover:text-blue-500'}`}
                                    >
                                        <ThumbsUp className={`h-4 w-4 ${likes[String(ann.id)]?.myVote === 'like' ? 'fill-blue-600' : ''}`} />
                                        <span>{likes[String(ann.id)]?.likes ?? 0}</span>
                                    </button>
                                    <button
                                        onClick={() => handleVote(ann.id, 'dislike')}
                                        className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${likes[String(ann.id)]?.myVote === 'dislike' ? 'text-red-600' : 'text-slate-400 hover:text-red-500'}`}
                                    >
                                        <ThumbsDown className={`h-4 w-4 ${likes[String(ann.id)]?.myVote === 'dislike' ? 'fill-red-600' : ''}`} />
                                        <span>{likes[String(ann.id)]?.dislikes ?? 0}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

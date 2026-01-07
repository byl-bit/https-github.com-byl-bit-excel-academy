'use client';

import { Card, CardHeader } from '@/components/ui/glass-card';
import { useAuth } from '@/contexts/AuthContext';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { Bell, Calendar, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FormattedText } from '@/components/FormattedText';
import { SlideshowMedia } from '@/components/SlideshowMedia';

export default function StudentAnnouncementsPage() {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [votes, setVotes] = useState<Record<string, { likes: number, dislikes: number, myVote?: 'like' | 'dislike' }>>({});

    useEffect(() => {
        const saved = localStorage.getItem('announcement_votes');
        if (saved) {
            try { setVotes(JSON.parse(saved)); } catch (e) { }
        }
    }, []);

    const handleVote = (id: string | number, vote: 'like' | 'dislike') => {
        const key = String(id);
        const current = votes[key] || { likes: Math.floor(Math.random() * 15) + 3, dislikes: Math.floor(Math.random() * 4) };

        let newVote: 'like' | 'dislike' | undefined = vote;
        let newLikes = current.likes;
        let newDislikes = current.dislikes;

        if (current.myVote === vote) {
            newVote = undefined;
            if (vote === 'like') newLikes--;
            else newDislikes--;
        } else {
            if (current.myVote === 'like') newLikes--;
            if (current.myVote === 'dislike') newDislikes--;

            if (vote === 'like') newLikes++;
            else newDislikes++;
        }

        const updated = { ...votes, [key]: { likes: newLikes, dislikes: newDislikes, myVote: newVote } };
        setVotes(updated);
        localStorage.setItem('announcement_votes', JSON.stringify(updated));
    };

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
                                <div className="text-base text-blue-900/80 leading-relaxed">
                                    <FormattedText text={announcement.body} />
                                </div>
                                {announcement.type === 'event' && (
                                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
                                        <button
                                            onClick={() => handleVote(announcement.id, 'like')}
                                            className={`flex items-center gap-1.5 text-xs font-bold transition-all ${votes[String(announcement.id)]?.myVote === 'like' ? 'text-blue-600' : 'text-slate-400 hover:text-blue-500'}`}
                                        >
                                            <ThumbsUp className={`h-4 w-4 ${votes[String(announcement.id)]?.myVote === 'like' ? 'fill-blue-600' : ''}`} />
                                            <span>{votes[String(announcement.id)]?.likes ?? 0}</span>
                                        </button>
                                        <button
                                            onClick={() => handleVote(announcement.id, 'dislike')}
                                            className={`flex items-center gap-1.5 text-xs font-bold transition-all ${votes[String(announcement.id)]?.myVote === 'dislike' ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                                        >
                                            <ThumbsDown className={`h-4 w-4 ${votes[String(announcement.id)]?.myVote === 'dislike' ? 'fill-red-600' : ''}`} />
                                            <span>{votes[String(announcement.id)]?.dislikes ?? 0}</span>
                                        </button>
                                    </div>
                                )}
                                {(announcement.media && announcement.media.length > 0) ? (
                                    <div className="mt-6">
                                        <SlideshowMedia media={announcement.media as any} title={announcement.title} />
                                    </div>
                                ) : announcement.imageUrl ? (
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
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_ANNOUNCEMENTS, Announcement } from "@/lib/mockData";
import { Calendar, Bell, ThumbsUp, ThumbsDown, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { FormattedText } from "@/components/FormattedText";
import { SlideshowMedia } from "@/components/SlideshowMedia";
import { Button } from "@/components/ui/button";

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
    const [votes, setVotes] = useState<Record<string, { likes: number, dislikes: number, myVote?: 'like' | 'dislike' }>>({});

    useEffect(() => {
        const saved = localStorage.getItem('announcement_votes');
        if (saved) {
            try { setVotes(JSON.parse(saved)); } catch (e) { }
        }
    }, []);

    const handleVote = (id: string | number, vote: 'like' | 'dislike') => {
        const key = String(id);
        const current = votes[key] || { likes: Math.floor(Math.random() * 20) + 5, dislikes: Math.floor(Math.random() * 5) };

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

    useEffect(() => {
        // Fetch live announcements from the API; fall back to mock data
        const loadAnnouncements = () => {
            fetch('/api/announcements')
                .then(res => res.ok ? res.json() : Promise.reject('No data'))
                .then((data: Announcement[]) => {
                    if (Array.isArray(data) && data.length > 0) {
                        setAnnouncements(data);
                    } else {
                        setAnnouncements(MOCK_ANNOUNCEMENTS);
                    }
                })
                .catch(() => {
                    // Fall back to any localStorage or mock data
                    if (typeof window !== 'undefined') {
                        const saved = localStorage.getItem('excel_academy_announcements');
                        if (saved) {
                            try {
                                setAnnouncements(JSON.parse(saved));
                            } catch {
                                setAnnouncements(MOCK_ANNOUNCEMENTS);
                            }
                        } else {
                            setAnnouncements(MOCK_ANNOUNCEMENTS);
                        }
                    }
                });
        };

        loadAnnouncements();
        // Refresh announcements every 30 seconds
        const interval = setInterval(loadAnnouncements, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="space-y-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">School Announcements</h1>
                    <p className="text-muted-foreground">Stay updated with the latest news and events.</p>
                </div>

                <div className="space-y-4">
                    {announcements.map((announcement) => (
                        <Card key={announcement.id} className="overflow-hidden">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Bell className="h-5 w-5 text-primary" />
                                        <span className={`text-xs font-semibold px-3 py-1 rounded-full uppercase
                                            ${announcement.type === 'academic' ? 'bg-blue-100 text-blue-800' :
                                                announcement.type === 'event' ? 'bg-blue-200 text-blue-800' :
                                                    'bg-blue-50 text-blue-700'}`}>
                                            {announcement.type}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-muted-foreground text-sm">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {new Date(announcement.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                </div>
                                <CardTitle className="text-2xl pt-2">{announcement.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-base text-foreground/90 leading-relaxed font-medium">
                                    <FormattedText text={announcement.body} />
                                </div>
                                {announcement.type === 'event' && (
                                    <div className="flex items-center gap-6 mt-4 py-3 border-y border-slate-100">
                                        <button
                                            onClick={() => handleVote(announcement.id, 'like')}
                                            className={`flex items-center gap-2 text-sm font-bold transition-all ${votes[String(announcement.id)]?.myVote === 'like' ? 'text-blue-600' : 'text-slate-400 hover:text-blue-500'}`}
                                        >
                                            <ThumbsUp className={`h-5 w-5 ${votes[String(announcement.id)]?.myVote === 'like' ? 'fill-blue-600' : ''}`} />
                                            <span>{votes[String(announcement.id)]?.likes ?? 0}</span>
                                        </button>
                                        <button
                                            onClick={() => handleVote(announcement.id, 'dislike')}
                                            className={`flex items-center gap-2 text-sm font-bold transition-all ${votes[String(announcement.id)]?.myVote === 'dislike' ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                                        >
                                            <ThumbsDown className={`h-5 w-5 ${votes[String(announcement.id)]?.myVote === 'dislike' ? 'fill-red-600' : ''}`} />
                                            <span>{votes[String(announcement.id)]?.dislikes ?? 0}</span>
                                        </button>
                                    </div>
                                )}
                                {(announcement.media && announcement.media.length > 0) ? (
                                    <div className="mt-6">
                                        <SlideshowMedia media={announcement.media as any} title={announcement.title} />
                                    </div>
                                ) : announcement.imageUrl ? (
                                    <div className="mt-6 rounded-xl overflow-hidden border shadow-sm bg-blue-50">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={announcement.imageUrl}
                                            alt={announcement.title}
                                            className="w-full h-auto max-h-[500px] object-cover hover:scale-[1.01] transition-transform duration-500"
                                        />
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {announcements.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No announcements available at the moment.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

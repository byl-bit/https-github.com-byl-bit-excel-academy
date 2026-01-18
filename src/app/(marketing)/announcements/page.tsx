'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_ANNOUNCEMENTS, Announcement } from "@/lib/mockData";
import {
    Calendar, Bell, ThumbsUp, ThumbsDown,
    Search, Filter, Megaphone, Sparkles,
    ArrowRight, ShieldCheck, Clock
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { FormattedText } from "@/components/FormattedText";
import { SlideshowMedia } from "@/components/SlideshowMedia";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
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
                    if (typeof window !== 'undefined') {
                        const saved = localStorage.getItem('excel_academy_announcements');
                        if (saved) {
                            try { setAnnouncements(JSON.parse(saved)); } catch { setAnnouncements(MOCK_ANNOUNCEMENTS); }
                        } else {
                            setAnnouncements(MOCK_ANNOUNCEMENTS);
                        }
                    }
                });
        };

        loadAnnouncements();
        const interval = setInterval(loadAnnouncements, 30000);
        return () => clearInterval(interval);
    }, []);

    const filteredAnnouncements = useMemo(() => {
        return announcements.filter(a => {
            const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.body.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterType === "all" || a.type === filterType;
            return matchesSearch && matchesFilter;
        });
    }, [announcements, searchQuery, filterType]);

    return (
        <div className="min-h-screen bg-slate-50 pb-24">

            {/* Header Section */}
            <section className="bg-linear-to-b from-blue-900 via-indigo-900 to-slate-950 text-white pt-24 pb-32">
                <div className="container px-6 mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-black uppercase tracking-widest mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Megaphone className="w-3 h-3 text-yellow-500" />
                        Official Channel
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        School <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-cyan-400">Announcements</span>
                    </h1>
                    <p className="text-xl text-blue-100/70 max-w-2xl mx-auto font-light animate-in fade-in slide-in-from-bottom-12 duration-700">
                        Stay informed about campus life, academic deadlines, and upcoming events
                        at Excel Academy.
                    </p>
                </div>
            </section>

            {/* Content Section */}
            <div className="container px-6 mx-auto -mt-16">

                {/* Search & Filter Bar */}
                <div className="bg-white rounded-4xl p-4 shadow-xl shadow-slate-900/5 mb-12 flex flex-col md:flex-row gap-4 items-center animate-in zoom-in duration-700">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <Input
                            placeholder="Search updates..."
                            className="h-14 pl-12 rounded-2xl border-none bg-slate-50 focus:ring-2 focus:ring-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        {['all', 'academic', 'event', 'admin'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-5 h-14 rounded-2xl text-sm font-bold uppercase tracking-wider transition-all
                                    ${filterType === type
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid Layout */}
                <div className="max-w-4xl mx-auto space-y-10">
                    {filteredAnnouncements.map((announcement, idx) => (
                        <Card
                            key={announcement.id}
                            className="border-none shadow-2xl shadow-slate-950/5 rounded-5xl overflow-hidden bg-white group hover:scale-[1.01] transition-transform duration-500"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <CardHeader className="p-8 md:p-10 pb-0">
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
                                            ${announcement.type === 'academic' ? 'bg-blue-50 text-blue-600' :
                                                announcement.type === 'event' ? 'bg-orange-50 text-orange-600' :
                                                    'bg-purple-50 text-purple-600'}`}>
                                            <Bell className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md
                                                ${announcement.type === 'academic' ? 'bg-blue-100 text-blue-700' :
                                                    announcement.type === 'event' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-purple-100 text-purple-700'}`}>
                                                {announcement.type}
                                            </span>
                                            <div className="flex items-center text-slate-400 text-xs mt-1">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {new Date(announcement.date).toLocaleDateString('en-US', {
                                                    month: 'long', day: 'numeric', year: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-bold text-slate-300">
                                        <ShieldCheck className="w-4 h-4 text-green-500" />
                                        Verified Post
                                    </div>
                                </div>
                                <CardTitle className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                                    {announcement.title}
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="p-8 md:p-10 pt-6">
                                <div className="text-lg text-slate-600 leading-relaxed font-light mb-8">
                                    <FormattedText text={announcement.body} />
                                </div>

                                {/* Media Content */}
                                {(announcement.media && announcement.media.length > 0) ? (
                                    <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-lg mb-8">
                                        <SlideshowMedia media={announcement.media as any} title={announcement.title} />
                                    </div>
                                ) : announcement.imageUrl ? (
                                    <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-lg mb-8">
                                        <img
                                            src={announcement.imageUrl}
                                            alt={announcement.title}
                                            className="w-full h-auto max-h-[600px] object-cover"
                                        />
                                    </div>
                                ) : null}

                                {/* Interaction Bar */}
                                <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => handleVote(announcement.id, 'like')}
                                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all
                                                ${votes[String(announcement.id)]?.myVote === 'like'
                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                        >
                                            <ThumbsUp className={`h-4 w-4 ${votes[String(announcement.id)]?.myVote === 'like' ? 'fill-white' : ''}`} />
                                            {votes[String(announcement.id)]?.likes ?? 0}
                                        </button>
                                        <button
                                            onClick={() => handleVote(announcement.id, 'dislike')}
                                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all
                                                ${votes[String(announcement.id)]?.myVote === 'dislike'
                                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                        >
                                            <ThumbsDown className={`h-4 w-4 ${votes[String(announcement.id)]?.myVote === 'dislike' ? 'fill-white' : ''}`} />
                                            {votes[String(announcement.id)]?.dislikes ?? 0}
                                        </button>
                                    </div>

                                    <Button variant="ghost" className="text-blue-600 font-black hover:bg-blue-50 rounded-xl group/btn">
                                        Share <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Empty State */}
                    {filteredAnnouncements.length === 0 && (
                        <div className="text-center py-20 animate-in fade-in duration-1000">
                            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">No Updates Found</h3>
                            <p className="text-slate-500 font-light">
                                We couldn't find any announcements matching your criteria.
                                Try a different search or filter.
                            </p>
                            <Button variant="link" className="mt-4 text-blue-600 font-bold" onClick={() => { setSearchQuery(""); setFilterType("all"); }}>
                                Clear all filters
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

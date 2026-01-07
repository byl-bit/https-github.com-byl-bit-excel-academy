'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_ANNOUNCEMENTS, Announcement } from "@/lib/mockData";
import { Calendar, Bell } from "lucide-react";
import { useEffect, useState } from "react";

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);

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
                                <CardDescription className="text-base text-foreground/90 leading-relaxed">
                                    {announcement.body}
                                </CardDescription>
                                {(announcement.media && announcement.media.length > 0) ? (() => {
                                    const media = announcement.media;
                                    const count = media.length;
                                    return (
                                        <div className={`mt-6 grid gap-4 ${count === 1 ? 'grid-cols-1' :
                                            count === 2 ? 'grid-cols-2' :
                                                'grid-cols-2 md:grid-cols-3'
                                            }`}>
                                            {media.map((m, idx) => (
                                                <div key={idx} className={`rounded-xl overflow-hidden border shadow-sm bg-blue-50 ${count === 1 ? 'max-h-[500px]' : 'aspect-square'
                                                    }`}>
                                                    {m.type === 'image' ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={m.url}
                                                            alt={`${announcement.title} ${idx}`}
                                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <video src={m.url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })() : announcement.imageUrl ? (
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

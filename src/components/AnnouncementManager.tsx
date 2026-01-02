'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MOCK_ANNOUNCEMENTS, Announcement } from "@/lib/mockData";
import { Trash2, Edit, Plus, Image as ImageIcon, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AlertModal } from '@/components/ui/alert-modal';

interface AnnouncementManagerProps {
    isAdmin?: boolean;
    initialData?: Announcement[];
}

export function AnnouncementManager({ isAdmin = false, initialData }: AnnouncementManagerProps) {
    const [announcements, setAnnouncements] = useState<Announcement[]>(initialData || []);
    const { user } = useAuth() as any;
    const { success, error: notifyError } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Announcement>>({
        title: '',
        body: '',
        type: 'general',
        imageUrl: '',
        media: []
    });
    const [uploading, setUploading] = useState(false);

    // Dialog States
    const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string; title: string }>({ open: false, id: '', title: '' });
    const [alertData, setAlertData] = useState<{ open: boolean; title: string; description: string; variant: 'success' | 'error' | 'info' }>({ open: false, title: '', description: '', variant: 'info' });
    useEffect(() => {
        if (initialData) {
            setAnnouncements(initialData);
            return;
        }
        fetch('/api/announcements')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setAnnouncements(data);
                }
            })
            .catch(err => {
                console.error(err);
                notifyError('Failed to load announcements');
            });
    }, [notifyError, initialData]);

    const updateAnnouncements = async (newAnnouncements: Announcement[]) => {
        const oldAnnouncements = [...announcements];
        setAnnouncements(newAnnouncements);

        try {
            const role = (user as any)?.role || 'admin';
            const actorId = (user as any)?.id || '';
            const payload = newAnnouncements.map(a => {
                if (a.id.startsWith('new-')) {
                    const { id, ...rest } = a;
                    return rest;
                }
                return a;
            });

            const res = await fetch('/api/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-actor-role': role, 'x-actor-id': actorId },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save');

            success('Announcements updated successfully');
            return true;
        } catch (e: any) {
            console.error("Failed to sync announcements:", e);
            notifyError(e.message || "Failed to sync announcements");
            setAnnouncements(oldAnnouncements);
            return false;
        }
    };

    const handleSave = async () => {
        if (!isAdmin) return;
        let updatedList: Announcement[];
        if (editingId) {
            updatedList = announcements.map(a =>
                a.id === editingId ? { ...a, ...formData } as Announcement : a
            );
        } else {
            const newAnnouncement: Announcement = {
                id: `new-${Date.now()}`,
                title: formData.title || 'Untitled',
                body: formData.body || '',
                date: new Date().toISOString().split('T')[0],
                type: (formData.type as any) || 'general',
                imageUrl: formData.imageUrl,
                media: formData.media || []
            };
            updatedList = [newAnnouncement, ...announcements];
        }

        const saved = await updateAnnouncements(updatedList);
        if (!saved) return;

        setIsDialogOpen(false);
        setEditingId(null);
        setFormData({ title: '', body: '', type: 'general', imageUrl: '', media: [] });
        setUploading(false);

        // Refresh to get server-generated IDs
        setTimeout(() => {
            fetch('/api/announcements')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setAnnouncements(data);
                })
                .catch(console.error);
        }, 800);
    };

    const handleEdit = (announcement: Announcement, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!isAdmin) return;
        setEditingId(announcement.id);
        setFormData(announcement);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!isAdmin) return;
        const announcement = announcements.find(a => a.id === id);
        if (!announcement) return;

        setConfirmDelete({
            open: true,
            id,
            title: announcement.title,
        });
    };

    const confirmDeletion = async () => {
        const id = confirmDelete.id;
        const newList = announcements.filter(a => a.id !== id);
        setConfirmDelete({ ...confirmDelete, open: false });
        await updateAnnouncements(newList);
    };

    const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setUploading(true);
        const currentMedia = [...(formData.media || [])];

        for (const file of files) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('fileName', file.name);
                formData.append('bucket', 'letterheads');

                const res = await fetch('/api/media/upload', {
                    method: 'POST',
                    body: formData
                });

                const body = await res.json();
                if (!res.ok) {
                    notifyError(body.error || 'Upload failed');
                    continue;
                }

                const url = body.url || body.publicUrl || body.key || null;

                if (url) {
                    currentMedia.push({
                        type: file.type.startsWith('video') ? 'video' : 'image',
                        url,
                        name: file.name
                    });
                    setFormData(prev => ({ ...prev, media: [...currentMedia] }));
                }
            } catch (err: any) {
                console.error('File upload error', err);
                notifyError('Failed to upload file');
            }
        }
        setUploading(false);
    };

    const removeMediaItem = (index: number) => {
        setFormData(prev => ({ ...prev, media: (prev.media || []).filter((_, i) => i !== index) }));
    };

    return (
        <Card className="bg-background/80 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between text-left">
                <div>
                    <CardTitle>Announcements</CardTitle>
                    <CardDescription>
                        {isAdmin ? 'Manage school news and events' : 'Latest updates from the academy'}
                    </CardDescription>
                </div>
                {isAdmin && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => { setEditingId(null); setFormData({ title: '', body: '', type: 'general', imageUrl: '', media: [] }); }}>
                                <Plus className="mr-2 h-4 w-4" /> Create New
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>{editingId ? 'Edit Announcement' : 'Create Announcement'}</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type</Label>
                                    <select
                                        id="type"
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                    >
                                        <option value="general">General</option>
                                        <option value="academic">Academic</option>
                                        <option value="event">Event</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="body">Content</Label>
                                    <textarea
                                        id="body"
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.body}
                                        onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 text-left">
                                    <Label>Media (images / short videos)</Label>
                                    <div className="flex flex-col gap-2">
                                        <Input
                                            type="file"
                                            accept="image/*,video/*"
                                            multiple
                                            disabled={uploading}
                                            onChange={handleFilesUpload}
                                            className="cursor-pointer"
                                        />
                                        {uploading && <p className="text-[10px] text-blue-500 animate-pulse">Uploading files...</p>}
                                    </div>
                                    {formData.media && formData.media.length > 0 && (
                                        <div className="mt-2 grid grid-cols-4 gap-2">
                                            {formData.media.map((m, idx) => (
                                                <div key={idx} className="relative aspect-square border-2 border-slate-100 rounded-lg overflow-hidden bg-slate-50 group hover:border-blue-200 transition-all text-left">
                                                    {m.type === 'image' ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={m.url} alt={m.name || 'media'} className="object-cover w-full h-full" />
                                                    ) : (
                                                        <video src={m.url} className="object-cover w-full h-full" />
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMediaItem(idx)}
                                                        className="absolute top-1 right-1 bg-white/90 backdrop-blur-sm text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Button onClick={handleSave} disabled={uploading}>
                                {uploading ? 'Uploading...' : (editingId ? 'Update Announcement' : 'Save Announcement')}
                            </Button>
                        </DialogContent>
                    </Dialog>
                )}
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {announcements.map((item) => (
                        <div key={item.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-semibold">{item.title}</h4>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold 
                                        ${item.type === 'academic' ? 'bg-blue-100 text-blue-800' :
                                            item.type === 'event' ? 'bg-purple-100 text-purple-800' :
                                                'bg-gray-100 text-gray-800'}`}>
                                        {item.type}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{item.date}</p>
                                <div className="text-sm line-clamp-3 whitespace-pre-wrap">{item.body}</div>
                                {(item.media && item.media.length > 0) ? (
                                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {item.media.map((m, idx) => (
                                            <div key={idx} className="aspect-video relative rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                                                {m.type === 'image' ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={m.url} alt={`${item.title} media ${idx}`} className="object-cover w-full h-full hover:scale-105 transition-transform duration-500" />
                                                ) : (
                                                    <video src={m.url} className="object-cover w-full h-full" controls={false} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : item.imageUrl ? (
                                    <div className="mt-3 aspect-video sm:w-64 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={item.imageUrl} alt={item.title} className="object-cover w-full h-full" />
                                    </div>
                                ) : null}
                            </div>
                            {isAdmin && (
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={(e) => handleEdit(item, e)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => handleDelete(item.id, e)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>

            <ConfirmDialog
                open={confirmDelete.open}
                onClose={() => setConfirmDelete({ ...confirmDelete, open: false })}
                onConfirm={confirmDeletion}
                title="Delete Announcement"
                description={`Are you sure you want to delete "${confirmDelete.title}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="destructive"
            />

            <AlertModal
                open={alertData.open}
                onClose={() => setAlertData({ ...alertData, open: false })}
                title={alertData.title}
                description={alertData.description}
                variant={alertData.variant}
            />
        </Card>
    );
}

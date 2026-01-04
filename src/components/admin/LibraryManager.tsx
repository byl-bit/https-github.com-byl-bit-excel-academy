'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Library, Trash2, Plus, BookOpen, Download, Upload, FileCheck, Video } from "lucide-react";
import { PaginationControls } from "@/components/PaginationControls";
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AlertModal } from '@/components/ui/alert-modal';

interface LibraryManagerProps {
    books: any[];
    onAddBook: (book: any) => void;
    onDeleteBook: (id: string) => void;
}

export function LibraryManager({ books, onAddBook, onDeleteBook }: LibraryManagerProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [newBook, setNewBook] = useState({
        title: '', author: '', grade: '', subject: '', description: '', downloadUrl: '', fileName: '', videoUrl: ''
    });
    const [isUploading, setIsUploading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 8;

    // Dialog States
    const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string; title: string }>({ open: false, id: '', title: '' });
    const [alert, setAlert] = useState<{ open: boolean; title: string; description: string; variant: 'success' | 'error' | 'info' }>({ open: false, title: '', description: '', variant: 'info' });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Enforce 4.5MB limit to prevent serverless function timeout/payload errors
        if (file.size > 4.5 * 1024 * 1024) {
            setAlert({ open: true, title: 'File Too Large', description: "Max file size is 4.5MB. For larger files, please host externally (e.g. Google Drive) and paste the link.", variant: 'error' });
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);

        try {
            // Use the specific library upload endpoint
            const res = await fetch('/api/library/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                // Try to parse error
                const errorData = await res.json().catch(() => ({}));
                // If it's a 404, it means the API route isn't found (deployment issue)
                if (res.status === 404) {
                    throw new Error("Upload service unreachable (404). Please ensure the latest code is deployed.");
                }
                throw new Error(errorData.error || `Upload failed with status ${res.status}`);
            }

            const data = await res.json();
            setNewBook(prev => ({
                ...prev,
                downloadUrl: data.url,
                fileName: file.name
            }));

            setAlert({ open: true, title: 'Upload Successful', description: 'File uploaded safely.', variant: 'success' });

        } catch (err: any) {
            console.error('Upload Error:', err);
            setAlert({ open: true, title: 'Upload Failed', description: err.message || "Failed to upload file. Please try again.", variant: 'error' });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleAdd = () => {
        if (!newBook.title) {
            setAlert({ open: true, title: 'Validation Error', description: 'Resource title is required.', variant: 'error' });
            return;
        }
        onAddBook(newBook);
        setNewBook({ title: '', author: '', grade: '', subject: '', description: '', downloadUrl: '', fileName: '', videoUrl: '' });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Add New Resource (Debug: {books.length} items)
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <Label>Title</Label>
                        <Input value={newBook.title} onChange={e => setNewBook({ ...newBook, title: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <Label>Author</Label>
                        <Input value={newBook.author} onChange={e => setNewBook({ ...newBook, author: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <Label>Grade/Subject</Label>
                        <div className="flex gap-2">
                            <Input placeholder="Grade" value={newBook.grade} onChange={e => setNewBook({ ...newBook, grade: e.target.value })} />
                            <Input placeholder="Subject" value={newBook.subject} onChange={e => setNewBook({ ...newBook, subject: e.target.value })} />
                        </div>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                        <Label>Resource Download Link or File</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="https://... (or upload file)"
                                value={newBook.downloadUrl.startsWith('data:') ? `File: ${newBook.fileName}` : newBook.downloadUrl}
                                onChange={e => setNewBook({ ...newBook, downloadUrl: e.target.value, fileName: '' })}
                                className="flex-1"
                                disabled={newBook.downloadUrl.startsWith('data:')}
                            />
                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                            />
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                {newBook.downloadUrl.startsWith('data:') ? <FileCheck className="h-4 w-4 text-green-500" /> : <Upload className="h-4 w-4" />}
                                {isUploading ? '...' : (newBook.downloadUrl.startsWith('data:') ? 'Change' : 'Upload')}
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label>Video Lesson Link (Optional)</Label>
                        <div className="relative">
                            <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="YouTube / Drive URL"
                                className="pl-9"
                                value={newBook.videoUrl}
                                onChange={e => setNewBook({ ...newBook, videoUrl: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex items-end">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 font-bold" onClick={handleAdd}>Add to Library</Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {books
                    .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                    .map((book) => (
                        <Card key={book.id} className="relative group overflow-hidden border-slate-200">
                            <CardHeader className="pb-2">
                                <div className="bg-blue-50 w-fit p-2 rounded-lg mb-2">
                                    <BookOpen className="h-5 w-5 text-blue-600" />
                                </div>
                                <CardTitle className="text-base line-clamp-1">{book.title}</CardTitle>
                                <CardDescription className="text-xs">{book.author}</CardDescription>
                            </CardHeader>
                            <CardContent className="text-xs">
                                <p className="font-semibold text-slate-500">{book.subject} | Grade {book.grade}</p>
                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between items-center">
                                        {book.downloadUrl ? (
                                            <a href={book.downloadUrl} download={book.fileName || `${book.title}.pdf`} className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                                                <Download className="h-3 w-3" /> PDF
                                            </a>
                                        ) : <span className="text-slate-400 italic">No File</span>}

                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setConfirmDelete({ open: true, id: book.id, title: book.title })}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>

                                    {book.videoUrl && (
                                        <div className="pt-2 border-t border-slate-100">
                                            <a href={book.videoUrl} target="_blank" rel="noopener noreferrer" className="text-amber-600 font-bold hover:underline flex items-center gap-1">
                                                <Video className="h-3 w-3" /> Video Lesson
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
            </div>

            <PaginationControls
                currentPage={currentPage}
                totalItems={books.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
            />

            <ConfirmDialog
                open={confirmDelete.open}
                onClose={() => setConfirmDelete({ ...confirmDelete, open: false })}
                onConfirm={() => {
                    onDeleteBook(confirmDelete.id);
                    setConfirmDelete({ ...confirmDelete, open: false });
                }}
                title="Delete Resource"
                description={`Are you sure you want to delete "${confirmDelete.title}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="destructive"
            />

            <AlertModal
                open={alert.open}
                onClose={() => setAlert({ ...alert, open: false })}
                title={alert.title}
                description={alert.description}
                variant={alert.variant}
            />
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Download, Search, Video } from "lucide-react";
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

interface Book {
    id: string;
    title: string;
    author: string;
    grade: string;
    subject: string;
    downloadUrl: string;
    videoUrl?: string;
    description: string;
    uploadedAt: string;
}

export default function StudentLibraryPage() {
    const { user } = useAuth();
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');

    const fetchBooks = async () => {
        try {
            const url = '/api/books';
            const res = await fetch(url);
            const data = await res.json();
            setBooks(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchBooks();
    }, [user]);

    useAutoRefresh(fetchBooks, {
        enabled: true,
        interval: 60000,
        refreshOnFocus: true,
        refreshOnMount: false
    });

    const filteredBooks = books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.author.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSubject = subjectFilter ? book.subject === subjectFilter : true;
        return matchesSearch && matchesSubject;
    });

    const subjects = Array.from(new Set(books.map(b => b.subject))).filter(Boolean);

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl animate-fade-in-up">
            <Card className="mb-8 bg-white border-slate-100 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-2">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-50 p-3 rounded-xl hidden sm:block">
                            <BookOpen className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-blue-900">Digital Library</h1>
                            <p className="text-sm text-blue-500">Access textbooks, notes, and study resources.</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-300" />
                            <Input
                                placeholder="Search books..."
                                className="pl-8 w-full sm:w-[250px] bg-blue-50/50 border-blue-100 focus:border-blue-300 text-blue-900 placeholder:text-blue-300"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="h-10 rounded-md border border-blue-100 bg-blue-50/50 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-100 w-full sm:w-auto text-blue-600"
                            value={subjectFilter}
                            onChange={(e) => setSubjectFilter(e.target.value)}
                        >
                            <option value="">All Subjects</option>
                            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </Card>

            {loading ? (
                <div className="text-center py-20 text-blue-500">Loading specific resources...</div>
            ) : filteredBooks.length === 0 ? (
                <Card>
                    <div className="text-center py-20">
                        <BookOpen className="h-10 w-10 mx-auto text-blue-200 mb-4 opacity-50" />
                        <p className="text-lg font-medium text-blue-400">No resources found matching your criteria.</p>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBooks.map((book) => (
                        <Card key={book.id} className="flex flex-col hover:shadow-xl transition-shadow duration-300 border border-slate-100 bg-white">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="inline-flex items-center rounded-full border border-blue-100 px-2.5 py-0.5 text-xs font-bold transition-colors bg-blue-50 text-blue-600">
                                        {book.subject}
                                    </div>
                                    {user?.grade && book.grade && parseInt(user.grade) === parseInt(book.grade) && (
                                        <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-1 rounded-full shadow-sm">
                                            Recommended
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-bold text-lg leading-tight mb-1 text-blue-900 line-clamp-2">{book.title}</h3>
                                <p className="text-sm text-blue-400 line-clamp-1 mb-6">by {book.author || 'Unknown Author'}</p>

                                <div className="flex-1 flex flex-col justify-end gap-4 mt-auto">
                                    <div className="text-xs font-medium text-blue-500 bg-blue-50/50 p-2 rounded-lg border border-blue-50">
                                        <span className="font-bold text-blue-700">Grade:</span> {book.grade || 'All'}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md" variant={book.downloadUrl ? 'default' : 'secondary'} asChild disabled={!book.downloadUrl}>
                                            <a href={book.downloadUrl} download={`${book.title}.pdf`}>
                                                <Download className="h-4 w-4" />
                                                {book.downloadUrl ? 'Download PDF' : 'No File Attachment'}
                                            </a>
                                        </Button>

                                        {book.videoUrl && (
                                            <Button className="w-full gap-2 bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 shadow-sm" variant="outline" asChild>
                                                <a href={book.videoUrl} target="_blank" rel="noopener noreferrer">
                                                    <Video className="h-4 w-4" />
                                                    Watch Video Lesson
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

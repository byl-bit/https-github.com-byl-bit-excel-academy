import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Using JSON file for simple 'database' of books
const DATA_FILE = path.join(process.cwd(), 'data', 'books.json');

// Interface for Book
interface Book {
    id: string;
    title: string;
    author: string;
    grade: string;
    subject: string;
    description: string;
    downloadUrl?: string; // Optional - link not mandatory
    videoUrl?: string;    // Optional - video attachment link
    uploadedAt: string;
}

// Ensure data directory exists
async function ensureDataFile() {
    try {
        await fs.access(DATA_FILE);
    } catch {
        const dir = path.dirname(DATA_FILE);
        try {
            await fs.access(dir);
        } catch {
            await fs.mkdir(dir, { recursive: true });
        }
        await fs.writeFile(DATA_FILE, '[]');
    }
}

export async function GET(request: Request) {
    await ensureDataFile();
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const grade = searchParams.get('grade');
    const subject = searchParams.get('subject');

    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        let books: Book[] = JSON.parse(data);

        if (grade) books = books.filter(b => b.grade === grade);
        if (subject) books = books.filter(b => b.subject === subject);

        // Sort by upload date descending
        books.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

        if (limit) books = books.slice(0, parseInt(limit));

        return NextResponse.json(books);
    } catch (e) {
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(req: Request) {
    await ensureDataFile();
    try {
        const newBook: Book = await req.json();
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        const books: Book[] = JSON.parse(data);

        // Simple validation - only title is required
        if (!newBook.title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const bookWithId = { ...newBook, id: `book-${Date.now()}` };
        books.push(bookWithId);

        await fs.writeFile(DATA_FILE, JSON.stringify(books, null, 2));

        return NextResponse.json(bookWithId);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to save book' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    await ensureDataFile();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        let books: Book[] = JSON.parse(data);
        books = books.filter(b => b.id !== id);
        await fs.writeFile(DATA_FILE, JSON.stringify(books, null, 2));
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// Helper to map DB snake_case to Frontend camelCase
const mapToFrontend = (book: any) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    grade: book.grade,
    subject: book.subject,
    description: book.description,
    downloadUrl: book.file_url || book.download_url, // Support both naming conventions
    videoUrl: book.video_url,
    uploadedAt: book.created_at
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const grade = searchParams.get('grade');
    const subject = searchParams.get('subject');

    // Use Admin client if available to bypass RLS policies
    const client = supabaseAdmin || supabase;
    let query = client.from('books').select('*').order('created_at', { ascending: false });

    if (grade && grade !== 'All') query = query.eq('grade', grade);
    if (subject && subject !== 'All') query = query.eq('subject', subject);

    if (limit) query = query.limit(parseInt(limit));

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching books from Supabase:', error);
        // Fallback to empty to avoid crashing UI if table missing
        return NextResponse.json([]);
    }

    return NextResponse.json(data.map(mapToFrontend));
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body.title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const dbPayload = {
            title: body.title,
            author: body.author,
            grade: body.grade,
            subject: body.subject,
            description: body.description,
            file_url: body.downloadUrl,
            video_url: body.videoUrl
        };

        const client = supabaseAdmin || supabase;
        const { data, error } = await client
            .from('books')
            .insert([dbPayload])
            .select()
            .single();

        if (error) {
            console.error('Error adding book:', error);
            return NextResponse.json({ error: 'Failed to save book to database' }, { status: 500 });
        }

        return NextResponse.json(mapToFrontend(data));
    } catch (e) {
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const client = supabaseAdmin || supabase;
    const { error } = await client
        .from('books')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting book:', error);
        return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

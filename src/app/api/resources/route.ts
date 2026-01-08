import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// Force dynamic to ensure we always get fresh data
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const client = supabaseAdmin || supabase;

        // Fetch all resources, newest first
        const { data, error } = await client
            .from('resources')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('API: Error fetching resources:', error);
            // Return empty array on error prevents crash
            return NextResponse.json([]);
        }

        return new Response(JSON.stringify(data || []), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=60'
            }
        });
    } catch (e) {
        console.error('API: Exception fetching resources:', e);
        return NextResponse.json([]);
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const client = supabaseAdmin || supabase;

        // Simple insert
        const { data, error } = await client
            .from('resources')
            .insert([{
                title: body.title,
                author: body.author || '',
                description: body.description || '',
                file_url: body.file_url,
                video_url: body.video_url || '',
                grade: body.grade || 'All',
                subject: body.subject || 'General'
            }])
            .select()
            .single();

        if (error) {
            console.error('API: Error creating resource:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const client = supabaseAdmin || supabase;
        const { error } = await client.from('resources').delete().eq('id', id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

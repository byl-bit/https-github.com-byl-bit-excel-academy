import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const getString = (o: Record<string, unknown>, k: string) => {
    const v = o[k];
    return typeof v === 'string' ? v : undefined;
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');

    const client = supabaseAdmin || supabase;
    let query = client
        .from('announcements')
        .select('id, title, content, date, type, urgency, image_url, media, created_at')
        .order('created_at', { ascending: false });

    if (limit) {
        const parsedLimit = parseInt(limit);
        if (!isNaN(parsedLimit)) query = query.limit(parsedLimit);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Supabase error fetching announcements:', error);
        return NextResponse.json([]);
    }

    const mappedData = (data || []).map((item: unknown) => {
        if (!isRecord(item)) return null;

        const id = getString(item, 'id') || '';
        const title = getString(item, 'title') || '';
        const bodyContent = getString(item, 'content') || getString(item, 'body') || '';
        const date = getString(item, 'date') || getString(item, 'created_at')?.split('T')[0] || new Date().toISOString().split('T')[0];
        const type = getString(item, 'type') || getString(item, 'urgency') || 'general';
        const imageUrl = getString(item, 'image_url') || getString(item, 'imageUrl') || null;

        // Process media array efficiently
        let mediaArr: Array<Record<string, any>> = [];
        const mediaRaw = item['media'];

        if (Array.isArray(mediaRaw)) {
            mediaArr = mediaRaw.map((m: any) => ({
                type: m.type || (m.url && m.url.match(/\.mp4|\.webm/) ? 'video' : 'image'),
                url: m.url || '',
                name: m.name || null
            }));
        } else if (typeof mediaRaw === 'string') {
            try {
                const parsed = JSON.parse(mediaRaw || '[]');
                if (Array.isArray(parsed)) mediaArr = parsed;
            } catch {
                mediaArr = [];
            }
        }

        if (!mediaArr.length && imageUrl) {
            mediaArr = [{ type: 'image', url: imageUrl, name: null }];
        }

        return { id, title, body: bodyContent, date, type, imageUrl, media: mediaArr };
    }).filter(Boolean);

    return NextResponse.json(mappedData);
}

export async function POST(request: Request) {
    const role = request.headers.get('x-actor-role') || '';
    if (role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized: admin role required' }, { status: 403 });
    }

    const bodyRaw = await request.json();
    const client = supabaseAdmin || supabase;

    // Fast-path: Clear and return if empty
    const { error: deleteError } = await client.from('announcements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteError) {
        return NextResponse.json({ error: 'Failed to clear existing announcements: ' + deleteError.message }, { status: 500 });
    }

    if (Array.isArray(bodyRaw) && bodyRaw.length > 0) {
        const mappedAnnouncements = bodyRaw.map((item: unknown) => {
            if (!isRecord(item)) return { title: '', content: '' };

            const title = getString(item, 'title') || '';
            const content = getString(item, 'body') || getString(item, 'content') || '';
            const typeVal = getString(item, 'type') || undefined;
            const dateVal = getString(item, 'date') || undefined;
            const imageVal = getString(item, 'imageUrl') || getString(item, 'image_url') || undefined;

            let mediaVal = item['media'];
            if (typeof mediaVal === 'string') {
                try { mediaVal = JSON.parse(mediaVal || '[]'); } catch { mediaVal = undefined; }
            }

            const payload: Record<string, any> = { title, content };
            if (typeVal) { payload.urgency = typeVal; payload.type = typeVal; }
            if (dateVal) payload.date = dateVal;
            if (Array.isArray(mediaVal) && mediaVal.length) {
                payload.media = mediaVal;
            } else if (imageVal) {
                payload.image_url = imageVal;
            }

            return payload;
        });

        const { error: insertError } = await client.from('announcements').insert(mappedAnnouncements);
        if (insertError) {
            console.error('Supabase error saving announcements:', insertError);
            return NextResponse.json({ error: 'Failed to save: ' + insertError.message }, { status: 500 });
        }
    }

    return NextResponse.json({ success: true });
}

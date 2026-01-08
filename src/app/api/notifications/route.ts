import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
    try {
        const actorRole = request.headers.get('x-actor-role') || '';
        const actorId = request.headers.get('x-actor-id') || '';

        if (!['admin', 'teacher', 'student'].includes(actorRole)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Use standard supabase for GET as RLS should allow users to see their own notifications
        let query = supabase.from('notifications').select('id, user_id, user_name, action, category, details, target_id, target_name, type, is_read, created_at');

        if (actorRole !== 'admin') {
            if (!actorId) return NextResponse.json({ error: 'Actor ID required' }, { status: 400 });
            query = query.or(`user_id.eq.${actorId},target_id.eq.${actorId},type.eq.broadcast`);
        }

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Failed to fetch notifications:', error);
            return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
        }

        const unreadCount = (data || []).filter((n: any) => !n.is_read).length;

        return NextResponse.json({ notifications: data || [], unreadCount });
    } catch (e) {
        console.error('GET /api/notifications error', e);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const all = searchParams.get('all');
        const actorRole = request.headers.get('x-actor-role') || '';
        const actorId = request.headers.get('x-actor-id') || '';

        if (!id && all !== 'true') return NextResponse.json({ error: 'ID or all=true required' }, { status: 400 });

        // Use supabaseAdmin for DELETE to bypass RLS restrictions on bulk operations
        const db = supabaseAdmin || supabase;
        let query = db.from('notifications').delete();

        if (all === 'true') {
            if (actorRole !== 'admin') {
                if (!actorId) return NextResponse.json({ error: 'Actor ID required' }, { status: 400 });
                query = query.or(`user_id.eq.${actorId},target_id.eq.${actorId}`);
            }
        } else {
            query = query.eq('id', id);
        }

        const { error } = await query;
        if (error) {
            console.error('Delete notifications error:', error);
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('DELETE /api/notifications catch block:', e);
        return NextResponse.json({ error: 'Failed to delete', message: e.message || String(e) }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const actorRole = request.headers.get('x-actor-role') || '';
        const actorId = request.headers.get('x-actor-id') || '';

        if (!['admin', 'teacher', 'student'].includes(actorRole)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        if (!body || (!body.id && !body.all)) return NextResponse.json({ error: 'Notification id or all:true required' }, { status: 400 });

        // Use supabaseAdmin for UPDATE to bypass RLS restrictions on bulk operations
        const db = supabaseAdmin || supabase;
        let query = db.from('notifications')
            .update({ is_read: true });

        if (body.all) {
            if (actorRole !== 'admin') {
                if (!actorId) return NextResponse.json({ error: 'Actor ID required' }, { status: 400 });
                query = query.or(`user_id.eq.${actorId},target_id.eq.${actorId}`);
            }
        } else {
            query = query.eq('id', body.id);
        }

        const { error } = await query;

        if (error) {
            console.error('Failed to mark notification read:', error);
            return NextResponse.json({ error: 'Failed to update notification', message: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('POST /api/notifications error', e);
        return NextResponse.json({ error: 'Failed to update notification', message: e.message || String(e) }, { status: 500 });
    }
}

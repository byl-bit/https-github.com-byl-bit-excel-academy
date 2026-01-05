import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    try {
        const actorRole = request.headers.get('x-actor-role') || '';
        const actorId = request.headers.get('x-actor-id') || '';

        if (!['admin', 'teacher', 'student'].includes(actorRole)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        let query = supabase.from('notifications').select('id, user_id, user_name, action, category, details, target_id, target_name, type, is_read, created_at');

        // If not admin, show notifications targeting or created by the user OR broadcast notifications
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
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const { error } = await supabase.from('notifications').delete().eq('id', id);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
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
        if (!body || !body.id) return NextResponse.json({ error: 'Notification id required' }, { status: 400 });

        let query = supabase.from('notifications')
            .update({ is_read: true })
            .eq('id', body.id);

        // Security: if not admin, ensure they own or are the target of this notification
        if (actorRole !== 'admin') {
            if (!actorId) return NextResponse.json({ error: 'Actor ID required' }, { status: 400 });
            query = query.or(`user_id.eq.${actorId},target_id.eq.${actorId}`);
        }

        const { data, error } = await query.select().single();

        if (error) {
            console.error('Failed to mark notification read:', error);
            return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
        }

        return NextResponse.json({ success: true, notification: data });
    } catch (e) {
        console.error('POST /api/notifications error', e);
        return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
    }
}

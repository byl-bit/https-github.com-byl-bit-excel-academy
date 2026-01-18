import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';

/**
 * DELETE /api/admin/clear-announcements
 * Clears all announcements from the database
 * Requires admin role
 */
export async function DELETE(request: Request) {
    const role = request.headers.get('x-actor-role') || '';

    if (role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized: admin role required' }, { status: 403 });
    }

    try {
        const client = supabaseAdmin || supabase;

        // Delete all announcements
        const { error } = await client
            .from('announcements')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) {
            console.error('Error clearing announcements:', error);
            return NextResponse.json({
                error: 'Failed to clear announcements',
                details: error.message
            }, { status: 500 });
        }

        // Verify deletion
        const { data: remaining } = await client
            .from('announcements')
            .select('id')
            .limit(1);

        return NextResponse.json({
            success: true,
            message: 'All announcements cleared successfully',
            remaining: remaining?.length || 0
        });

    } catch (err: any) {
        console.error('Fatal error clearing announcements:', err);
        return NextResponse.json({
            error: 'Internal server error',
            details: err.message
        }, { status: 500 });
    }
}

/**
 * GET /api/admin/clear-announcements
 * Returns count of announcements
 */
export async function GET(request: Request) {
    try {
        const client = supabaseAdmin || supabase;

        const { data, error } = await client
            .from('announcements')
            .select('id, title, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            count: data?.length || 0,
            announcements: data || []
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

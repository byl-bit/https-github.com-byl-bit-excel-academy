import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/utils/activityLog';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
    try {
        const role = request.headers.get('x-actor-role') || '';
        if (role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { data, error } = await supabase
            .from('password_reset_requests')
            .select('id, user_id, user_name, token, expires_at, used, created_at, users(role)')
            .eq('used', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reset requests:', error);
            return NextResponse.json([]);
        }

        return NextResponse.json(data || []);
    } catch (e) {
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const role = request.headers.get('x-actor-role') || '';
        const actorId = request.headers.get('x-actor-id') || '';
        if (role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { requestId, action } = await request.json();

        // Fetch the reset request
        const { data: requests, error: fetchError } = await supabase
            .from('password_reset_requests')
            .select('id, user_id, user_name, token, expires_at, used, created_at')
            .eq('id', requestId)
            .single();

        if (fetchError || !requests) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        const resetReq = requests;

        if (action === 'approve') {
            // Hash the new password before saving it to the users table
            const hashedPassword = await bcrypt.hash(String(resetReq.token), 10);

            // Update user password
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    password: hashedPassword,
                    updated_at: new Date().toISOString()
                })
                .eq('id', resetReq.user_id);

            if (updateError) {
                console.error('Error approving password reset:', updateError);
                return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
            }

            logActivity({
                userId: actorId,
                userName: 'Admin',
                action: 'APPROVED PASSWORD RESET',
                category: 'user',
                details: `Approved reset for user ${resetReq.user_id}`
            });

            // Create notification for admin action
            try {
                await supabase.from('notifications').insert({
                    type: 'account',
                    category: 'user',
                    user_id: resetReq.user_id,
                    user_name: resetReq.user_name || null,
                    action: 'Password Reset Approved',
                    details: `Admin approved password reset for user ${resetReq.user_id}`,
                    target_id: resetReq.user_id,
                    target_name: resetReq.user_name || null
                });
            } catch (nErr) { console.error('Failed to insert notification for approve', nErr); }
        } else {
            logActivity({
                userId: actorId,
                userName: 'Admin',
                action: 'REJECTED PASSWORD RESET',
                category: 'user',
                details: `Rejected reset for user ${resetReq.user_id}`
            });

            try {
                await supabase.from('notifications').insert({
                    type: 'account',
                    category: 'user',
                    user_id: resetReq.user_id,
                    user_name: resetReq.user_name || null,
                    action: 'Password Reset Rejected',
                    details: `Admin rejected password reset for user ${resetReq.user_id}`,
                    target_id: resetReq.user_id,
                    target_name: resetReq.user_name || null
                });
            } catch (nErr) { console.error('Failed to insert notification for reject', nErr); }
        }

        // Mark request as used/delete it
        await supabase
            .from('password_reset_requests')
            .delete()
            .eq('id', requestId);

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Admin reset request error:', e);
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}

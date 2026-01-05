import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { logActivity } from '@/lib/utils/activityLog';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
    try {
        const role = request.headers.get('x-actor-role') || '';
        if (role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const client = supabaseAdmin || supabase;

        // Fetch reset requests with join attempt
        let { data, error } = await client
            .from('password_reset_requests')
            .select('id, user_id, token, expires_at, used, created_at, users(name, role, email, grade, section, roll_number, gender, photo, student_id, teacher_id)')
            .eq('used', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reset requests with join:', error);
            // Fallback: Fetch requests without join
            const { data: fallbackData, error: fbError } = await client
                .from('password_reset_requests')
                .select('id, user_id, token, expires_at, used, created_at')
                .eq('used', false)
                .order('created_at', { ascending: false });

            if (fbError) {
                console.error('Fatal error fetching reset requests:', fbError);
                return NextResponse.json([]);
            }
            data = fallbackData as any;
        }

        // ENHANCEMENT: If users data is missing for some records (join failure/missing relationship)
        // manually fetch user information and stitch it together
        if (data && data.length > 0) {
            const requestsWithMissingUser = data.filter((r: any) => !r.users);

            if (requestsWithMissingUser.length > 0) {
                console.info(`[reset-requests] ${requestsWithMissingUser.length} records missing user data. Stitching manually...`);
                const userIds = requestsWithMissingUser.map((r: any) => r.user_id);

                const { data: users, error: userError } = await client
                    .from('users')
                    .select('*') // Get everything to ensure we don't miss anything due to naming discrepancies
                    .in('id', userIds);

                if (!userError && users) {
                    console.info(`[reset-requests] Manually fetched ${users.length} users for stitching.`);
                    const userMap = users.reduce((acc: any, u: any) => {
                        acc[u.id] = u;
                        return acc;
                    }, {});

                    data = data.map((r: any) => ({
                        ...r,
                        users: r.users || userMap[r.user_id] || null
                    }));
                } else if (userError) {
                    console.error('[reset-requests] Manual user fetch failed:', userError);
                }
            }
        }

        console.info(`[reset-requests] Returning ${(data || []).length} requests (synchronized)`);
        return NextResponse.json(data || []);
    } catch (e) {
        console.error('Reset requests GET error:', e);
        return NextResponse.json({ error: 'Error processing requests' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const role = request.headers.get('x-actor-role') || '';
        const actorId = request.headers.get('x-actor-id') || '';
        if (role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const client = supabaseAdmin || supabase;
        const { requestId, action } = await request.json();
        console.log(`[API] Processing reset request: ${requestId}, action: ${action}`);

        // Fetch the reset request with fallback for join
        let { data: resetReq, error: fetchError } = await client
            .from('password_reset_requests')
            .select('id, user_id, token, expires_at, used, created_at, users(name)')
            .eq('id', requestId)
            .single();

        if (fetchError || !resetReq) {
            console.error('[API] Initial fetch failed, trying fallback:', fetchError);
            const { data: fallbackReq, error: fbError } = await client
                .from('password_reset_requests')
                .select('id, user_id, token, expires_at, used, created_at') // No join
                .eq('id', requestId)
                .single();

            if (fbError || !fallbackReq) {
                console.error('[API] Fallback fetch error:', fbError);
                return NextResponse.json({ error: 'Reset request not found in system' }, { status: 404 });
            }
            resetReq = fallbackReq as any;
        }

        const currentReq = resetReq;
        if (!currentReq) return NextResponse.json({ error: 'Reset request not found' }, { status: 404 });

        if (action === 'approve') {
            // Hash the new password before saving it to the users table
            const hashedPassword = await bcrypt.hash(String(currentReq.token), 10);

            // Update user password
            const { error: updateError } = await client
                .from('users')
                .update({
                    password: hashedPassword,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentReq.user_id);

            if (updateError) {
                console.error('Error approving password reset:', updateError);
                return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
            }

            logActivity({
                userId: actorId,
                userName: 'Admin',
                action: 'APPROVED PASSWORD RESET',
                category: 'user',
                details: `Approved reset for user ${currentReq.user_id}`
            });

            // Create notification for admin action
            try {
                const reqAny = currentReq as any;
                const userData = Array.isArray(reqAny.users) ? reqAny.users[0] : reqAny.users;
                const uName = userData?.name || 'User';
                await supabase.from('notifications').insert({
                    type: 'account',
                    category: 'user',
                    user_id: currentReq.user_id,
                    user_name: uName,
                    action: 'Password Reset Approved',
                    details: `Admin approved password reset for user ${currentReq.user_id}`,
                    target_id: currentReq.user_id,
                    target_name: uName
                });
            } catch (nErr) { console.error('Failed to insert notification for approve', nErr); }
        } else {
            logActivity({
                userId: actorId,
                userName: 'Admin',
                action: 'REJECTED PASSWORD RESET',
                category: 'user',
                details: `Rejected reset for user ${currentReq.user_id}`
            });

            try {
                const reqAny = currentReq as any;
                const userData = Array.isArray(reqAny.users) ? reqAny.users[0] : reqAny.users;
                const uName = userData?.name || 'User';
                await client.from('notifications').insert({
                    type: 'account',
                    category: 'user',
                    user_id: currentReq.user_id,
                    user_name: uName,
                    action: 'Password Reset Rejected',
                    details: `Admin rejected password reset for user ${currentReq.user_id}`,
                    target_id: currentReq.user_id,
                    target_name: uName
                });
            } catch (nErr) { console.error('Failed to insert notification for reject', nErr); }
        }

        // Mark request as used/delete it
        await client
            .from('password_reset_requests')
            .delete()
            .eq('id', requestId);

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Admin reset request error:', e);
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { logActivity } from '@/lib/utils/activityLog';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { userId, email, fullName, newPassword, isAdminGate, grade, section, rollNumber } = await request.json();

        if (!userId || !email || !fullName || !newPassword) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Find user by ID, Email and Name
        // Support admin_id lookup for admin password reset
        // Build OR conditions dynamically to avoid applying `id.eq` with non-UUID values (which can cause DB errors)
        const orClauses = [] as string[];
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (uuidRegex.test(String(userId))) {
            orClauses.push(`id.eq.${userId}`);
        }
        orClauses.push(`student_id.ilike.${userId}`);
        orClauses.push(`teacher_id.ilike.${userId}`);
        orClauses.push(`admin_id.ilike.${userId}`);

        const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, name, role, grade, section, roll_number, email')
            .or(orClauses.join(','))
            .ilike('email', email);

        if (userError || !users || users.length === 0) {
            console.error('[reset-password] user lookup failed:', userError || 'no users found');
            if (process.env.SHOW_RESET_DEBUG === 'true') {
                return NextResponse.json({ error: 'Identity verification failed. Information does not match system records.', debugUsers: users || null, userError: userError || null }, { status: 404 });
            }
            return NextResponse.json({ error: 'Identity verification failed. Information does not match system records.' }, { status: 404 });
        }

        // Normalize helper to compare names (trim + case-insensitive + collapse spaces)
        const normalize = (s?: string) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');

        console.info('[reset-password] request body:', { userId, email, fullName, grade, section, rollNumber, isAdminGate });
        console.info('[reset-password] users fetched count:', users?.length, 'userError:', userError);
        console.info('[reset-password] users list:', (users || []).map(u => ({ id: u.id, email: u.email, name: u.name, full_name: (u as any).full_name, role: u.role })));

        const user = users.find(u => {
            const supplied = normalize(fullName);
            const nameMatch = normalize(u.name) === supplied;
            const fullNameMatch = normalize((u as any).full_name) === supplied;
            return nameMatch || fullNameMatch;
        });

        // For student accounts, require grade, section and roll number for verification
        if (user && user.role === 'student') {
            if (!grade || !section || !rollNumber) {
                return NextResponse.json({ error: 'Students must provide grade, section and roll number for recovery' }, { status: 400 });
            }

            const matchesGrade = String(user.grade || '').trim().toLowerCase() === String(grade || '').trim().toLowerCase();
            const matchesSection = String(user.section || '').trim().toLowerCase() === String(section || '').trim().toLowerCase();
            const matchesRoll = String(user.roll_number ?? '').trim() === String(rollNumber).trim();

            if (!matchesGrade || !matchesSection || !matchesRoll) {
                return NextResponse.json({ error: 'Identity verification failed. Class details do not match our records.' }, { status: 404 });
            }
        }

        console.info('[reset-password] matched user id:', user?.id || null);

        if (!user) {
            return NextResponse.json({ error: 'Identity verification failed. Information does not match system records.' }, { status: 404 });
        }

        // Additional check for admin gate
        if (isAdminGate && user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized: Admin Gate is for administrators only.' }, { status: 403 });
        }

        if (isAdminGate) {
            // Immediate override for admin via private gate
            // Hash the new password before persisting for immediate safety
            const hashed = await bcrypt.hash(String(newPassword), 10);

            const { error: updateError } = await supabase
                .from('users')
                .update({ password: hashed, updated_at: new Date().toISOString() })
                .eq('id', user.id);

            if (updateError) {
                console.error('Error updating admin password:', updateError);
                return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
            }

            // Post-update verification: re-fetch stored hash and verify matches the newly hashed password
            try {
                const { data: refetched, error: refetchErr } = await supabase
                    .from('users')
                    .select('password')
                    .eq('id', user.id)
                    .single();

                if (refetchErr) {
                    console.warn('[reset-password] failed to refetch user for verification:', refetchErr);
                }

                const saved = refetched ? (refetched as any).password : null;
                const verifyHash = saved ? await bcrypt.compare(String(newPassword), saved) : false;
                console.info('[reset-password] post-update verify', { userId: user.id, verifyHash, savedPreview: typeof saved === 'string' ? saved.slice(0, 8) + '...' : null, savedLen: typeof saved === 'string' ? saved.length : null });

                if (!verifyHash) {
                    console.error('[reset-password] verification failed after update for user', user.id);
                    return NextResponse.json({ error: 'Failed to verify password after update' }, { status: 500 });
                }
            } catch (verErr) {
                console.error('[reset-password] error during post-update verification:', verErr);
                return NextResponse.json({ error: 'Failed to verify password after update' }, { status: 500 });
            }

            console.info('[reset-password] admin password updated for user:', user.id);

            logActivity({
                userId: user.id,
                userName: user.name || 'Admin',
                action: 'ADMIN MASTER RESET',
                category: 'system',
                details: 'Password was overridden via Private Master Gate'
            });

            return NextResponse.json({ success: true, message: 'Admin password updated.' });
        } else {
            // Create a pending reset request for Students/Teachers

            const client = supabaseAdmin || supabase;
            // Remove any existing pending requests for this user
            await client
                .from('password_reset_requests')
                .delete()
                .eq('user_id', user.id)
                .eq('used', false);

            // Create new request
            const { error: insertError } = await client
                .from('password_reset_requests')
                .insert({
                    user_id: user.id,
                    token: newPassword, // Using token field to store new password temporarily
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
                    used: false
                });

            if (insertError) {
                console.error('Error creating reset request:', insertError);
                return NextResponse.json({ error: 'Failed to create reset request' }, { status: 500 });
            }

            logActivity({
                userId: user.id,
                userName: user.name,
                action: 'RESET REQUEST SUBMITTED',
                category: 'system',
                details: 'Submitted a password reset request for admin approval'
            });

            // Create server-side notification for admins
            try {
                await supabase.from('notifications').insert({
                    type: 'account',
                    category: 'user',
                    user_id: user.id,
                    user_name: user.name,
                    action: 'Password Reset Requested',
                    details: 'A user submitted a password reset request and needs admin approval',
                    target_id: user.id,
                    target_name: user.name
                });
            } catch (notifErr) {
                console.error('Failed to create reset notification:', notifErr);
            }

            return NextResponse.json({
                success: true,
                pending: true,
                message: 'Recovery request submitted. An administrator must approve your change before you can log in.'
            });
        }
    } catch (error) {
        console.error('Reset error:', error);
        return NextResponse.json({ error: 'Server error during reset.' }, { status: 500 });
    }
}

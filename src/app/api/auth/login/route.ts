import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { normalizeGender } from '@/lib/utils';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        const identifier = (email || '').toString().trim();

        // 1. Find user by email, student_id, or teacher_id (Case insensitive)
        const orQuery = `email.ilike.${identifier},student_id.ilike.${identifier},teacher_id.ilike.${identifier}`;

        const { data: users, error } = await supabase
            .from('users')
            .select('id, email, password, role, status, student_id, teacher_id, admin_id, roll_number, grade, section, gender, name, photo')
            .or(orQuery)
            .limit(1);

        if (error) {
            console.error('Supabase error finding user:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        const user = users?.[0];

        if (!user) {
            console.warn('Login failed: User not found for identifier:', identifier);
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // 2. Check account status
        if (user.status === 'pending') {
            return NextResponse.json({ error: 'Account pending admin approval' }, { status: 401 });
        }
        if (user.status === 'suspended') {
            return NextResponse.json({ error: 'Account suspended' }, { status: 403 });
        }

        // 3. Verify Password
        const storedHash = user.password || '';
        let isValid = false;

        // Check if stored password is a valid bcrypt hash
        if (storedHash.startsWith('$2')) {
            isValid = await bcrypt.compare(password, storedHash);
        } else {
            // Fallback for legacy plain text passwords (should be migrated in production)
            isValid = (storedHash === password);

            // Auto-migrate to bcrypt if it was plain text
            if (isValid) {
                try {
                    const newHash = await bcrypt.hash(password, 10);
                    await supabase.from('users').update({ password: newHash }).eq('id', user.id);
                    console.info(`Migrated password to hash for user ${user.id}`);
                } catch (err) {
                    console.error('Failed to migrate password:', err);
                }
            }
        }

        if (!isValid) {
            console.warn(`Login failed: Invalid password for user ${user.id}`);
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // 4. Transform User Data for Frontend
        // We do not send the password back
        const { password: _, ...rawUser } = user;

        const nameStr = (rawUser.name || '').toString();
        const nameParts = nameStr.trim().split(/\s+/);

        let firstName = nameParts[0] || '';
        let lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        let middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

        const safeUserMapped = {
            id: rawUser.id,
            name: nameStr,
            email: rawUser.email,
            role: rawUser.role,
            status: rawUser.status,
            studentId: rawUser.student_id,
            teacherId: rawUser.teacher_id,
            adminId: rawUser.admin_id,
            rollNumber: rawUser.roll_number,
            grade: rawUser.grade,
            section: rawUser.section,
            gender: normalizeGender(rawUser.gender),
            firstName,
            middleName,
            lastName,
            fullName: nameStr,
            photo: rawUser.photo
        };

        return NextResponse.json({ success: true, user: safeUserMapped });

    } catch (e) {
        console.error('Login error:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

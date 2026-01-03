import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { normalizeGender } from '@/lib/utils';

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const getString = (o: Record<string, unknown>, k: string) => {
    const v = (o as any)[k];
    // Coerce numbers (and booleans) to strings so numeric DB columns like roll_number are returned to the client
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    if (typeof v === 'boolean') return String(v);
    return undefined;
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('role');
    const grade = searchParams.get('grade');
    const section = searchParams.get('section');
    const limit = searchParams.get('limit');
    const id = searchParams.get('id');

    try {
        let query = supabase.from('users').select('id, name, email, role, status, student_id, teacher_id, admin_id, roll_number, grade, section, gender, photo, created_at');

        if (id) query = query.eq('id', id);
        if (roleId) query = query.eq('role', roleId);
        if (grade) query = query.eq('grade', grade);
        if (section) query = query.eq('section', section);

        if (limit) {
            query = query.limit(parseInt(limit));
        }

        const { data: users, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error fetching users:', error);
            return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
        }

        // Map DB snake_case to Frontend camelCase
        const mappedUsers = (users || []).map((u: unknown) => {
            if (!isRecord(u)) return {};
            const nameStr = getString(u, 'name') || '';
            const nameParts = nameStr.trim().split(/\s+/);

            let firstName = '';
            let middleName = '';
            let lastName = '';

            if (nameParts.length > 0) {
                firstName = nameParts[0];
                if (nameParts.length === 2) {
                    lastName = nameParts[1];
                } else if (nameParts.length >= 3) {
                    middleName = nameParts.slice(1, -1).join(' ');
                    lastName = nameParts[nameParts.length - 1];
                }
            }

            return {
                id: getString(u, 'id'),
                name: nameStr,
                email: getString(u, 'email'),
                role: getString(u, 'role'),
                status: getString(u, 'status'),
                studentId: getString(u, 'student_id'),
                teacherId: getString(u, 'teacher_id'),
                adminId: getString(u, 'admin_id'),
                rollNumber: getString(u, 'roll_number'),
                grade: getString(u, 'grade'),
                section: getString(u, 'section'),
                gender: normalizeGender(getString(u, 'gender') || getString(u, 'sex')) || null,
                firstName: getString(u, 'firstName') || firstName,
                middleName: getString(u, 'middleName') || middleName,
                lastName: getString(u, 'lastName') || lastName,
                fullName: nameStr,
                photo: getString(u, 'photo')
            };
        });

        return NextResponse.json(mappedUsers);
    } catch (errorUnknown) {
        console.error('Error fetching users:', errorUnknown);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Helper to map keys (including student_id and roll_number)
        const mapUserToDb = (u: Record<string, unknown>) => {
            const dbUser: Record<string, unknown> = {
                name: getString(u, 'name') || getString(u, 'fullName'),
                email: getString(u, 'email'),
                password: getString(u, 'password'),
                role: getString(u, 'role'),
                status: getString(u, 'status') || 'pending',
                grade: getString(u, 'grade'),
                section: getString(u, 'section'),
                gender: normalizeGender(getString(u, 'gender') || getString(u, 'sex')) || null,
                student_id: getString(u, 'studentId') || getString(u, 'student_id'),
                teacher_id: getString(u, 'teacherId') || getString(u, 'teacher_id'),
                // roll_number stored as numeric when provided
                roll_number: typeof getString(u, 'rollNumber') !== 'undefined' ? Number(getString(u, 'rollNumber')) : (typeof getString(u, 'roll_number') !== 'undefined' ? Number(getString(u, 'roll_number')) : undefined),
                updated_at: getString(u, 'updatedAt') || new Date().toISOString()
            };

            // Remove undefined keys to avoid inserting explicit undefined values
            Object.keys(dbUser).forEach(k => dbUser[k] === undefined && delete dbUser[k]);

            return dbUser;
        };

        // Support bulk creation
        if (Array.isArray(body)) {
            const addedUsers = [];
            const skippedUsers = [];

            for (const item of body) {
                // 1. DYNAMIC DUPLICATE CHECK
                const conditions = [];

                // Check Email (Ignore auto-generated placeholders starting with 'pending-')
                const itemEmail = isRecord(item) ? getString(item, 'email') : undefined;
                if (itemEmail && !itemEmail.startsWith('pending-')) {
                    conditions.push(`email.eq.${itemEmail}`);
                }
                // Check IDs if present
                const itemStudentId = isRecord(item) ? getString(item, 'studentId') || getString(item, 'student_id') : undefined;
                const itemTeacherId = isRecord(item) ? getString(item, 'teacherId') || getString(item, 'teacher_id') : undefined;
                if (itemStudentId) conditions.push(`student_id.eq.${itemStudentId}`);
                if (itemTeacherId) conditions.push(`teacher_id.eq.${itemTeacherId}`);

                let existing = null;

                // Execute ID/Email Check
                if (conditions.length > 0) {
                    const { data } = await supabase
                        .from('users')
                        .select('id')
                        .or(conditions.join(','))
                        .limit(1);
                    if (data && data.length > 0) existing = data;
                }

                // 2. SECONDARY CHECK: For students, check Name + Grade + Section + Roll Number identity
                // (Crucial for CSV imports that lack IDs but have student details)
                if (!existing) {
                    const roleVal = isRecord(item) ? getString(item, 'role') : undefined;
                    const rollVal = isRecord(item) ? (getString(item, 'rollNumber') || getString(item, 'roll_number')) : undefined;
                    const gradeVal = isRecord(item) ? getString(item, 'grade') : undefined;
                    const nameVal = isRecord(item) ? (getString(item, 'name') || getString(item, 'fullName')) : undefined;

                    if (roleVal === 'student' && rollVal && gradeVal) {
                        const { data: identityMatch } = await supabase
                            .from('users')
                            .select('id')
                            .eq('role', 'student')
                            .ilike('name', nameVal || '') // Case insensitive name match
                            .eq('grade', gradeVal)
                            .eq('section', isRecord(item) ? getString(item, 'section') : undefined)
                            .eq('roll_number', Number(rollVal))
                            .limit(1);

                        if (identityMatch && identityMatch.length > 0) existing = identityMatch;
                    }
                }

                if (existing && existing.length > 0) {
                    skippedUsers.push(item);
                    continue;
                }

                const dbPayload = mapUserToDb(item);

                // Hash password if provided (bulk import)
                if (dbPayload.password) {
                    try {
                        const plain = String(dbPayload.password);
                        const hashed = await bcrypt.hash(plain, 10);
                        dbPayload.password = hashed;
                    } catch (hashErr) {
                        console.error('Failed to hash password for bulk import:', hashErr);
                        // Remove sensitive password if hashing fails
                        delete dbPayload.password;
                    }
                }

                // Insert new user
                const { data: newUser, error } = await supabase
                    .from('users')
                    .insert([dbPayload])
                    .select()
                    .single();

                if (!error && newUser) {
                    addedUsers.push(newUser);
                } else if (error) {
                    console.error('Bulk insert error:', error);
                }
            }

            return NextResponse.json({
                success: true,
                count: addedUsers.length,
                added: addedUsers,
                skipped: skippedUsers
            });
        }

        // Single user creation
        const { data: existingCheck } = await supabase
            .from('users')
            .select('id')
            .or(`email.eq.${body.email},student_id.eq.${body.studentId},teacher_id.eq.${body.teacherId}`)
            .limit(1);

        if (existingCheck && existingCheck.length > 0) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        // Prevent duplicate student (same full name and roll number in the same grade/section)
        if (getString(body, 'role') === 'student') {
            const rollVal = getString(body, 'rollNumber') || getString(body, 'roll_number');
            const gradeVal = getString(body, 'grade');
            const nameVal = getString(body, 'name') || getString(body, 'fullName');
            if (gradeVal && nameVal) {
                const { data: dup } = await supabase
                    .from('users')
                    .select('id')
                    .eq('role', 'student')
                    .eq('grade', gradeVal)
                    .eq('section', getString(body, 'section'))
                    .ilike('name', nameVal)
                    .limit(1);
                if (dup && dup.length > 0) {
                    return NextResponse.json({ error: 'A student with this name already exists in the specified class.' }, { status: 400 });
                }
            }
        }

        const dbPayload = mapUserToDb(body);

        // Hash provided password for single create
        if (dbPayload.password) {
            try {
                dbPayload.password = await bcrypt.hash(String(dbPayload.password), 10);
            } catch (hashErr) {
                console.error('Failed to hash password during create:', hashErr);
                return NextResponse.json({ error: 'Failed to save user credentials' }, { status: 500 });
            }
        }

        const client = supabaseAdmin || supabase;
        const { data: newUser, error } = await client
            .from('users')
            .insert([dbPayload])
            .select()
            .single();

        if (error) {
            console.error('Error creating user:', error);
            // Return more details for debugging
            return NextResponse.json({ error: 'Failed to save user', details: error.message }, { status: 500 });
        }

        return NextResponse.json(newUser);
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const actorRole = request.headers.get('x-actor-role') || '';
        const actorId = request.headers.get('x-actor-id') || '';

        const body = await request.json();
        if (!isRecord(body)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        // Allow identification by studentId as well as internal id
        let { id, ...updates } = body as Record<string, unknown>;

        if (!id && (body as Record<string, unknown>)['studentId']) {
            const studentIdVal = String((body as Record<string, unknown>)['studentId']);
            const { data: foundUser } = await supabase
                .from('users')
                .select('id')
                .eq('student_id', studentIdVal)
                .limit(1)
                .single();
            if (!foundUser) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
            id = (foundUser as any).id as string;
        }

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Fetch the user to update
        const { data: users, error: fetchError } = await supabase
            .from('users')
            .select('id, name, status, role, grade, section, roll_number, student_id')
            .eq('id', id)
            .single();

        if (fetchError || !users) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const targetUser = users as Record<string, unknown>;

        // Only admin or the user themselves may update
        if (actorRole !== 'admin' && actorId !== id) {
            return NextResponse.json({ error: 'Unauthorized: only admin or the user can modify this record' }, { status: 403 });
        }

        // Detect Approval (status change from pending to active)
        const isApproving = updates['status'] === 'active' && (targetUser['status'] === 'pending');
        const isStudent = (targetUser['role'] === 'student') || (updates['role'] === 'student');

        if (isApproving && isStudent) {
            // Logic: Link to pre-imported placeholder if exists
            const fullName = (updates['fullName'] as string) || (updates['name'] as string) || (targetUser['name'] as string);
            const grade = (updates['grade'] as string) || (targetUser['grade'] as string);
            const section = (updates['section'] as string) || (targetUser['section'] as string);
            const rollNumber = (updates['roll_number'] as string) || (targetUser['roll_number'] as string);

            // Find an "imported" placeholder
            const { data: placeholders } = await supabase
                .from('users')
                .select('id, name, student_id, grade, section, roll_number')
                .eq('role', 'student')
                .eq('status', 'active')
                .eq('grade', grade)
                .eq('section', section)
                .eq('roll_number', rollNumber || '')
                .ilike('name', fullName)
                .is('password', null);

            if (placeholders && placeholders.length > 0) {
                const placeholder = placeholders[0];

                // MERGE: Update placeholder with registration data
                const mergedUser = {
                    ...placeholder,
                    ...targetUser,
                    ...updates,
                    id: (placeholder as Record<string, unknown>).id, // Keep placeholder's ID
                    student_id: targetUser['student_id'] || (placeholder as Record<string, unknown>)['student_id'],
                    status: 'active',
                    updated_at: new Date().toISOString()
                };

                // Update the placeholder
                await supabase
                    .from('users')
                    .update(mergedUser)
                    .eq('id', (placeholder as Record<string, unknown>).id);

                // Delete the temporary registration record
                await supabase
                    .from('users')
                    .delete()
                    .eq('id', id);

                return NextResponse.json(mergedUser);
            }
        }

        // Standard Update
        const updatedData: Record<string, unknown> = {
            updated_at: new Date().toISOString()
        };

        if (updates['name']) updatedData.name = updates['name'];
        if (updates['fullName']) updatedData.name = updates['fullName'];
        if (updates['email']) updatedData.email = updates['email'];
        if (updates['status']) updatedData.status = updates['status'];
        if (updates['role']) updatedData.role = updates['role'];
        if (updates['password']) {
            // Hash passwords server-side to ensure stored values are secure
            try {
                const plain = String(updates['password']);
                if (plain.length >= 6) {
                    const h = await bcrypt.hash(plain, 10);
                    updatedData.password = h;
                } else {
                    // Do not accept too short passwords
                    return NextResponse.json({ error: 'Password too short' }, { status: 400 });
                }
            } catch (hashErr) {
                console.error('Error hashing password during update:', hashErr);
                return NextResponse.json({ error: 'Failed to hash password' }, { status: 500 });
            }
        }
        // Prevent duplicate student on updates when roll number/fullname/grade/section changes
        const willUpdateRoll = typeof updates['rollNumber'] !== 'undefined' || typeof updates['roll_number'] !== 'undefined';
        const willUpdateName = typeof updates['fullName'] !== 'undefined' || typeof updates['name'] !== 'undefined';
        const willUpdateGradeSection = typeof updates['grade'] !== 'undefined' || typeof updates['section'] !== 'undefined';

        // Check duplicates for students
        if ((willUpdateRoll || willUpdateName || willUpdateGradeSection) && (targetUser['role'] === 'student' || updates['role'] === 'student')) {
            const checkRoll = String(updates['rollNumber'] ?? updates['roll_number'] ?? targetUser['roll_number'] ?? targetUser['rollNumber'] ?? '');
            const checkGrade = String(updates['grade'] ?? targetUser['grade'] ?? '');
            const checkSection = String(updates['section'] ?? targetUser['section'] ?? '');
            const checkName = String(updates['fullName'] ?? updates['name'] ?? targetUser['name'] ?? '');
            if (checkRoll && checkGrade && checkName) {
                const { data: dup } = await supabase
                    .from('users')
                    .select('id')
                    .eq('role', 'student')
                    .eq('grade', checkGrade)
                    .eq('section', checkSection)
                    .eq('roll_number', Number(checkRoll))
                    .ilike('name', checkName)
                    .neq('id', id)
                    .limit(1);

                if (dup && dup.length > 0) {
                    return NextResponse.json({ error: 'Another student with this name and roll number exists in that class.' }, { status: 400 });
                }
            }
        }

        if (typeof updates['grade'] !== 'undefined') updatedData.grade = updates['grade'];
        if (typeof updates['section'] !== 'undefined') updatedData.section = updates['section'];
        if (updates['gender']) updatedData.gender = normalizeGender(updates['gender'] as string) || null;
        if (updates['photo']) updatedData.photo = updates['photo'];

        // Map camelCase to snake_case
        if (updates['studentId']) updatedData.student_id = updates['studentId'];
        if (updates['teacherId']) updatedData.teacher_id = updates['teacherId'];
        if (updates['rollNumber']) updatedData.roll_number = updates['rollNumber'];

        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update(updatedData)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating user:', updateError);
            return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
        }

        // Create server-side notifications for admin visibility when users change sensitive account data
        try {
            const notifications: any[] = [];

            // Email changed
            if (typeof updates['email'] !== 'undefined') {
                notifications.push({
                    type: 'account',
                    category: 'user',
                    user_id: id,
                    user_name: updatedUser?.name || (targetUser['name'] as string) || '',
                    action: 'Email Changed',
                    details: `User updated email`,
                    target_id: id,
                    target_name: updatedUser?.name || (targetUser['name'] as string) || ''
                });
            }

            // Password changed
            if (typeof updates['password'] !== 'undefined') {
                notifications.push({
                    type: 'account',
                    category: 'user',
                    user_id: id,
                    user_name: updatedUser?.name || (targetUser['name'] as string) || '',
                    action: 'Password Changed',
                    details: `User changed their password`,
                    target_id: id,
                    target_name: updatedUser?.name || (targetUser['name'] as string) || ''
                });
            }

            if (notifications.length > 0) {
                // Insert all notifications (non-blocking for user update success)
                await supabase.from('notifications').insert(notifications);
            }
        } catch (notifErr) {
            console.error('Failed to create notifications:', notifErr);
        }

        return NextResponse.json(updatedUser);
    } catch (errorUnknown) {
        console.error('Error updating user:', errorUnknown);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const actorRole = request.headers.get('x-actor-role') || '';

        if (actorRole !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized: admin only' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const param = searchParams.get('id') || searchParams.get('studentId');

        if (!param) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Helper to check if string is a UUID
        const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

        let foundUser = null;
        let findErr = null;

        // 1. If it looks like a student ID, check that column first
        if (param.startsWith('ST-')) {
            const { data, error } = await supabase
                .from('users')
                .select('id, student_id')
                .eq('student_id', param)
                .maybeSingle();
            foundUser = data;
            findErr = error;
        }

        // 2. If not found or doesn't look like ST- ID, try by internal ID (if valid UUID or general string)
        if (!foundUser && !findErr) {
            // Only query 'id' column with eq if it's a valid UUID or if the column type allows it
            // Based on earlier check, 'id' is a UUID in the database
            if (isUUID(param) || !param.includes('-')) {
                const { data, error } = await supabase
                    .from('users')
                    .select('id, student_id')
                    .eq('id', param)
                    .maybeSingle();
                foundUser = data;
                findErr = error;
            }
        }

        if (findErr) {
            console.error('Error finding user for deletion:', findErr);
            return NextResponse.json({ error: 'Database error finding user' }, { status: 500 });
        }

        if (!foundUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const targetId = (foundUser as any).id as string;
        const studentId = (foundUser as any).student_id as string | undefined;

        // Delete user by internal id
        const { error: deleteUserError } = await supabase
            .from('users')
            .delete()
            .eq('id', targetId);

        if (deleteUserError) {
            return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
        }

        // Remove associated results
        if (studentId) {
            await supabase.from('results').delete().eq('student_id', studentId);
            await supabase.from('results_pending').delete().eq('student_id', studentId);
        }

        return NextResponse.json({ success: true, message: 'User and related results deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}

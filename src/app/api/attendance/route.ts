import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const grade = searchParams.get('grade');
    const section = searchParams.get('section');
    const studentId = searchParams.get('studentId');

    if (studentId) {
        // Student view: get their attendance records
        const { data, error } = await supabase
            .from('attendance')
            .select('id, student_id, date, status, marked_by')
            .eq('student_id', studentId)
            .order('date', { ascending: false });

        if (error) {
            console.error('Supabase error fetching attendance:', error);
            return NextResponse.json([]);
        }

        return NextResponse.json(data || []);
    } else if (date && grade && section) {
        // Teacher view: specific day - need to join with users table to filter by grade/section
        const splitGrade = grade.split(' ')[1] || grade;

        // First, get all students with matching grade and section
        const { data: students, error: studentsError } = await supabase
            .from('users')
            .select('id, student_id')
            .eq('role', 'student')
            .eq('grade', splitGrade)
            .eq('section', section)
            .eq('status', 'active');

        if (studentsError) {
            console.error('Supabase error fetching students:', studentsError);
            return NextResponse.json([]);
        }

        if (!students || students.length === 0) {
            return NextResponse.json([]);
        }

        // Get student IDs
        const studentIds = students.map(s => s.student_id || s.id).filter(Boolean);

        // Now fetch attendance records for these students on the specified date
        const { data, error } = await supabase
            .from('attendance')
            .select('id, student_id, date, status, marked_by')
            .eq('date', date) // Supabase should handle the date format conversion
            .in('student_id', studentIds);

        if (error) {
            console.error('Supabase error fetching attendance:', error);
            return NextResponse.json([]);
        }

        return NextResponse.json(data || []);
    }

    // Default: return empty array if no valid query params
    return NextResponse.json([]);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { date, grade, section, presentStudentIds, teacherId } = body;

        if (!date || !grade || !section || !Array.isArray(presentStudentIds)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate date format to ensure it's in YYYY-MM-DD format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return NextResponse.json({ error: 'Invalid date format. Expected YYYY-MM-DD' }, { status: 400 });
        }

        // Get all students with matching grade and section
        const splitGrade = grade.split(' ')[1] || grade;
        const { data: students, error: studentsError } = await supabase
            .from('users')
            .select('id, student_id')
            .eq('role', 'student')
            .eq('grade', splitGrade)
            .eq('section', section)
            .eq('status', 'active');

        if (studentsError) {
            console.error('Supabase error fetching students:', studentsError);
            return NextResponse.json({ error: studentsError.message }, { status: 500 });
        }

        if (!students || students.length === 0) {
            return NextResponse.json({ success: true, message: 'No students found for this grade and section' });
        }

        // Get all student IDs for this grade/section
        const allStudentIds = students.map(s => s.student_id || s.id).filter(Boolean) as string[];

        if (allStudentIds.length === 0) {
            return NextResponse.json({ success: true, message: 'No valid student IDs found' });
        }

        // Filter to only include valid student IDs from the present list
        const validPresentStudentIds = presentStudentIds.filter(id => allStudentIds.includes(id));

        // Delete all existing attendance records for this date and class first
        const { error: deleteError } = await supabase
            .from('attendance')
            .delete()
            .eq('date', date)
            .in('student_id', allStudentIds);

        if (deleteError) {
            console.error('Supabase error deleting attendance:', deleteError);
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        // If there are present students, insert them
        if (validPresentStudentIds.length > 0) {
            const presentRecords = validPresentStudentIds.map(student_id => ({
                student_id,
                date,
                status: 'present',
                marked_by: teacherId
            }));

            const { error: insertError } = await supabase
                .from('attendance')
                .insert(presentRecords);

            if (insertError) {
                console.error('Supabase error saving attendance:', insertError);

                // Try to insert records in smaller batches to avoid timeout
                const batchSize = 50;
                for (let i = 0; i < presentRecords.length; i += batchSize) {
                    const batch = presentRecords.slice(i, i + batchSize);
                    const { error: batchError } = await supabase
                        .from('attendance')
                        .insert(batch);

                    if (batchError) {
                        console.error(`Batch insert error for records ${i}-${i + batchSize - 1}:`, batchError);
                        return NextResponse.json({
                            error: `Failed to save attendance records: ${batchError.message}`
                        }, { status: 500 });
                    }
                }
            }
        }

        // Activity logging
        try {
            const { logActivity } = await import('@/lib/utils/activityLog');
            logActivity({
                userId: teacherId || 'teacher-001',
                userName: 'Teacher',
                action: 'Updated Attendance',
                category: 'attendance',
                details: `Updated attendance for ${validPresentStudentIds.length} students present on ${date} (${grade}-${section})`
            });
        } catch (le) {
            console.error('Logging failed', le);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unexpected error in attendance POST:', error);
        return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 });
    }
}
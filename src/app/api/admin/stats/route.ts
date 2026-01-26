import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
    const actorRole = request.headers.get('x-actor-role') || '';
    if (actorRole !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = supabaseAdmin || supabase;

    try {
        // Run counts in parallel for performance
        const [
            { count: totalStudents },
            { count: activeStudents },
            { count: pendingStudents },
            { count: totalTeachers },
            { count: activeTeachers },
            { count: pendingTeachers },
            { count: totalResults },
            { count: totalPendingResults },
            { count: totalAnnouncements },
            { count: totalBooks }
        ] = await Promise.all([
            db.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
            db.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('status', 'active'),
            db.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('status', 'pending'),
            db.from('users').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
            db.from('users').select('*', { count: 'exact', head: true }).eq('role', 'teacher').eq('status', 'active'),
            db.from('users').select('*', { count: 'exact', head: true }).eq('role', 'teacher').eq('status', 'pending'),
            db.from('results').select('*', { count: 'exact', head: true }),
            db.from('results_pending').select('*', { count: 'exact', head: true }),
            db.from('announcements').select('*', { count: 'exact', head: true }),
            db.from('books').select('*', { count: 'exact', head: true })
        ]);

        // Get some aggregates for results (average pass rate etc)
        // Note: For a very large database, we might want to cache this or use a more efficient query
        const { data: resultAggs } = await db.from('results').select('average');

        let topAverage = 0;
        let passRate = 0;
        if (resultAggs && resultAggs.length > 0) {
            topAverage = Math.max(...resultAggs.map(r => r.average || 0));
            passRate = (resultAggs.filter(r => (r.average || 0) >= 50).length / resultAggs.length) * 100;
        }

        // Efficient count of students per grade and section
        const { data: usersForGrades } = await db.from('users').select('grade, section').eq('role', 'student');
        const studentsByGrade: Record<string, number> = {};
        const studentsBySection: Record<string, number> = {};

        (usersForGrades || []).forEach(u => {
            if (u.grade) studentsByGrade[u.grade] = (studentsByGrade[u.grade] || 0) + 1;
            if (u.section) studentsBySection[u.section] = (studentsBySection[u.section] || 0) + 1;
        });

        return NextResponse.json({
            totalStudents: totalStudents || 0,
            activeStudents: activeStudents || 0,
            pendingStudents: pendingStudents || 0,
            totalTeachers: totalTeachers || 0,
            activeTeachers: activeTeachers || 0,
            pendingTeachers: pendingTeachers || 0,
            publishedResults: totalResults || 0,
            resultsCount: totalResults || 0,
            pendingResults: totalPendingResults || 0,
            totalAnnouncements: totalAnnouncements || 0,
            totalBooks: totalBooks || 0,
            studentsByGrade,
            studentsBySection,
            topAverage,
            passRate: Math.round(passRate * 10) / 10
        });
    } catch (error) {
        console.error('Stats fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
    }
}

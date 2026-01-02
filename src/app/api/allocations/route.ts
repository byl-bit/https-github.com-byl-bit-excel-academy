import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { SubjectAllocation } from '@/lib/mockData';

export async function GET() {
    const { data, error } = await supabase
        .from('allocations')
        .select('id, teacher_id, teacher_name, grade, section, subject, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Supabase error fetching allocations:', error);
        return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (Array.isArray(body)) {
            // Full replace: delete all and insert new
            await supabase.from('allocations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            const mapped = body.map((a: any) => ({
                teacher_id: a.teacherId || a.teacher_id,
                teacher_name: a.teacherName || a.teacher_name,
                grade: a.grade,
                section: a.section,
                subject: a.subject,
                created_at: a.createdAt || a.created_at || new Date().toISOString()
            }));
            const { error } = await supabase.from('allocations').insert(mapped);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        // Single create
        const record = {
            teacher_id: body.teacherId, // Map to snake_case
            teacher_name: body.teacherName, // Map to snake_case
            grade: body.grade,
            section: body.section,
            subject: body.subject
        };

        const { data, error } = await supabase
            .from('allocations')
            .insert([record])
            .select()
            .single();

        if (error) {
            console.error('Supabase error creating allocation:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to create allocation' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const { error } = await supabase
        .from('allocations')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Supabase error deleting allocation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

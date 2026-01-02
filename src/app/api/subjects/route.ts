import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    const { data, error } = await supabase
        .from('subjects')
        .select('name')
        .order('name', { ascending: true });

    if (error) {
        console.error('Supabase error fetching subjects:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Extract just the names
    const subjects = data?.map(s => s.name) || [];

    // Return default subjects if empty
    if (subjects.length === 0) {
        return NextResponse.json([
            'Amharic', 'Afan Oromo', 'Maths', 'Physics', 'Biology', 'History', 'Citizenship', 'ICT', 'Economics', 'Agriculture', 'WDD', 'HPE'
        ]);
    }

    return NextResponse.json(subjects);
}

export async function POST(request: Request) {
    const body = await request.json();

    if (!Array.isArray(body)) {
        return NextResponse.json({ error: 'Body must be an array of subject names' }, { status: 400 });
    }

    // Delete all existing subjects
    await supabase.from('subjects').delete().neq('name', '');

    // Insert new subjects
    const subjectsToInsert = body.map(name => ({ name }));
    const { error } = await supabase.from('subjects').insert(subjectsToInsert);

    if (error) {
        console.error('Supabase error updating subjects:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

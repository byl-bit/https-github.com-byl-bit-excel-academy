import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    const { data, error } = await supabase
        .from('admissions')
        .select('id, fullName, email, phone, grade, gender, status, submitted_at')
        .order('submitted_at', { ascending: false });

    if (error) {
        console.error('Supabase error fetching admissions:', error);
        return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
}

export async function POST(request: Request) {
    const body = await request.json();

    const { data, error } = await supabase
        .from('admissions')
        .insert([body])
        .select()
        .single();

    if (error) {
        console.error('Supabase error creating admission:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
    }

    const { error } = await supabase
        .from('admissions')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Supabase error deleting admission:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

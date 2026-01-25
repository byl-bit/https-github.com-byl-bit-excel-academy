import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    const { data, error } = await supabase
        .from('settings')
        .select('key, value');

    if (error) {
        console.error('Supabase error fetching settings:', error);
        return NextResponse.json({}, { status: 500 });
    }

    // Convert to object format
    const settings: Record<string, unknown> = {};
    if (Array.isArray(data)) {
        data.forEach((row: Record<string, unknown>) => {
            const key = row['key'];
            if (typeof key === 'string') {
                settings[key] = row['value'];
            }
        });
    }

    // Inject defaults into the object without blocking on database writes
    const defaultAssessments = [
        { id: 'test1', label: 'Test', weight: 10, maxMarks: 100 },
        { id: 'mid', label: 'Mid Exam', weight: 15, maxMarks: 100 },
        { id: 'test2', label: 'test-2', weight: 10, maxMarks: 100 },
        { id: 'assignment', label: 'Assignments', weight: 5, maxMarks: 100 },
        { id: 'final', label: 'Final Exam', weight: 60, maxMarks: 100 }
    ];

    if (settings['assessmentTypes'] === undefined || settings['assessmentTypes'] === null) {
        settings['assessmentTypes'] = defaultAssessments;
    }
    if (!settings['principalName']) settings['principalName'] = 'Principal';
    if (!settings['homeroomName']) settings['homeroomName'] = 'Class Teacher';
    if (settings['letterheadUrl'] === undefined) settings['letterheadUrl'] = '';

    // Ensure boolean types are actually booleans
    const boolKeys = ['allowLibraryDownload', 'allowTeacherEditAfterSubmission', 'reportCardDownload', 'certificateDownload', 'maintenanceMode'];
    boolKeys.forEach(k => {
        if (settings[k] !== undefined) {
            settings[k] = String(settings[k]) === 'true';
        }
    });

    if (settings['allowLibraryDownload'] === undefined) settings['allowLibraryDownload'] = false;
    if (settings['allowTeacherEditAfterSubmission'] === undefined) settings['allowTeacherEditAfterSubmission'] = false;
    if (settings['reportCardDownload'] === undefined) settings['reportCardDownload'] = true;
    if (settings['certificateDownload'] === undefined) settings['certificateDownload'] = true;
    if (settings['maintenanceMode'] === undefined) settings['maintenanceMode'] = false;

    return new Response(JSON.stringify(settings), {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
        }
    });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (typeof body !== 'object' || body === null || Array.isArray(body)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // Update each setting key
        for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
            await supabase
                .from('settings')
                .upsert({ key, value }, { onConflict: 'key' });
        }

        // Fetch updated settings
        const { data } = await supabase
            .from('settings')
            .select('key, value');

        const settings: Record<string, unknown> = {};
        if (Array.isArray(data)) {
            data.forEach((row: Record<string, unknown>) => {
                const k = row['key'];
                if (typeof k === 'string') settings[k] = row['value'];
            });
        }

        return NextResponse.json(settings);
    } catch (errorUnknown) {
        console.error('Settings update error:', errorUnknown);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}

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

    // If assessmentTypes is missing or empty, inject sane defaults and persist them
    const defaultAssessments = [
        { id: 'test1', label: 'Test', weight: 10, maxMarks: 100 },
        { id: 'mid', label: 'Mid Exam', weight: 15, maxMarks: 100 },
        { id: 'test2', label: 'test-2', weight: 10, maxMarks: 100 },
        { id: 'assignment', label: 'Assignments', weight: 5, maxMarks: 100 },
        { id: 'final', label: 'Final Exam', weight: 60, maxMarks: 100 }
    ];

    try {
        const current = settings['assessmentTypes'];
        // Only inject defaults if the setting is COMPLETELY missing/null.
        // If it's an empty array, it means the user intentionally cleared it.
        if (current === undefined || current === null) {
            await supabase.from('settings').upsert({ key: 'assessmentTypes', value: defaultAssessments });
            settings['assessmentTypes'] = defaultAssessments;
        }

        // Inject default signature and letterhead settings if missing
        if (!settings['principalName']) {
            await supabase.from('settings').upsert({ key: 'principalName', value: 'Principal' });
            settings['principalName'] = 'Principal';
        }
        if (!settings['homeroomName']) {
            await supabase.from('settings').upsert({ key: 'homeroomName', value: 'Class Teacher' });
            settings['homeroomName'] = 'Class Teacher';
        }
        if (!settings['letterheadUrl']) {
            // Default empty string; admins can configure a URL later
            await supabase.from('settings').upsert({ key: 'letterheadUrl', value: '' });
            settings['letterheadUrl'] = '';
        }
    } catch (injectErr) {
        console.warn('Failed to inject default settings:', injectErr);
    }

    return NextResponse.json(settings);
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

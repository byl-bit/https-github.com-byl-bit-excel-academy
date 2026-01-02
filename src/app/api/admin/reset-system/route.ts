import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { promises as fs } from 'fs';
import path from 'path';
import { logActivity } from '@/lib/utils/activityLog';

export async function POST(request: Request) {
    try {
        const role = request.headers.get('x-actor-role') || '';
        const actorId = request.headers.get('x-actor-id') || 'unknown';

        if (role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        console.info('Starting full system reset initiated by:', actorId);

        // 1. Clear Supabase Tables
        const tablesToClear = [
            'results',
            'results_pending',
            'admissions',
            'allocations',
            'announcements',
            'attendance',
            'notifications',
            'password_reset_requests'
        ];

        for (const table of tablesToClear) {
            const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) console.error(`Error clearing table ${table}:`, error);
        }

        // 2. Clear Users (Except Admins)
        const { error: userError } = await supabase
            .from('users')
            .delete()
            .neq('role', 'admin');
        if (userError) console.error('Error clearing users:', userError);

        // 3. Reset Settings & Assessment Types
        const defaultAssessments = [
            { id: 'test1', label: 'Test 1', weight: 10, maxMarks: 100 },
            { id: 'mid', label: 'Mid', weight: 30, maxMarks: 100 },
            { id: 'test2', label: 'Test 2', weight: 10, maxMarks: 100 },
            { id: 'assessment', label: 'Assessment', weight: 10, maxMarks: 100 },
            { id: 'final', label: 'Final Exam', weight: 40, maxMarks: 100 }
        ];

        await supabase.from('settings').upsert({ key: 'assessmentTypes', value: defaultAssessments });
        await supabase.from('settings').upsert({ key: 'letterheadUrl', value: '' });

        // 4. Reset Subjects to Defaults
        await supabase.from('subjects').delete().neq('name', '___');
        const defaultSubjects = [
            { name: 'Mathematics' },
            { name: 'English' },
            { name: 'Science' },
            { name: 'Social Studies' }
        ];
        await supabase.from('subjects').insert(defaultSubjects);

        // 5. Clear Library Books (JSON file)
        const BOOKS_FILE = path.join(process.cwd(), 'data', 'books.json');
        try {
            await fs.writeFile(BOOKS_FILE, '[]');
            console.info('Library JSON cleared.');
        } catch (e) {
            console.warn('Failed to clear library JSON (might not exist):', e);
        }

        logActivity({
            userId: actorId,
            userName: 'Admin',
            action: 'FULL SYSTEM RESET',
            category: 'system',
            details: 'All data cleared. Settings reset to defaults. Admin accounts preserved.'
        });

        return NextResponse.json({ success: true, message: 'System has been reset to defaults.' });

    } catch (e) {
        console.error('System reset failed:', e);
        return NextResponse.json({ error: 'Reset failed' }, { status: 500 });
    }
}

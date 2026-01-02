import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { logActivity } from '@/lib/utils/activityLog';

export async function POST(request: Request) {
  try {
    const role = request.headers.get('x-actor-role') || '';
    const actorId = request.headers.get('x-actor-id') || 'unknown';
    if (role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { userId, studentId, newPassword } = await request.json();
    const identifier = studentId || userId;
    if (!identifier || !newPassword) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const hashed = await bcrypt.hash(String(newPassword), 10);

    // Try by internal id first, then by student_id
    const { data, error: updateError } = await supabase
      .from('users')
      .update({ password: hashed, updated_at: new Date().toISOString() })
      .or(`id.eq.${identifier},student_id.eq.${identifier}`)
      .select()
      .single();

    if (updateError || !data) {
      console.error('Force reset error:', updateError);
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    logActivity({ userId: actorId, userName: 'Admin', action: 'FORCE RESET PASSWORD', category: 'user', details: `Admin forced password reset for user ${identifier}` });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Force reset exception:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
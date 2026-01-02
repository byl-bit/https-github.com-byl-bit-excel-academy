import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Standard client for public/authenticated operations
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createClient('https://placeholder.supabase.co', 'placeholder');

// Admin client for restricted operations (server-side only)
export const supabaseAdmin = (supabaseUrl && supabaseServiceRoleKey)
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;

if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ Missing Supabase environment variables. Check .env.local');
        console.warn('Current URL:', supabaseUrl);
    }
}

// Helper to handle Supabase errors
export function handleSupabaseError(error: unknown, context: string) {
    console.error(`Supabase error in ${context}:`, error);
    const err = (error as Record<string, unknown>) || {};
    const message = typeof err.message === 'string' ? err.message : 'Database operation failed';
    const details = typeof err.details === 'string' ? err.details : null;
    return { error: message, details };
}

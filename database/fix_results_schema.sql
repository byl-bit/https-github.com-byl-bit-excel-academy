-- =====================================================
-- FIX FOR MISSING COLUMNS IN RESULTS TABLES
-- =====================================================
-- Run this in your Supabase SQL Editor if you see
-- "column does not exist" errors.
-- =====================================================

-- 1. Ensure 'results' table has all required columns
ALTER TABLE results ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
ALTER TABLE results ADD COLUMN IF NOT EXISTS submission_level TEXT;
ALTER TABLE results ADD COLUMN IF NOT EXISTS roll_number TEXT;
ALTER TABLE results ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE results ADD COLUMN IF NOT EXISTS student_name TEXT DEFAULT '';

-- 2. Create 'results_pending' table if it doesn't exist
CREATE TABLE IF NOT EXISTS results_pending (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    grade TEXT NOT NULL,
    section TEXT NOT NULL,
    roll_number TEXT,
    gender TEXT,
    subjects JSONB NOT NULL DEFAULT '[]'::jsonb,
    total NUMERIC DEFAULT 0,
    average NUMERIC DEFAULT 0,
    rank INTEGER,
    conduct TEXT,
    result TEXT,
    promoted_or_detained TEXT,
    status TEXT DEFAULT 'pending',
    submission_level TEXT,
    submitted_by TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ensure 'results_pending' table has all required columns (if it already existed)
ALTER TABLE results_pending ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE results_pending ADD COLUMN IF NOT EXISTS submission_level TEXT;
ALTER TABLE results_pending ADD COLUMN IF NOT EXISTS roll_number TEXT;
ALTER TABLE results_pending ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE results_pending ADD COLUMN IF NOT EXISTS student_name TEXT DEFAULT '';

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_results_pending_student_id ON results_pending(student_id);
CREATE INDEX IF NOT EXISTS idx_results_pending_status ON results_pending(status);
CREATE INDEX IF NOT EXISTS idx_results_status ON results(status);

-- 5. Set appropriate constraints if missing
-- Note: Replace with actual constraints if preferred, but these are safer for migrations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'results_status_check') THEN
        ALTER TABLE results ADD CONSTRAINT results_status_check CHECK (status IN ('pending', 'published'));
    END IF;
END $$;

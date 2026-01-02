-- =====================================================
-- EXCEL ACADEMY - MASTER DATABASE SCHEMA
-- =====================================================
-- This file contains the complete, unified schema for all tables.
-- Run this in your Supabase SQL Editor to initialize the database.
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
    status TEXT DEFAULT 'pending',
    student_id TEXT UNIQUE,
    teacher_id TEXT UNIQUE,
    admin_id TEXT UNIQUE, -- Admin ID used for password reset (e.g., AD-2025-001)
    grade TEXT,
    section TEXT,
    roll_number TEXT,
    gender TEXT,
    photo TEXT,
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_teacher_id ON users(teacher_id);
CREATE INDEX IF NOT EXISTS idx_users_admin_id ON users(admin_id) WHERE admin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_grade_section ON users(grade, section);

-- =====================================================
-- 2. RESULTS TABLE (Published)
-- =====================================================
CREATE TABLE IF NOT EXISTS results (
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
    status TEXT DEFAULT 'published',
    submission_level TEXT,
    published_at TIMESTAMPTZ,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_results_student_id ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_grade_section ON results(grade, section);
CREATE INDEX IF NOT EXISTS idx_results_status ON results(status);

-- =====================================================
-- 3. RESULTS_PENDING TABLE
-- =====================================================
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

CREATE INDEX IF NOT EXISTS idx_results_pending_student_id ON results_pending(student_id);
CREATE INDEX IF NOT EXISTS idx_results_pending_status ON results_pending(status);

-- =====================================================
-- 4. ADMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS admissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_full_name TEXT NOT NULL,
    student_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    grade TEXT NOT NULL,
    gender TEXT,
    message TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admissions_email ON admissions(email);
CREATE INDEX IF NOT EXISTS idx_admissions_grade ON admissions(grade);

-- =====================================================
-- 5. ALLOCATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    grade TEXT NOT NULL,
    section TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_allocations_teacher_id ON allocations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_allocations_grade_section ON allocations(grade, section);
CREATE INDEX IF NOT EXISTS idx_allocations_subject ON allocations(subject);

-- =====================================================
-- 6. ANNOUNCEMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    urgency TEXT DEFAULT 'normal',
    target_audience TEXT[] DEFAULT ARRAY['all'],
    image_url TEXT,
    media JSONB DEFAULT '[]'::jsonb,
    type TEXT CHECK (type IN ('general', 'academic', 'event')),
    date TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);

-- =====================================================
-- 7. SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES 
('assessmentTypes', '[]'::jsonb),
('reportCardDownload', 'true'::jsonb),
('certificateDownload', 'true'::jsonb),
('allowTeacherEditAfterSubmission', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 8. SUBJECTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS subjects (
    name TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default subjects
INSERT INTO subjects (name) VALUES 
('Mathematics'), ('English'), ('Science'), ('Social Studies'), 
('Physics'), ('Chemistry'), ('Biology'), ('History'), 
('Geography'), ('Computer Science')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 9. ATTENDANCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    marked_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

-- =====================================================
-- 10. PASSWORD_RESET_REQUESTS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS password_reset_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_requests(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_requests(user_id);

-- =====================================================
-- 11. BOOKS TABLE (for Library)
-- =====================================================
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    author TEXT,
    category TEXT,
    file_url TEXT NOT NULL,
    cover_image TEXT,
    description TEXT,
    uploaded_by TEXT,
    file_name TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);

-- =====================================================
-- 12. NOTIFICATIONS TABLE (for Logs & Activity)
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    user_id VARCHAR(255),
    user_name VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    target_id VARCHAR(255),
    target_name VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_results_updated_at ON results;
CREATE TRIGGER update_results_updated_at BEFORE UPDATE ON results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_results_pending_updated_at ON results_pending;
CREATE TRIGGER update_results_pending_updated_at BEFORE UPDATE ON results_pending FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DEFAULT ADMIN ACCOUNT
-- =====================================================
INSERT INTO users (email, password, role, name, admin_id, status, created_at, updated_at)
VALUES (
    'admin@excel.edu',
    'Admin123', -- Hash this using bcrypt for production (e.g. via API)
    'admin',
    'Administrator',
    'AD-2025-001',
    'active',
    NOW(),
    NOW()
)
ON CONFLICT (email) 
DO UPDATE SET
    name = EXCLUDED.name,
    admin_id = EXCLUDED.admin_id,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = NOW();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Development: Enable for security, but allow all authenticated.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE results_pending ENABLE ROW LEVEL SECURITY;
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Catch-all policy for authenticated users (Refine in production)
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow all for authenticated users" ON %I', t);
        EXECUTE format('CREATE POLICY "Allow all for authenticated users" ON %I FOR ALL USING (true)', t);
    END LOOP;
END $$;

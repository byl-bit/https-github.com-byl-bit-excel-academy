-- ============================================
-- Excel Academy - Supabase Database Schema
-- ============================================
-- This SQL script creates all necessary tables for the Excel Academy system
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE users (
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
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_users_admin_id ON users(admin_id) WHERE admin_id IS NOT NULL;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_grade_section ON users(grade, section);

-- ============================================
-- 2. RESULTS TABLE (Published)
-- ============================================
CREATE TABLE results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    grade TEXT NOT NULL,
    section TEXT NOT NULL,
    roll_number TEXT,
    gender TEXT,
    subjects JSONB NOT NULL DEFAULT '[]'::jsonb,
    total INTEGER DEFAULT 0,
    average FLOAT DEFAULT 0,
    rank INTEGER,
    conduct TEXT,
    result TEXT,
    promoted_or_detained TEXT,
    status TEXT DEFAULT 'published',
    submission_level TEXT,
    published_at TIMESTAMP,
    approved_by TEXT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_results_student_id ON results(student_id);
CREATE INDEX idx_results_grade_section ON results(grade, section);
CREATE INDEX idx_results_status ON results(status);

-- ============================================
-- 3. RESULTS_PENDING TABLE
-- ============================================
CREATE TABLE results_pending (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    grade TEXT NOT NULL,
    section TEXT NOT NULL,
    roll_number TEXT,
    gender TEXT,
    subjects JSONB NOT NULL DEFAULT '[]'::jsonb,
    total INTEGER DEFAULT 0,
    average FLOAT DEFAULT 0,
    rank INTEGER,
    conduct TEXT,
    result TEXT,
    promoted_or_detained TEXT,
    status TEXT DEFAULT 'pending',
    submission_level TEXT,
    submitted_by TEXT,
    submitted_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_results_pending_student_id ON results_pending(student_id);
CREATE INDEX idx_results_pending_status ON results_pending(status);

-- ============================================
-- 4. ADMISSIONS TABLE
-- ============================================
CREATE TABLE admissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_full_name TEXT NOT NULL,
    student_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    grade TEXT NOT NULL,
    gender TEXT,
    message TEXT,
    submitted_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admissions_email ON admissions(email);
CREATE INDEX idx_admissions_grade ON admissions(grade);

-- ============================================
-- 5. ALLOCATIONS TABLE
-- ============================================
CREATE TABLE allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    grade TEXT NOT NULL,
    section TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_allocations_teacher_id ON allocations(teacher_id);
CREATE INDEX idx_allocations_grade_section ON allocations(grade, section);
CREATE INDEX idx_allocations_subject ON allocations(subject);

-- ============================================
-- 6. ANNOUNCEMENTS TABLE
-- ============================================
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    urgency TEXT DEFAULT 'normal',
    target_audience TEXT[] DEFAULT ARRAY['all'],
    created_by TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_announcements_created_at ON announcements(created_at DESC);

-- ============================================
-- 7. SETTINGS TABLE
-- ============================================
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES 
('assessmentTypes', '[]'::jsonb),
('reportCardDownload', 'true'::jsonb),
('certificateDownload', 'true'::jsonb),
('allowTeacherEditAfterSubmission', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 8. SUBJECTS TABLE
-- ============================================
CREATE TABLE subjects (
    name TEXT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default subjects
INSERT INTO subjects (name) VALUES 
('Mathematics'),
('English'),
('Science'),
('Social Studies')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 9. ATTENDANCE TABLE
-- ============================================
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    marked_by TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, date)
);

CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(date);

-- ============================================
-- 10. PASSWORD_RESET_REQUESTS TABLE
-- ============================================
CREATE TABLE password_reset_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_password_reset_token ON password_reset_requests(token);
CREATE INDEX idx_password_reset_user_id ON password_reset_requests(user_id);

-- ============================================
-- 11. BOOKS TABLE (for Library)
-- ============================================
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    author TEXT,
    category TEXT,
    file_url TEXT NOT NULL,
    cover_image TEXT,
    description TEXT,
    uploaded_by TEXT,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_books_category ON books(category);
CREATE INDEX idx_books_title ON books(title);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enable RLS on all tables
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

-- For now, allow all authenticated users full access
-- TODO: Refine these policies based on roles
CREATE POLICY "Allow all for authenticated users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON results FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON results_pending FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON admissions FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON allocations FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON announcements FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON settings FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON subjects FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON attendance FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON password_reset_requests FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON books FOR ALL USING (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_results_updated_at BEFORE UPDATE ON results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_results_pending_updated_at BEFORE UPDATE ON results_pending FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DEFAULT ADMIN USER
-- ============================================
-- To create the default admin account with admin_id for password reset,
-- run the migration script: database/migrations/create_admin_account.sql
-- 
-- Default Admin Credentials:
--   Email: admin@excel.edu
--   Admin ID: AD-2025-001
--   Full Name: Administrator
--   Password: Admin123 (change after first login!)
-- 
-- See ADMIN_SETUP_GUIDE.md for detailed instructions.

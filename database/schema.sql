-- =====================================================
-- EXCEL ACADEMY - COMPLETE DATABASE SCHEMA
-- =====================================================
-- This file contains the complete schema for all tables
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  password TEXT,
  role TEXT CHECK (role IN ('admin', 'teacher', 'student')),
  full_name TEXT,
  name TEXT,
  student_id TEXT UNIQUE,
  teacher_id TEXT UNIQUE,
  admin_id TEXT UNIQUE,
  grade TEXT,
  section TEXT,
  gender TEXT,
  photo TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  updated_by TEXT
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_teacher_id ON users(teacher_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_grade_section ON users(grade, section);

-- =====================================================
-- 2. RESULTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT,
  grade TEXT,
  section TEXT,
  gender TEXT,
  subjects JSONB NOT NULL,
  total NUMERIC,
  average NUMERIC,
  conduct TEXT,
  result TEXT CHECK (result IN ('PASS', 'FAIL')),
  promoted_or_detained TEXT CHECK (promoted_or_detained IN ('PROMOTED', 'DETAINED')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'published')),
  rank INTEGER,
  submitted_by TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  approved_by TEXT,
  approved_at TIMESTAMPTZ
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_results_student_id ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_status ON results(status);
CREATE INDEX IF NOT EXISTS idx_results_grade_section ON results(grade, section);

-- =====================================================
-- 3. ANNOUNCEMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT CHECK (type IN ('general', 'academic', 'event')),
  date TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);

-- =====================================================
-- 4. ADMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS admissions (
  id TEXT PRIMARY KEY,
  student_name TEXT,
  family_full_name TEXT,
  email TEXT,
  phone_number TEXT,
  grade TEXT,
  age TEXT,
  gender TEXT,
  previous_school TEXT,
  location TEXT,
  file_name TEXT,
  data JSONB,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending'
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admissions_status ON admissions(status);
CREATE INDEX IF NOT EXISTS idx_admissions_submitted_at ON admissions(submitted_at DESC);

-- =====================================================
-- 5. SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES 
  ('subjects', '["Mathematics", "English", "Physics", "Chemistry", "Biology", "History", "Geography", "Computer Science"]'::jsonb),
  ('teacher_portal_enabled', 'true'::jsonb),
  ('download_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 6. BOOKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  grade TEXT,
  subject TEXT,
  description TEXT,
  download_url TEXT,
  file_name TEXT,
  video_url TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_books_grade ON books(grade);
CREATE INDEX IF NOT EXISTS idx_books_subject ON books(subject);

-- =====================================================
-- 7. SUBJECT_TEACHERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS subject_teachers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade TEXT,
  section TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_subject_teachers_teacher_id ON subject_teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_subject_teachers_grade_section ON subject_teachers(grade, section);

-- =====================================================
-- 8. RESET_REQUESTS TABLE (Optional - for password resets)
-- =====================================================
CREATE TABLE IF NOT EXISTS reset_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reset_requests_token ON reset_requests(token);
CREATE INDEX IF NOT EXISTS idx_reset_requests_user_id ON reset_requests(user_id);

-- =====================================================
-- DEFAULT ADMIN USER
-- =====================================================
-- Insert default admin user (password: Admin123)
INSERT INTO users (id, email, password, role, full_name, name, admin_id, status) VALUES 
  ('admin-001', 'admin@excel.edu', 'Admin123', 'admin', 'Administrator', 'Admin', 'AD-2025-001', 'active')
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  admin_id = EXCLUDED.admin_id;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Note: For development, we're keeping RLS disabled
-- In production, you should enable RLS and create appropriate policies

-- Disable RLS for all tables (development mode)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE results DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE admissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE books DISABLE ROW LEVEL SECURITY;
ALTER TABLE subject_teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE reset_requests DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify all tables were created successfully
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'results', 'announcements', 'admissions', 
    'settings', 'books', 'subject_teachers', 'reset_requests'
  )
ORDER BY tablename;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- All tables have been created successfully!
-- Next steps:
-- 1. Copy your Supabase URL and anon key to .env.local
-- 2. Run: npx ts-node scripts/verify-supabase.ts
-- 3. Start the dev server: npm run dev
-- =====================================================

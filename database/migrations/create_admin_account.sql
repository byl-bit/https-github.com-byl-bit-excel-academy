-- Create/Update Default Admin Account for Password Reset
-- Run this in your Supabase SQL Editor after adding the admin_id column
-- This script creates the admin account with admin_id that can be used for password reset

-- Insert or update the default admin user
-- Password: Admin123 (in production, use a hashed password)
-- This script works with UUID primary key (Supabase default)
-- Uses email for conflict resolution since email is UNIQUE
-- Method 1: Using INSERT ... ON CONFLICT (works if email is UNIQUE)
INSERT INTO users (email, password, role, name, admin_id, status, created_at, updated_at)
VALUES (
    'admin@excel.edu',
    'Admin123', -- ⚠️ IMPORTANT: In production, hash this password before inserting
    'admin',
    'Administrator',
    'AD-2025-001', -- Admin ID used for password reset
    'active',
    NOW(),
    NOW()
)
ON CONFLICT (email) 
DO UPDATE SET
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    admin_id = EXCLUDED.admin_id,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Method 2: Alternative using DO block (if ON CONFLICT doesn't work)
-- Uncomment this if the INSERT above fails
/*
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM users WHERE email = 'admin@excel.edu' AND role = 'admin'
    ) THEN
        INSERT INTO users (email, password, role, name, admin_id, status, created_at, updated_at)
        VALUES (
            'admin@excel.edu',
            'Admin123', -- ⚠️ IMPORTANT: In production, hash this password before inserting
            'admin',
            'Administrator',
            'AD-2025-001',
            'active',
            NOW(),
            NOW()
        );
    ELSE
        UPDATE users
        SET 
            password = 'Admin123', -- ⚠️ IMPORTANT: In production, hash this password
            name = 'Administrator',
            admin_id = 'AD-2025-001',
            status = 'active',
            updated_at = NOW()
        WHERE email = 'admin@excel.edu' AND role = 'admin';
    END IF;
END $$;
*/

-- Verify the admin account was created
SELECT 
    id,
    email,
    name,
    admin_id,
    role,
    status,
    created_at
FROM users
WHERE role = 'admin';

-- Display credentials for reference
SELECT 
    'Admin Account Created Successfully!' AS message,
    'Email: admin@excel.edu' AS email,
    'Admin ID: AD-2025-001' AS admin_id,
    'Password: Admin123' AS password,
    '⚠️ Remember to hash the password in production!' AS warning;


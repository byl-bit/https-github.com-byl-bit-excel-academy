-- Migration: Add admin_id column to users table for admin password reset functionality
-- Run this in your Supabase SQL Editor

-- Add admin_id column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_id TEXT UNIQUE;

-- Create index for faster admin_id lookups
CREATE INDEX IF NOT EXISTS idx_users_admin_id ON users(admin_id) WHERE admin_id IS NOT NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name = 'admin_id';


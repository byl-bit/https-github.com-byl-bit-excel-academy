-- Migration: Add image_url column to announcements table
-- Run this in your Supabase SQL Editor if image uploads are not working

-- Add image_url column if it doesn't exist
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add type column if it doesn't exist (for compatibility)
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('general', 'academic', 'event'));

-- Add date column if it doesn't exist (for compatibility)
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS date TEXT;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'announcements' 
AND column_name IN ('image_url', 'type', 'date');


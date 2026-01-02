-- Add missing file_name column to books table
-- Run this in your Supabase SQL Editor if you get "Failed to save book" error

ALTER TABLE books ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'books' 
ORDER BY ordinal_position;

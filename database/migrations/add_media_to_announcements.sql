-- Migration: Add media column (jsonb) to announcements table
-- Stores an array of media items: [{ type: 'image'|'video', url: 'https://...', name: 'file.png' }]

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS media JSONB;

-- Optional: preserve legacy image_url by migrating existing values into media
UPDATE announcements
SET media = jsonb_build_array(jsonb_build_object('type', 'image', 'url', image_url, 'name', NULL))
WHERE image_url IS NOT NULL AND (media IS NULL OR jsonb_array_length(media) = 0);

-- Verify
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'announcements' AND column_name IN ('media');
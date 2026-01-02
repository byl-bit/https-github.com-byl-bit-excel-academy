-- Migration: create notifications table

CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type varchar(50) NOT NULL,
    category varchar(50) NOT NULL,
    user_id varchar(255),
    user_name varchar(255),
    action varchar(255) NOT NULL,
    details text,
    target_id varchar(255),
    target_name varchar(255),
    is_read boolean DEFAULT FALSE,
    created_at timestamptz DEFAULT now()
);

-- Index for faster queries on unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

# Admin Account Setup Guide

This guide explains how to set up an admin account with username and ID for password reset functionality.

## Overview

The admin password reset system uses:
- **Admin ID**: A unique identifier (e.g., `AD-2025-001`) used to identify the admin account
- **Email**: The admin's email address (e.g., `admin@excel.edu`)
- **Full Name**: The admin's full name (e.g., `Administrator`)

These credentials are required when using the Admin Gate Reset feature at `/auth/admin-gate-reset`.

## Setup Steps

### Step 1: Add admin_id Column to Database

If you're using Supabase and the `admin_id` column doesn't exist, run the migration:

```sql
-- Run this in Supabase SQL Editor
-- File: database/migrations/add_admin_id_to_users.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_id TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_admin_id ON users(admin_id) WHERE admin_id IS NOT NULL;
```

### Step 2: Create Admin Account

Run the admin account creation script:

```sql
-- Run this in Supabase SQL Editor
-- File: database/migrations/create_admin_account.sql
```

Or manually create the admin account:

```sql
INSERT INTO users (email, password, role, name, admin_id, status, created_at, updated_at)
VALUES (
    'admin@excel.edu',
    'Admin123',  -- ⚠️ IMPORTANT: Hash this password in production!
    'admin',
    'Administrator',
    'AD-2025-001',  -- Admin ID used for password reset
    'active',
    NOW(),
    NOW()
)
ON CONFLICT (email) 
DO UPDATE SET
    admin_id = EXCLUDED.admin_id,
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    status = EXCLUDED.status;
```

### Step 3: Verify Admin Account

Verify the admin account was created:

```sql
SELECT id, email, name, admin_id, role, status
FROM users
WHERE role = 'admin';
```

You should see:
- **Email**: `admin@excel.edu`
- **Admin ID**: `AD-2025-001`
- **Name**: `Administrator`
- **Status**: `active`

## Using Admin Password Reset

### Via Admin Gate Reset Page

1. Navigate to `/auth/admin-gate-reset`
2. Enter the following credentials:
   - **Admin ID**: `AD-2025-001`
   - **System Email**: `admin@excel.edu`
   - **Full Name**: `Administrator`
   - **New Password**: Enter your desired new password
3. Click "Override Password"

### Default Credentials

**Initial Login:**
- Email: `admin@excel.edu`
- Password: `Admin123`

**Password Reset:**
- Admin ID: `AD-2025-001`
- Email: `admin@excel.edu`
- Full Name: `Administrator`

⚠️ **Security Note**: Change the default password immediately after first login!

## Custom Admin Account

To create a custom admin account with a different Admin ID:

```sql
INSERT INTO users (email, password, role, name, admin_id, status, created_at, updated_at)
VALUES (
    'your-admin@excel.edu',
    'YourSecurePassword123',
    'admin',
    'Your Admin Name',
    'AD-2025-002',  -- Your custom Admin ID
    'active',
    NOW(),
    NOW()
);
```

## Troubleshooting

### Admin ID not found during password reset

1. Verify the `admin_id` column exists:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'users' AND column_name = 'admin_id';
   ```

2. Verify the admin account has an `admin_id`:
   ```sql
   SELECT id, email, name, admin_id FROM users WHERE role = 'admin';
   ```

3. If missing, add the column and update the admin account:
   ```sql
   ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_id TEXT UNIQUE;
   UPDATE users SET admin_id = 'AD-2025-001' WHERE role = 'admin' AND email = 'admin@excel.edu';
   ```

### Password reset fails with "Identity verification failed"

Ensure all three fields match exactly:
- Admin ID must match `admin_id` in database
- Email must match exactly (case-insensitive)
- Full Name must match `name` field in database

## API Integration

The password reset API endpoint (`/api/auth/reset-password`) supports admin password reset when `isAdminGate: true` is passed:

```typescript
const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        userId: 'AD-2025-001',  // Admin ID
        email: 'admin@excel.edu',
        fullName: 'Administrator',
        newPassword: 'NewSecurePassword123',
        isAdminGate: true
    })
});
```

The API now supports lookup by `admin_id`, `student_id`, `teacher_id`, or `id`.


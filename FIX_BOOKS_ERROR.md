# Fix: "Failed to add book" Error

## Problem
The books table is missing the `file_name` column, which causes the "Failed to save book" error when trying to add books to the library.

## Solution

### Option 1: Quick Fix (Recommended)
Run this single SQL command in your Supabase SQL Editor:

```sql
ALTER TABLE books ADD COLUMN IF NOT EXISTS file_name TEXT;
```

### Option 2: Verify and Add
1. Go to Supabase → SQL Editor
2. Run the migration file: `database/add-file-name-column.sql`
3. This will add the column and verify it was created

### Verification
After running the SQL, try adding a book again. The error should be resolved.

## Prevention
The main schema file (`database/schema.sql`) has been updated to include the `file_name` column. If you recreate the database in the future, use the updated schema file.

## What This Column Does
The `file_name` column stores the original filename when users upload files directly (instead of providing a URL). This allows the system to:
- Display the filename to users
- Provide proper download names
- Track what files have been uploaded

---

**Status**: Ready to fix - just run the SQL command above! ✅

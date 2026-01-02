# MANDATORY: Supabase Setup Guide

To complete the migration, you **must** perform the following steps manually. I cannot do these for you as they require access to your Supabase Dashboard.

### 1. Create a Supabase Project
- Go to [supabase.com](https://supabase.com/) and create a free project.
- Give it a name (e.g., `excel-academy`).

### 2. Run the SQL Schema
- In your Supabase Dashboard, go to the **SQL Editor** (left sidebar).
- Click **New Query**.
- Paste the following SQL and click **Run**:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users Table
create table users (
  id text primary key,
  email text unique,
  password text,
  role text,
  full_name text,
  "name" text,
  student_id text,
  teacher_id text,
  grade text,
  section text,
  status text,
  created_at timestamptz default now(),
  updated_at timestamptz,
  updated_by text
);

-- Results Table
create table results (
  id uuid default uuid_generate_v4() primary key,
  student_id text,
  grade text,
  section text,
  subjects jsonb,
  status text default 'pending',
  rank int,
  submitted_by text,
  submitted_at timestamptz default now(),
  published_at timestamptz,
  approved_by text,
  approved_at timestamptz
);

-- Announcements Table
create table announcements (
  id uuid default uuid_generate_v4() primary key,
  title text,
  content text,
  date text,
  created_at timestamptz default now()
);

-- Admissions Table
create table admissions (
  id text primary key,
  data jsonb,
  submitted_at timestamptz default now(),
  status text
);

-- Settings/System Table
create table settings (
  key text primary key,
  value jsonb
);

-- Books Table
create table books (
  id text primary key,
  title text,
  author text,
  grade text,
  subject text,
  description text,
  download_url text,
  video_url text,
  uploaded_at timestamptz default now()
);
```

### 3. Set Environment Variables
- In Supabase, go to **Project Settings** > **API**.
- Copy the **Project URL** and **anon public Key**.
- Create a file named `.env.local` in your project root (if it doesn't exist).
- Add the following lines:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key_here
```

### 4. Verify Connection
- Run the following command in your terminal to test if everything is working:
  ```bash
  npx ts-node scripts/verify-supabase.ts
  ```

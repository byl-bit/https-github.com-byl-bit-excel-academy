# Deployment Guide (Vercel)

The easiest way to deploy your Next.js application is using **Vercel**. It is free for hobby projects and provides seamless integration with GitHub and Supabase.

### 1. Push your code to GitHub
If you haven't already:
1. Initialize a Git repository: `git init`
2. Add your files: `git add .` (Make sure `.env.local` is **NOT** added. It should be in `.gitignore`)
3. Commit: `git commit -m "Migration to Supabase complete"`
4. Create a repository on GitHub and push your code.

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New** > **Project**.
3. Import your `excel-academy` repository.

### 3. Configure Environment Variables
During the import process, you will see a field for **Environment Variables**. You **MUST** add the keys from your `.env.local` here:

- `NEXT_PUBLIC_SUPABASE_URL` = (Your Project URL)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (Your Anon Key)

> [!IMPORTANT]
> If you skip this step, the website will build but the database features will not work in production.

### 4. Deploy!
1. Click **Deploy**.
2. Vercel will build your app and give you a public URL (e.g., `excel-academy.vercel.app`).

### 5. Final Pre-Flight Checks (Offline/Online Readiness)
Before you go officially public, verify these high-security settings:

- **Master Admin ID**: Ensure you know your unique Admin ID (stored in `AD-2025-001` by default).
- **Secret Recovery Gate**: If you lose your password, navigate to `/auth/admin-gate-reset`. This page is hidden from all navigation menus.
- **Master Admin Creds**: The system currently enforces `admin@excel.edu` / `Admin123` as the master backup.

### 6. Post-Deployment Check
1. Visit your new URL.
2. Try to log in with the default admin (`admin@excel.edu` / `Admin123`).
3. If you see your dashboard, you are live!

### Why Vercel?
- **Global CDN**: Your site will be fast everywhere.
- **Auto-Deploys**: Every time you push to GitHub, Vercel updates the site.
- **Free Tier**: Perfect for school projects.

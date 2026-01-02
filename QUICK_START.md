# 🚀 Quick Start Guide - Excel Academy

## Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier works fine)

---

## Step 1: Supabase Setup (5 minutes)

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Name**: `excel-academy`
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
4. Click **"Create new project"** and wait ~2 minutes

### 1.2 Run Database Schema
1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Open the file [`database/schema.sql`](file:///c:/Users/BYL/OneDrive/Desktop/excel-academy/database/schema.sql) from this project
4. Copy ALL the SQL content
5. Paste it into the Supabase SQL Editor
6. Click **"Run"** (bottom right)
7. You should see: "Success. No rows returned"

### 1.3 Get Your API Credentials
1. In Supabase, go to **Settings** → **API** (left sidebar)
2. Find these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")
3. Keep this tab open - you'll need these in the next step

---

## Step 2: Configure Environment Variables (1 minute)

1. Open the file `.env.local` in your project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Save the file

---

## Step 3: Verify Database Connection (1 minute)

Open PowerShell in your project directory and run:

```powershell
# If you get a script execution error, run this first:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then verify the database connection:
npx ts-node scripts/verify-supabase.ts
```

You should see:
```
✅ Users table: Connected
✅ Results table: Connected
✅ Announcements table: Connected
✅ Admissions table: Connected
✅ Settings table: Connected
✅ Books table: Connected
✅ Subject_teachers table: Connected
```

---

## Step 4: Start the Development Server

The easiest way to start the system is by running the unified control script:
```batch
START_SYSTEM.bat
```
This script will automatically verify dependencies, clear ports, and launch the server at: **http://localhost:3000**

---

## Step 5: Login

### Admin Account (Pre-configured)
- **Email**: `admin@excel.edu`
- **Password**: `Admin123`

### Create Student/Teacher Accounts
1. Go to **Admin Portal** → **User Management**
2. Click **"Add User"** or use the bulk import feature

---

## 🎉 You're All Set!

### What You Can Do Now:
- ✅ Manage users (students, teachers, admins)
- ✅ Submit and publish results
- ✅ Create announcements
- ✅ Manage library resources
- ✅ Process admission applications
- ✅ Generate report cards
- ✅ Assign teachers to subjects and classes

### Default Admin Features:
- **User Management**: Approve/reject registrations
- **Results Management**: Publish grades, generate PDFs
- **Academic Settings**: Manage subjects, assign teachers
- **System Controls**: Reset data, view activity logs

---

## 📚 Additional Resources

- **Database Schema**: [`database/schema.sql`](file:///c:/Users/BYL/OneDrive/Desktop/excel-academy/database/schema.sql)
- **Connectivity Report**: [`DATABASE_CONNECTIVITY_REPORT.md`](file:///c:/Users/BYL/OneDrive/Desktop/excel-academy/DATABASE_CONNECTIVITY_REPORT.md)
- **Deployment Guide**: [`DEPLOYMENT_GUIDE.md`](file:///c:/Users/BYL/OneDrive/Desktop/excel-academy/DEPLOYMENT_GUIDE.md)
- **Full Documentation**: [`WEBSITE_FUNCTIONALITY_REPORT.md`](file:///c:/Users/BYL/OneDrive/Desktop/excel-academy/WEBSITE_FUNCTIONALITY_REPORT.md)

---

## 🐛 Troubleshooting

### "Missing environment variables"
- Check that `.env.local` exists and has correct values
- Restart the dev server after changing `.env.local`

### "Table does not exist"
- Make sure you ran the complete SQL schema in Supabase
- Check the SQL Editor for any error messages

### "PowerShell script execution disabled"
- Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- Run as Administrator if needed

### "Port 3000 already in use"
- Use the provided script: `.\clear-port-3000.ps1`
- Or manually change the port in `package.json`

---

## 🚀 Next Steps

1. **Customize Subjects**: Admin Portal → Settings → Academic Assign
2. **Add Teachers**: Admin Portal → User Management → Add User
3. **Create Students**: Admin Portal → User Management → Bulk Import
4. **Assign Classes**: Admin Portal → Settings → Subject-Teacher Allocation
5. **Submit Results**: Teacher Portal → Marks → Enter grades
6. **Publish Results**: Admin Portal → Results → Approve pending results

---

## 💡 Tips

- Use **Excel import** for bulk student/result uploads
- The **Homeroom Manager** gives teachers a consolidated view
- Students can download their report cards as PDFs
- All data is stored securely in Supabase
- The system supports multiple teachers per subject/class

---

**Need Help?** Check the documentation files or review the database connectivity report for detailed technical information.

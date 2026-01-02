# OneDrive + Turbopack Issue - Solution Guide

## The Problem
Next.js 16 uses Turbopack by default, which has a known bug with OneDrive paths on Windows due to symlink restrictions.

## Quick Fix (Try This First)

I've updated `next.config.ts` to disable Turbopack. Try starting the server now:

```bash
# Delete .next folder
rmdir /s /q .next

# Start server
npm run dev
```

Or just double-click `start-server.bat`

---

## If That Doesn't Work

### Option 1: Move Project Out of OneDrive (Recommended)

1. **Copy your project** to a local folder:
   ```
   From: C:\Users\BYL\OneDrive\Desktop\excel-academy
   To:   C:\Projects\excel-academy
   ```

2. **Open the new location** in your editor

3. **Start the server** - it will work perfectly!

### Option 2: Downgrade Next.js (Not Recommended)

```bash
npm install next@15.1.0
```

This uses an older version without Turbopack.

---

## Why This Happens

- **OneDrive** syncs files and creates symlinks
- **Turbopack** (Next.js 16's bundler) can't handle OneDrive symlinks on Windows
- **Webpack** (the old bundler) works fine with OneDrive

---

## Recommended Solution

**Move the project to `C:\Projects\excel-academy`** for best performance and no issues.

Your `.env.local` and all files will work exactly the same in the new location!

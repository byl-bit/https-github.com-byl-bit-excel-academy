# 🏁 Quick Guide: Saving your work with Git

Git is like a "Save Point" for your code. If you make a mistake later, you can always go back to a version that worked.

---

### Step 1: Initialize Git
Open your terminal in the project folder and run:
```bash
git init
```
*This creates a hidden `.git` folder that tracks your changes.*

### Step 2: Check Status
To see which files have changed:
```bash
git status
```

### Step 3: "Stage" your files
Before saving, tell Git which files to include:
```bash
git add .
```
*(The `.` means "include everything in this folder")*

### Step 4: "Commit" (Save)
Save your changes with a descriptive message:
```bash
git commit -m "Initial commit: Professional School Portal with Supabase"
```

---

### 🚀 Saving to the Cloud (GitHub)
To keep your code safe online and ready for Vercel deployment:

1. Create a "New Repository" on [GitHub](https://github.com/new).
2. Follow the commands provided by GitHub to connect your local code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/excel-academy.git
   git branch -M main
   git push -u origin main
   ```

### 💡 Pro Tips:
- **Commit Often**: Large changes are harder to fix than small ones.
- **Gitignore**: Your `.env.local` is already ignored via the `.gitignore` file. This is good! It keeps your database passwords private and off the internet.

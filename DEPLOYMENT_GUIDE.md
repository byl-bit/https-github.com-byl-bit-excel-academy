# How to Update Your Website

This guide explains how to make changes to your code and deploy them to your live website.

## Prerequisites
- **VS Code**: Your code editor.
- **Terminal**: The command line interface inside VS Code (Ctrl+`).

## Step-by-Step Guide

### 1. Make Your Changes
Open the files you want to edit in VS Code and make your changes. 
*Example: Updating text on the home page, adding a new image, or fixing a bug.*

**Important**: Always save your files (Ctrl+S) after editing.

### 2. Check Your Changes (Optional)
Open the terminal in VS Code and type:
```bash
git status
```
This will show you which files you have modified (they will appear in red).

### 3. Stage Your Changes
To prepare all your modified files for uploading, type:
```bash
git add .
```
*(The dot `.` means "all files" in the current directory).*

### 4. Commit Your Changes
Save a snapshot of your changes with a descriptive message explaining what you did:
```bash
git commit -m "Describe your changes here"
```
*Example: `git commit -m "Update homepage title"`*

### 5. Push to Deployment
Send your changes to GitHub. This will **automatically trigger Vercel** to update your live website.
```bash
git push
```

### 6. Wait for Deployment
- Go to your Vercel Dashboard or just wait about 1-2 minutes.
- Refresh your live website URL to see the changes!

---

## Summary of Commands
Run these 3 commands in order whenever you want to update the site:

1. `git add .`
2. `git commit -m "Your message"`
3. `git push`
